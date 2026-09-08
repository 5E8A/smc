import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CircleNotchIcon,
  FloppyDiskIcon,
  LightningIcon,
  PlusIcon,
  TrashIcon,
  WarningIcon,
  XIcon,
} from "@phosphor-icons/react";
import { MODRINTH_API_BASE, MODRINTH_CDN, MODRINTH_PROJECT_ID } from "@smc/shared/constants";
import { getModList, putModList } from "../api";
import type { Issue, ModListColumn } from "../types";
import { useRunConsole } from "../lib/runConsole";
import { Button } from "../components/ui/fields";
import { Banner } from "../components/ui/Banner";

interface ModrinthProject {
  id: string;
  slug: string;
  title: string;
  description?: string;
  icon_url?: string | null;
}

const USER_AGENT = "SMCSite/cms-mods";

const safeIconUrl = (url: string | null | undefined): string | null =>
  typeof url === "string" && url.startsWith(MODRINTH_CDN) ? url : null;

const slugFromInput = (input: string): string => {
  const trimmed = input.trim();
  if (!trimmed) return "";
  try {
    if (/^https?:\/\//i.test(trimmed)) {
      const url = new URL(trimmed);
      const host = url.hostname.replace(/^www\./, "");
      if (!/^modrinth\.com$/i.test(host)) return "";
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[0] === "mod" && parts[1]) return parts[1];
      return "";
    }
  } catch {
    return "";
  }
  return /^[a-z0-9][a-z0-9-]*$/.test(trimmed) ? trimmed : "";
};

const fetchProjects = async (slugs: string[]): Promise<Map<string, ModrinthProject>> => {
  const out = new Map<string, ModrinthProject>();
  if (slugs.length === 0) return out;
  for (let i = 0; i < slugs.length; i += 100) {
    const batch = slugs.slice(i, i + 100);
    const res = await fetch(`${MODRINTH_API_BASE}/projects?ids=${encodeURIComponent(JSON.stringify(batch))}`, {
      headers: { "User-Agent": USER_AGENT },
    });
    if (!res.ok) return out;
    const body = (await res.json()) as ModrinthProject[];
    if (!Array.isArray(body)) return out;
    for (const p of body) out.set(p.slug, p);
  }
  return out;
};

const searchProjects = async (query: string): Promise<ModrinthProject[]> => {
  const params = new URLSearchParams({
    query,
    facets: JSON.stringify([["project_type:mod"]]),
    limit: "10",
  });
  const res = await fetch(`${MODRINTH_API_BASE}/search?${params}`, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) return [];
  const body = (await res.json()) as { hits?: ModrinthProject[] };
  return Array.isArray(body.hits) ? body.hits : [];
};

interface ModrinthVersion {
  id: string;
  project_id: string;
  version_number: string;
  dependencies: { project_id: string; dependency_type: string }[];
}

const fetchPackSlugs = async (): Promise<string[]> => {
  const projectRes = await fetch(`${MODRINTH_API_BASE}/project/${MODRINTH_PROJECT_ID}`, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!projectRes.ok) throw new Error(`Modrinth project ${projectRes.status}`);
  const project = (await projectRes.json()) as { versions: string[] };
  if (!project.versions?.length) throw new Error("No versions found for modpack");

  const versionId = project.versions[project.versions.length - 1]!;
  const versionRes = await fetch(`${MODRINTH_API_BASE}/version/${versionId}`, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!versionRes.ok) throw new Error(`Modrinth version ${versionRes.status}`);
  const version = (await versionRes.json()) as ModrinthVersion;

  const depIds = [
    ...new Set(version.dependencies.filter((d) => d.dependency_type === "embedded").map((d) => d.project_id)),
  ];
  if (depIds.length === 0) return [];

  const slugs: string[] = [];
  for (let i = 0; i < depIds.length; i += 100) {
    const batch = depIds.slice(i, i + 100);
    const res = await fetch(`${MODRINTH_API_BASE}/projects?ids=${encodeURIComponent(JSON.stringify(batch))}`, {
      headers: { "User-Agent": USER_AGENT },
    });
    if (!res.ok) continue;
    const body = (await res.json()) as { slug: string }[];
    if (Array.isArray(body)) {
      for (const p of body) slugs.push(p.slug);
    }
  }
  return [...new Set(slugs)];
};

interface Draft {
  input: string;
  hits: ModrinthProject[];
  searching: boolean;
  error: string | null;
}

const emptyDraft = (): Draft => ({ input: "", hits: [], searching: false, error: null });

export function ModsBoard() {
  const [columns, setColumns] = useState<ModListColumn[] | null>(null);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<Issue[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [meta, setMeta] = useState<Map<string, ModrinthProject>>(new Map());
  const runConsole = useRunConsole();
  const syncing = !!runConsole.statuses.mods?.running;
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [drag, setDrag] = useState<{ slug: string; from: string } | null>(null);
  const [dragOver, setDragOver] = useState<{ col: string; index: number } | null>(null);
  const searchTimers = useRef<Record<string, number>>({});

  const [packSlugs, setPackSlugs] = useState<string[] | null>(null);
  const [packLoading, setPackLoading] = useState(true);
  const [packError, setPackError] = useState<string | null>(null);

  const slack = useMemo(() => (columns ? columns.flatMap((c) => c.slugs) : []), [columns]);
  const slugSet = useMemo(() => new Set(slack), [slack]);

  const categorizedSlugs = useMemo(() => new Set(columns?.flatMap((c) => c.slugs) ?? []), [columns]);
  const uncategorizedSlugs = useMemo(
    () => (packSlugs ? packSlugs.filter((s) => !categorizedSlugs.has(s)) : []),
    [packSlugs, categorizedSlugs]
  );
  const staleSlugs = useMemo(
    () =>
      packSlugs
        ? new Set(columns?.flatMap((c) => c.slugs).filter((s) => !packSlugs.includes(s)) ?? [])
        : new Set<string>(),
    [packSlugs, columns]
  );

  const cancelSearch = useCallback((key: string) => {
    window.clearTimeout(searchTimers.current[key]);
  }, []);

  const scheduleSearch = useCallback(
    (key: string, value: string) => {
      const slug = slugFromInput(value);
      window.clearTimeout(searchTimers.current[key]);
      if (!slug || slugSet.has(slug)) return;
      searchTimers.current[key] = window.setTimeout(() => {
        searchProjects(slug)
          .then((hits) => setDrafts((d) => (d[key] ? { ...d, [key]: { ...d[key], hits, searching: false } } : d)))
          .catch(() => setDrafts((d) => (d[key] ? { ...d, [key]: { ...d[key], searching: false } } : d)));
        setDrafts((d) => (d[key] ? { ...d, [key]: { ...d[key], hits: [], searching: true } } : d));
      }, 300);
    },
    [slugSet]
  );

  useEffect(() => {
    const timers = searchTimers.current;
    return () => {
      for (const t of Object.values(timers)) window.clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    getModList()
      .then((list) => {
        setColumns(list);
        setSnapshot(JSON.stringify(list));
      })
      .catch((err) => setError(String(err)));
  }, []);

  useEffect(() => {
    fetchPackSlugs()
      .then(setPackSlugs)
      .catch((err) => setPackError(err instanceof Error ? err.message : String(err)))
      .finally(() => setPackLoading(false));
  }, []);

  const refreshMeta = useCallback(async (list: ModListColumn[]) => {
    try {
      const found = await fetchProjects(list.flatMap((c) => c.slugs));
      setMeta((prev) => new Map([...prev, ...found]));
    } catch {
      // enrichment is best-effort
    }
  }, []);

  useEffect(() => {
    if (!columns) return;
    const missing = [...columns.flatMap((c) => c.slugs), ...uncategorizedSlugs].filter((s) => !meta.has(s));
    if (missing.length === 0) return;
    void fetchProjects(missing)
      .then((found) => setMeta((prev) => new Map([...prev, ...found])))
      .catch(() => {});
  }, [columns, meta, uncategorizedSlugs]);

  const dirty = columns !== null && snapshot !== JSON.stringify(columns);
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const UNCATEGORIZED_KEY = "__uncategorized";

  const moveCard = useCallback((slug: string, fromKey: string, toKey: string, toIndex: number) => {
    setColumns((cols) => {
      if (!cols) return cols;
      const next = cols.map((c) => ({ key: c.key, slugs: [...c.slugs] }));

      if (fromKey === UNCATEGORIZED_KEY) {
        const to = next.find((c) => c.key === toKey);
        if (!to) return cols;
        if (to.slugs.includes(slug)) return cols;
        to.slugs.splice(toIndex, 0, slug);
        return next;
      }

      const from = next.find((c) => c.key === fromKey);
      const to = next.find((c) => c.key === toKey);
      if (!from || !to) return cols;
      const idx = from.slugs.indexOf(slug);
      if (idx === -1) return cols;
      from.slugs.splice(idx, 1);
      if (from === to && toIndex > idx) toIndex -= 1;
      to.slugs.splice(toIndex, 0, slug);
      return next;
    });
  }, []);

  const removeCard = useCallback((slug: string, key: string) => {
    if (!window.confirm(`Remove "${slug}" from ${key}?\nSave writes it to @scripts/mod-list.json.`)) return;
    setColumns((cols) =>
      cols ? cols.map((c) => (c.key === key ? { ...c, slugs: c.slugs.filter((s) => s !== slug) } : c)) : cols
    );
  }, []);

  const addSlug = useCallback(
    (key: string, slug: string) => {
      cancelSearch(key);
      setColumns((cols) => {
        if (!cols) return cols;
        if (cols.find((c) => c.key === key)?.slugs.includes(slug)) return cols;
        return cols.map((c) => (c.key === key ? { ...c, slugs: [...c.slugs, slug] } : c));
      });
      setDrafts((d) => {
        const next = { ...d };
        delete next[key];
        return next;
      });
    },
    [cancelSearch]
  );

  const applyDraftSearch = useCallback(
    async (key: string) => {
      const draft = drafts[key];
      if (!draft) return;
      const slug = slugFromInput(draft.input);
      if (!slug) {
        setDrafts((d) => {
          const cur = d[key];
          if (!cur) return d;
          return {
            ...d,
            [key]: { ...cur, error: "Enter a modrinth slug or a modrinth.com/mod/<slug> URL" },
          };
        });
        return;
      }
      if (slugSet.has(slug)) {
        setDrafts((d) => {
          const cur = d[key];
          if (!cur) return d;
          return { ...d, [key]: { ...cur, error: `${slug} is already on the board` } };
        });
        return;
      }
      addSlug(key, slug);
    },
    [drafts, slugSet, addSlug]
  );

  const save = useCallback(async () => {
    if (saving || !columns) return;
    setSaving(true);
    setError(null);
    setIssues(null);
    try {
      const result = await putModList(columns);
      if (result.ok && result.data) {
        setColumns(result.data);
        setSnapshot(JSON.stringify(result.data));
        setJustSaved(true);
        window.setTimeout(() => setJustSaved(false), 2000);
      }
      setIssues(result.issues.length > 0 ? result.issues : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }, [saving, columns]);

  const sync = useCallback(() => {
    if (syncing) return;
    setError(null);
    setSyncStatus(null);
    void runConsole.start("mods", "/api/mods/sync", {
      onDone: (status) => {
        setSyncStatus(status === "ok" ? "Pipeline finished" : `Pipeline ${status}`);
        getModList()
          .then((list) => {
            setColumns(list);
            setSnapshot(JSON.stringify(list));
            void refreshMeta(list);
          })
          .catch(() => {});
      },
      onError: (err) => setError(err instanceof Error ? err.message : String(err)),
    });
  }, [syncing, refreshMeta, runConsole]);

  if (error && !columns) return <div className="m-6 rounded-md bg-red-950/50 p-4 text-sm text-red-300">{error}</div>;
  if (!columns) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-zinc-400">
        <CircleNotchIcon size={18} className="animate-spin" /> Loading mod list…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" onClick={() => void save()} disabled={!dirty || saving}>
          {saving ? <CircleNotchIcon size={15} className="animate-spin" /> : <FloppyDiskIcon size={15} />}
          Save
        </Button>
        <Button onClick={() => void sync()} disabled={syncing}>
          {syncing ? <CircleNotchIcon size={15} className="animate-spin" /> : <LightningIcon size={15} />}
          {syncing ? "Syncing…" : "Sync sprites"}
        </Button>
        {justSaved && <span className="text-xs font-semibold text-green-400">Saved ✓</span>}
        {syncStatus && <span className="text-xs font-semibold text-zinc-400">{syncStatus}</span>}
        <span className="ml-auto text-[11px] text-zinc-600">
          Drag to reorder or move between columns · save writes @scripts/mod-list.json
        </span>
      </div>

      {packLoading && (
        <div className="flex items-center gap-2 text-[11px] text-zinc-500">
          <CircleNotchIcon size={12} className="animate-spin" /> Fetching modpack data…
        </div>
      )}
      {packError && !packLoading && (
        <Banner variant="warn" dismissable onDismiss={() => setPackError(null)}>
          <span className="font-mono">Pack metadata: {packError}</span>
        </Banner>
      )}
      {packSlugs && !packLoading && (
        <div className="flex items-center gap-3 text-[11px] text-zinc-500">
          <span>
            📦 {packSlugs.length} mods in pack · {categorizedSlugs.size} categorized · {uncategorizedSlugs.length}{" "}
            uncategorized
            {staleSlugs.size > 0 && <span className="text-amber-400"> · {staleSlugs.size} stale</span>}
          </span>
        </div>
      )}

      {error && (
        <Banner variant="error" dismissable onDismiss={() => setError(null)}>
          <span className="font-mono break-all">{error}</span>
        </Banner>
      )}

      {issues && issues.length > 0 && (
        <Banner variant={issues.some((i) => i.severity === "error") ? "error" : "warn"}>
          {issues.map((issue, i) => (
            <div key={i} className="font-mono">
              [{issue.entry >= 0 ? issue.entry : "-"}] {issue.field}: {issue.message}
            </div>
          ))}
        </Banner>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {columns.map((col) => {
          const draft = drafts[col.key];
          return (
            <section
              key={col.key}
              className="min-h-48 rounded-lg border border-zinc-800 bg-zinc-950/60 p-3"
              onDragOver={(e) => {
                e.preventDefault();
                if (dragOver?.col !== col.key) setDragOver({ col: col.key, index: col.slugs.length });
              }}
              onDragLeave={() => setDragOver((d) => (d?.col === col.key ? null : d))}
              onDrop={() => {
                if (drag) {
                  moveCard(drag.slug, drag.from, col.key, col.slugs.length);
                  setDrag(null);
                }
                setDragOver(null);
              }}
            >
              <header className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white capitalize">{col.key}</h3>
                <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-bold text-zinc-400">
                  {col.slugs.length}
                </span>
              </header>

              <ul className="space-y-1.5">
                {col.slugs.map((slug, index) => {
                  const project = meta.get(slug);
                  const iconUrl = safeIconUrl(project?.icon_url);
                  const isDragging = drag?.slug === slug;
                  const isStale = staleSlugs.has(slug);
                  return (
                    <li
                      key={slug}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = "move";
                        setDrag({ slug, from: col.key });
                      }}
                      onDragEnd={() => setDrag(null)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOver({ col: col.key, index });
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (drag && drag.slug !== slug) moveCard(drag.slug, drag.from, col.key, index);
                        setDrag(null);
                        setDragOver(null);
                      }}
                      className={`flex items-center gap-2 rounded-md border p-2 ${
                        isDragging
                          ? "border-green-700 bg-green-950/40 opacity-40"
                          : dragOver?.col === col.key && dragOver.index === index
                            ? "border-green-700 bg-zinc-900"
                            : isStale
                              ? "border-l-2 border-amber-600 bg-zinc-900"
                              : "border-zinc-800 bg-zinc-900"
                      }`}
                    >
                      {iconUrl ? (
                        <img
                          src={iconUrl}
                          alt=""
                          width={24}
                          height={24}
                          loading="lazy"
                          className="h-6 w-6 shrink-0 rounded object-cover"
                        />
                      ) : (
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-zinc-800 text-[10px] text-zinc-500">
                          cube
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold text-white">{project?.title ?? slug}</div>
                        {project?.description && (
                          <div className="truncate text-[10px] text-zinc-500">{project.description}</div>
                        )}
                      </div>
                      {isStale && (
                        <span title="Not in current pack">
                          <WarningIcon size={14} className="shrink-0 text-amber-500" />
                        </span>
                      )}
                      <div className="flex shrink-0 items-center gap-0.5">
                        <button
                          type="button"
                          title="Move up"
                          disabled={index === 0}
                          onClick={() => moveCard(slug, col.key, col.key, index - 1)}
                          className="rounded p-1 text-zinc-500 hover:text-zinc-200 disabled:opacity-30"
                        >
                          <ArrowUpIcon size={12} />
                        </button>
                        <button
                          type="button"
                          title="Move down"
                          disabled={index === col.slugs.length - 1}
                          onClick={() => moveCard(slug, col.key, col.key, index + 2)}
                          className="rounded p-1 text-zinc-500 hover:text-zinc-200 disabled:opacity-30"
                        >
                          <ArrowDownIcon size={12} />
                        </button>
                        <button
                          type="button"
                          title="Remove"
                          onClick={() => removeCard(slug, col.key)}
                          className="rounded p-1 text-zinc-500 hover:text-red-400"
                        >
                          <TrashIcon size={12} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-2">
                {draft ? (
                  <div className="relative">
                    <div className="flex gap-1">
                      <input
                        value={draft.input}
                        onChange={(e) => {
                          const value = e.target.value;
                          setDrafts((d) => {
                            const cur = d[col.key];
                            if (!cur) return d;
                            const typed = slugFromInput(value);
                            const inside = typed !== "" && slugSet.has(typed);
                            return {
                              ...d,
                              [col.key]: {
                                ...cur,
                                input: value,
                                error: null,
                                hits: inside || typed === "" ? [] : cur.hits,
                              },
                            };
                          });
                          scheduleSearch(col.key, value);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.nativeEvent.isComposing) void applyDraftSearch(col.key);
                          if (e.key === "Escape") {
                            cancelSearch(col.key);
                            setDrafts((d) => {
                              const next = { ...d };
                              delete next[col.key];
                              return next;
                            });
                          }
                        }}
                        placeholder="modrinth.com/mod/<slug>"
                        autoFocus
                        className="min-w-0 flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-white placeholder:text-zinc-600 focus:border-green-600 focus:outline-none"
                      />
                      <button
                        type="button"
                        title="Dismiss"
                        onClick={() => {
                          cancelSearch(col.key);
                          setDrafts((d) => {
                            const next = { ...d };
                            delete next[col.key];
                            return next;
                          });
                        }}
                        className="rounded p-1 text-zinc-500 hover:text-zinc-200"
                      >
                        <XIcon size={12} />
                      </button>
                    </div>
                    {draft.error && <p className="mt-1 text-[10px] text-red-400">{draft.error}</p>}
                    {draft.hits.length > 0 && (
                      <ul className="absolute inset-x-0 top-full z-30 mt-1 max-h-48 overflow-y-auto rounded-md border border-zinc-700 bg-zinc-900 py-1 shadow-xl">
                        {draft.hits.map((hit) => {
                          const iconUrl = safeIconUrl(hit.icon_url);
                          return (
                            <li key={hit.slug}>
                              <button
                                type="button"
                                onClick={() => addSlug(col.key, hit.slug)}
                                className="flex w-full items-center gap-2 px-2 py-1.5 text-left hover:bg-zinc-800"
                              >
                                {iconUrl ? (
                                  <img
                                    src={iconUrl}
                                    alt=""
                                    width={20}
                                    height={20}
                                    loading="lazy"
                                    className="h-5 w-5 shrink-0 rounded object-cover"
                                  />
                                ) : (
                                  <span className="h-5 w-5 shrink-0 rounded bg-zinc-800" />
                                )}
                                <span className="min-w-0">
                                  <span className="block truncate text-xs font-semibold text-white">{hit.title}</span>
                                  <span className="block truncate text-[10px] text-zinc-500">{hit.slug}</span>
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    {draft.searching && (
                      <p className="mt-1 flex items-center gap-1 text-[10px] text-zinc-500">
                        <CircleNotchIcon size={10} className="animate-spin" /> searching Modrinth…
                      </p>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDrafts((d) => ({ ...d, [col.key]: emptyDraft() }))}
                    className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-zinc-700 px-2 py-1 text-xs text-zinc-500 hover:border-green-700 hover:text-green-400"
                  >
                    <PlusIcon size={12} /> Add mod
                  </button>
                )}
              </div>
            </section>
          );
        })}

        {packSlugs && uncategorizedSlugs.length > 0 && (
          <section
            key={UNCATEGORIZED_KEY}
            className="min-h-48 rounded-lg border border-dashed border-amber-800 bg-amber-950/20 p-3"
            onDragOver={(e) => {
              e.preventDefault();
              if (dragOver?.col !== UNCATEGORIZED_KEY) setDragOver({ col: UNCATEGORIZED_KEY, index: 0 });
            }}
            onDragLeave={() => setDragOver((d) => (d?.col === UNCATEGORIZED_KEY ? null : d))}
            onDrop={() => setDragOver(null)}
          >
            <header className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-amber-400">Uncategorized</h3>
              <span className="rounded bg-amber-900/50 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                {uncategorizedSlugs.length}
              </span>
            </header>

            <ul className="space-y-1.5">
              {uncategorizedSlugs.map((slug) => {
                const project = meta.get(slug);
                const iconUrl = safeIconUrl(project?.icon_url);
                const isDragging = drag?.slug === slug;
                return (
                  <li
                    key={slug}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "move";
                      setDrag({ slug, from: UNCATEGORIZED_KEY });
                    }}
                    onDragEnd={() => setDrag(null)}
                    className={`flex items-center gap-2 rounded-md border p-2 ${
                      isDragging ? "border-amber-600 bg-amber-950/40 opacity-40" : "border-amber-800/50 bg-amber-950/30"
                    }`}
                  >
                    {iconUrl ? (
                      <img
                        src={iconUrl}
                        alt=""
                        width={24}
                        height={24}
                        loading="lazy"
                        className="h-6 w-6 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-amber-900/30 text-[10px] text-amber-600">
                        cube
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold text-white">{project?.title ?? slug}</div>
                      {project?.description && (
                        <div className="truncate text-[10px] text-zinc-500">{project.description}</div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
