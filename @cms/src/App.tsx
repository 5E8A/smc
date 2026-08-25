import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CaretLeftIcon,
  CaretRightIcon,
  CircleNotchIcon,
  FloppyDiskIcon,
  MonitorIcon,
  TrashIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { ApiError, getAuthors, getContent, putAuthors, putContent, validateContent } from "./api";
import {
  isBlogPost,
  type Author,
  type BlogPost,
  type Entry,
  type Issue,
  type Kind,
  type Lang,
  type WikiDoc,
} from "./types";
import { isoToDisplay, todayIso } from "./lib/dates";
import { ListPanel } from "./components/ListPanel";
import { EntryList } from "./components/EntryList";
import { PostEditor } from "./components/PostEditor";
import { WikiEditor } from "./components/WikiEditor";
import { AuthorForm } from "./components/AuthorsView";
import { AssetsView } from "./components/AssetsView";
import { ConverterView } from "./components/ConverterView";
import { ModsBoard } from "./components/ModsBoard";
import { PreviewWindow } from "./components/PreviewWindow";
import { invalidateAuthorCache } from "./components/AuthorPicker";
import { Button } from "./components/fields";

type Tab = "posts" | "wiki" | "mods" | "authors" | "assets" | "converter";
const TABS: Tab[] = ["posts", "wiki", "mods", "authors", "assets", "converter"];

interface TabState {
  entries: Entry[];
  snapshot: string;
  selectedId: string | null;
}

type TabMap = Record<string, TabState | undefined>;

const tabKey = (lang: Lang, tab: Tab): string => `${lang}:${tab}`;
const kindOf = (tab: Tab): Kind => (tab === "wiki" ? "wiki" : "posts");

const LANGS_URL: Lang[] = ["en", "pl"];

interface BootState {
  tab: Tab;
  lang: Lang;
  entryHint: string | null;
}

const bootState = (): BootState => {
  const p = new URLSearchParams(window.location.search);
  const rawTab = p.get("tab");
  const rawLang = p.get("lang");
  return {
    tab: TABS.includes(rawTab as Tab) ? (rawTab as Tab) : "posts",
    lang: LANGS_URL.includes(rawLang as Lang) ? (rawLang as Lang) : "en",
    entryHint: p.get("entry"),
  };
};

const numericPart = (id: string): number => {
  const m = /^(?:wiki-\w\w-)?(\d+)$/.exec(id);
  return m ? Number.parseInt(m[1], 10) : 0;
};

const nextIdFor = (entries: Entry[], kind: Kind, lang: Lang): string =>
  kind === "posts"
    ? String(entries.reduce((m, e) => Math.max(m, numericPart(e.id)), 0) + 1)
    : `wiki-${lang}-${entries.reduce((m, e) => Math.max(m, numericPart(e.id)), 0) + 1}`;

function useLiveValidation(tab: Tab, lang: Lang, entries: Entry[] | null): Issue[] | null {
  const [result, setResult] = useState<{ key: string; issues: Issue[] | null }>({ key: "", issues: null });
  const serialized = useMemo(() => (entries ? JSON.stringify(entries) : null), [entries]);
  const key = `${tab}:${lang}`;

  useEffect(() => {
    if (!serialized) return;
    const t = window.setTimeout(() => {
      validateContent(kindOf(tab), lang, JSON.parse(serialized))
        .then((r) => setResult({ key, issues: r.issues }))
        .catch(() => setResult({ key, issues: null }));
    }, 600);
    return () => window.clearTimeout(t);
  }, [key, serialized, tab, lang]);

  return entries !== null && result.key === key ? result.issues : null;
}

const BOOT = bootState();

export const App = () => {
  const [tab, setTab] = useState<Tab>(BOOT.tab);
  const [lang, setLang] = useState<Lang>(BOOT.lang);
  const [tabs, setTabs] = useState<TabMap>({});
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveIssues, setSaveIssues] = useState<Issue[] | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const inflight = useRef<Set<string>>(new Set());

  const [authors, setAuthors] = useState<Author[] | null>(null);
  const [authorsSnapshot, setAuthorsSnapshot] = useState("");
  const [selectedAuthorIndex, setSelectedAuthorIndex] = useState<number | null>(null);
  const [authorsError, setAuthorsError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const contentTab = tab === "posts" || tab === "wiki";
  const otherLang: Lang = lang === "en" ? "pl" : "en";
  const key = tabKey(lang, tab);
  const state = tabs[key];
  const selected = state?.entries.find((e) => e.id === state.selectedId) ?? null;

  useEffect(() => {
    const p = new URLSearchParams();
    p.set("tab", tab);
    if (contentTab) {
      p.set("lang", lang);
      if (state?.selectedId) p.set("entry", state.selectedId);
    }
    const qs = p.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [tab, lang, contentTab, state?.selectedId]);

  useEffect(() => {
    if (!contentTab) return;
    for (const l of ["en", "pl"] as Lang[]) {
      const k = tabKey(l, tab);
      if (tabs[k] || inflight.current.has(k)) continue;
      inflight.current.add(k);
      setLoading(true);
      getContent<Entry>(kindOf(tab), l)
        .then((entries) => {
          const hintId =
            l === BOOT.lang && tab === BOOT.tab && entries.some((e) => e.id === BOOT.entryHint) ? BOOT.entryHint : null;
          setTabs((prev) => ({
            ...prev,
            [k]: { entries, snapshot: JSON.stringify(entries), selectedId: hintId ?? entries[0]?.id ?? null },
          }));
        })
        .catch((err) => setLoadError(String(err)))
        .finally(() => {
          inflight.current.delete(k);
          setLoading(inflight.current.size > 0);
        });
    }
  }, [contentTab, tab, tabs]);

  useEffect(() => {
    if (tab !== "authors") return;
    if (authors) return;
    getAuthors()
      .then((a) => {
        setAuthors(a);
        setAuthorsSnapshot(JSON.stringify(a));
        setSelectedAuthorIndex(a.length > 0 ? 0 : null);
      })
      .catch((err) => setLoadError(String(err)));
  }, [tab, authors]);

  const dirty = useMemo(() => !!state && state.snapshot !== JSON.stringify(state.entries), [state]);
  const authorsDirty = useMemo(() => !!authors && authorsSnapshot !== JSON.stringify(authors), [authors]);
  const anyDirty =
    Object.values(tabs).some((t) => t && t.snapshot !== JSON.stringify(t.entries)) ||
    (authors !== null && authorsSnapshot !== JSON.stringify(authors));

  useEffect(() => {
    if (!anyDirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [anyDirty]);

  const liveIssues = useLiveValidation(tab, lang, contentTab && state && dirty ? state.entries : null);
  const activeIssues = saveIssues ?? liveIssues;

  const counterpartMissing = useMemo(() => {
    if (!contentTab || !selected) return false;
    const otherEntries = tabs[tabKey(otherLang, tab)]?.entries;
    if (!otherEntries) return false;
    return !otherEntries.some((e) => e.slug === selected.slug);
  }, [contentTab, tab, tabs, otherLang, selected]);

  const createTranslation = useCallback(
    async (entry: Entry) => {
      const kind = kindOf(tab);
      const oKey = tabKey(otherLang, tab);
      let target = tabs[oKey]?.entries;
      if (!target) {
        try {
          target = await getContent<Entry>(kind, otherLang);
        } catch (err) {
          setLoadError(String(err));
          return;
        }
      }
      const clone = structuredClone(entry);
      clone.id = nextIdFor(target, kind, otherLang);
      if (kind === "posts") (clone as BlogPost).date = isoToDisplay(todayIso(), otherLang) ?? todayIso();
      else (clone as WikiDoc).date = todayIso();
      const next = [...target, clone];
      setTabs((prev) => ({
        ...prev,
        [oKey]: { entries: next, snapshot: JSON.stringify(target), selectedId: clone.id },
      }));
      setSaveIssues(null);
      setLang(otherLang);
    },
    [tabs, tab, otherLang]
  );

  const mutate = useCallback(
    (fn: (entries: Entry[]) => Entry[]) => {
      setSaveIssues(null);
      setTabs((prev) => {
        const st = prev[key];
        if (!st) return prev;
        return { ...prev, [key]: { ...st, entries: fn(st.entries) } };
      });
    },
    [key]
  );

  const updateSelected = useCallback(
    (next: Entry) => {
      mutate((entries) => entries.map((e) => (e.id === next.id ? next : e)));
    },
    [mutate]
  );

  const save = useCallback(async () => {
    if (saving) return;

    if (tab === "authors") {
      if (!authors || authorsSnapshot === JSON.stringify(authors)) return;
      setSaving(true);
      try {
        const result = await putAuthors(authors);
        if (result.ok) {
          const canonical = result.data ?? authors;
          setAuthors(canonical);
          setAuthorsSnapshot(JSON.stringify(canonical));
          invalidateAuthorCache();
          setSelectedAuthorIndex((i) =>
            i === null ? null : canonical[i] ? i : canonical.length > 0 ? Math.min(i, canonical.length - 1) : null
          );
          setJustSaved(true);
          window.setTimeout(() => setJustSaved(false), 2000);
        }
        setSaveIssues(result.issues.length > 0 ? result.issues : null);
      } catch (err) {
        if (err instanceof ApiError && err.payload.usages) {
          const lines = Object.entries(err.payload.usages)
            .map(([id, places]) => `${id}: ${places.join(", ")}`)
            .join(" | ");
          setAuthorsError(`Cannot delete — still referenced by ${lines}`);
        } else {
          setAuthorsError(String(err instanceof ApiError ? err.message : err));
        }
      } finally {
        setSaving(false);
      }
      return;
    }

    const st = tabs[key];
    if (!st || st.snapshot === JSON.stringify(st.entries)) return;
    setSaving(true);
    try {
      const result = await putContent(kindOf(tab), lang, st.entries);
      if (result.ok) {
        setTabs((prev) => {
          const cur = prev[key];
          if (!cur) return prev;
          return { ...prev, [key]: { ...cur, snapshot: JSON.stringify(cur.entries) } };
        });
        setJustSaved(true);
        window.setTimeout(() => setJustSaved(false), 2000);
      }
      setSaveIssues(result.issues.length > 0 ? result.issues : null);
    } catch (err) {
      if (err instanceof ApiError && err.payload.issues) {
        setSaveIssues(err.payload.issues);
      } else {
        setSaveIssues([{ entry: -1, field: "save", message: String(err), severity: "error" }]);
      }
    } finally {
      setSaving(false);
    }
  }, [saving, tab, authors, authorsSnapshot, tabs, key, lang]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void save();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setSidebarCollapsed((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [save]);

  const addEntry = useCallback(() => {
    const st = tabs[key];
    if (!st) return;
    const entries = st.entries;
    const kind = kindOf(tab);
    let entry: Entry;
    if (kind === "posts") {
      entry = {
        id: nextIdFor(entries, kind, lang),
        slug: "",
        title: "",
        author: "",
        date: isoToDisplay(todayIso(), lang) ?? todayIso(),
        category: "",
        coverImage: "",
        summary: "",
        content: "## \n\n",
      } satisfies BlogPost;
    } else {
      entry = {
        id: nextIdFor(entries, kind, lang),
        slug: "",
        title: "",
        author: "",
        date: todayIso(),
        category: "",
        coverImage: "",
        summary: "",
        content: "## \n\n",
      } satisfies WikiDoc;
    }
    mutate((es) => [...es, entry]);
    setTabs((prev) => {
      const cur = prev[key];
      return cur ? { ...prev, [key]: { ...cur, selectedId: entry.id } } : prev;
    });
  }, [tabs, key, tab, lang, mutate]);

  const duplicateEntry = useCallback(
    (id: string) => {
      mutate((entries) => {
        const source = entries.find((e) => e.id === id);
        if (!source) return entries;
        const clone = structuredClone(source);
        clone.id = nextIdFor(entries, kindOf(tab), lang);
        clone.slug = `${source.slug || "untitled"}-copy`;
        const idx = entries.findIndex((e) => e.id === id);
        const next = [...entries];
        next.splice(idx + 1, 0, clone);
        return next;
      });
    },
    [mutate, tab, lang]
  );

  const deleteEntry = useCallback(
    (id: string) => {
      const entry = state?.entries.find((e) => e.id === id);
      if (
        !entry ||
        !window.confirm(`Delete "${entry.title || id}" from ${tab} (${lang})?\nThis only takes effect after saving.`)
      )
        return;
      mutate((entries) => entries.filter((e) => e.id !== id));
      setTabs((prev) => {
        const st = prev[key];
        if (!st) return prev;
        return { ...prev, [key]: { ...st, selectedId: st.selectedId === id ? null : st.selectedId } };
      });
    },
    [state, mutate, key, tab, lang]
  );

  const deleteAuthorAtIndex = useCallback(
    async (index: number) => {
      if (authors === null || saving) return;
      if (index < 0 || index >= authors.length) return;
      const previous = authors;
      const target = previous[index];
      const next = previous.filter((_, i) => i !== index);
      setAuthors(next);
      setSelectedAuthorIndex((cur) => {
        if (cur === null) return null;
        if (cur === index) return next.length > 0 ? Math.min(index, next.length - 1) : null;
        return cur > index ? cur - 1 : cur;
      });
      setSaving(true);
      try {
        const result = await putAuthors(next);
        if (!result.ok) {
          setAuthors(previous);
          setSelectedAuthorIndex(previous.indexOf(target));
        } else {
          const canonical = result.data ?? next;
          setAuthors(canonical);
          setAuthorsSnapshot(JSON.stringify(canonical));
          invalidateAuthorCache();
          const keptIndex = canonical.indexOf(target);
          setSelectedAuthorIndex(keptIndex >= 0 ? keptIndex : null);
          setJustSaved(true);
          window.setTimeout(() => setJustSaved(false), 2000);
        }
      } catch (err) {
        setAuthors(previous);
        setSelectedAuthorIndex(previous.indexOf(target));
        if (err instanceof ApiError && err.status === 409 && err.payload.usages) {
          const lines = Object.entries(err.payload.usages)
            .map(([id, places]) => `${id} → ${places.join(", ")}`)
            .join(" | ");
          setAuthorsError(`Cannot delete — still referenced: ${lines}`);
        } else {
          setAuthorsError(String(err instanceof ApiError ? err.message : err));
        }
      } finally {
        setSaving(false);
      }
    },
    [authors, saving]
  );

  const categories = useMemo(() => {
    if (!state) return [];
    return [...new Set(state.entries.map((e) => e.category).filter(Boolean))].sort();
  }, [state]);

  const dirtyIds = useMemo(() => {
    if (!state) return new Set<string>();
    let saved: Entry[] | null = null;
    try {
      saved = JSON.parse(state.snapshot) as Entry[];
    } catch {
      saved = null;
    }
    const set = new Set<string>();
    for (const e of state.entries) {
      const original = saved?.find((s) => s.id === e.id);
      if (!original || JSON.stringify(original) !== JSON.stringify(e)) set.add(e.id);
    }
    return set;
  }, [state]);

  const viewDirty = tab === "authors" ? authorsDirty : dirty;
  const paneReady = tab === "assets" || tab === "converter" || tab === "mods" ? true : tab === "authors" ? !!authors : !!state;
  const selectedAuthor = selectedAuthorIndex !== null ? (authors?.[selectedAuthorIndex] ?? null) : null;
  const selectedHasErrors =
    !!selected &&
    !!saveIssues?.some((i) => i.severity === "error" && i.entry >= 0 && state?.entries[i.entry] === selected);

  const entryPreviewPath = useMemo(() => {
    if (!contentTab || !selected || !selected.slug) return null;
    return `/smc/${lang}/${tab === "wiki" ? "wiki" : "post"}/${encodeURIComponent(selected.slug)}`;
  }, [contentTab, selected, tab, lang]);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex shrink-0 items-center gap-4 border-b border-zinc-800 bg-zinc-950 px-5 py-2.5">
        <h1 className="text-sm font-black tracking-wide text-white uppercase">
          SMC <span className="text-green-500">CMS</span>
        </h1>
        <nav className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-md px-3 py-1.5 text-xs font-bold capitalize transition-colors ${
                tab === t
                  ? "bg-green-600 text-white"
                  : t === "authors" && authorsDirty
                    ? "text-amber-400 hover:bg-zinc-900"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              }`}
            >
              {t}
            </button>
          ))}
        </nav>
        <span className="ml-auto text-[11px] text-zinc-600">127.0.0.1 only · edits write straight to src/content</span>
        <button
          type="button"
          title={previewOpen ? "Close live preview" : "Open live preview (dev server on :3000)"}
          onClick={() => setPreviewOpen((v) => !v)}
          className={`rounded-md px-2 py-1.5 transition-colors ${
            previewOpen ? "bg-green-600 text-white" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
          }`}
        >
          <MonitorIcon size={15} />
        </button>
      </header>

      <div className="relative flex min-h-0 flex-1">
        {(contentTab || tab === "authors") && (
          <>
            <aside
              className={`flex shrink-0 flex-col overflow-hidden bg-zinc-950 transition-[width] duration-200 ${
                sidebarCollapsed ? "w-0" : "w-72 border-r border-zinc-800"
              }`}
            >
              <div className="flex w-72 min-h-0 flex-1 flex-col">
                {(tab === "posts" || tab === "wiki") && (
                  <>
                    <div className="border-b border-zinc-800 p-3">
                      <div className="flex rounded-lg border border-zinc-800 p-0.5">
                        {(["en", "pl"] as const).map((l) => (
                          <button
                            key={l}
                            type="button"
                            onClick={() => setLang(l)}
                            className={`flex-1 rounded-md py-1 text-xs font-bold tracking-wider uppercase transition-colors ${
                              lang === l ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-zinc-200"
                            }`}
                          >
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                    {state && (
                      <EntryList
                        entries={state.entries}
                        selectedId={state.selectedId}
                        dirtyIds={dirtyIds}
                        paritySuffix={(entry) => {
                          const otherEntries = tabs[tabKey(otherLang, tab)]?.entries;
                          if (!otherEntries) return undefined;
                          return otherEntries.some((e) => e.slug === entry.slug)
                            ? undefined
                            : ` · no ${otherLang.toUpperCase()}`;
                        }}
                        onSelect={(id) =>
                          setTabs((prev) => {
                            const cur = prev[key];
                            return cur ? { ...prev, [key]: { ...cur, selectedId: id } } : prev;
                          })
                        }
                        onAdd={addEntry}
                        onDuplicate={duplicateEntry}
                        onDelete={deleteEntry}
                      />
                    )}
                    <div className="flex h-8 items-center border-t border-zinc-800 px-4 text-[11px] text-zinc-600">
                      Saves write src/content/{lang}/{kindOf(tab)}.json
                    </div>
                  </>
                )}

                {tab === "authors" && authors && (
                  <>
                    <ListPanel
                      items={authors}
                      getKey={(a) => String(authors.indexOf(a))}
                      primary={(a) => a.name.en || "(unnamed)"}
                      secondary={(a) => a.id}
                      selectedKey={selectedAuthorIndex !== null ? String(selectedAuthorIndex) : "__none__"}
                      onSelect={(k) => setSelectedAuthorIndex(Number(k))}
                      onCreate={() => {
                        const a: Author = { id: "", avatar: "", name: { en: "", pl: "" }, bio: { en: "", pl: "" } };
                        setAuthors((list) => {
                          const next = list ? [...list, a] : [a];
                          setSelectedAuthorIndex(next.length - 1);
                          return next;
                        });
                      }}
                      createLabel="Authors"
                      emptyText="No authors in the registry yet."
                      rowActions={(a) => (
                        <button
                          type="button"
                          title="Delete author"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              !window.confirm(
                                `Delete author "${a.name.en || a.id}"?\nThe site refuses to build if content still references them.`
                              )
                            )
                              return;
                            void deleteAuthorAtIndex(authors.indexOf(a));
                          }}
                          className="rounded p-1 text-zinc-500 hover:text-red-400"
                        >
                          <TrashIcon size={13} />
                        </button>
                      )}
                    />
                    <div className="flex h-8 items-center border-t border-zinc-800 px-4 text-[11px] text-zinc-600">
                      Saves write src/content/authors.json
                    </div>
                  </>
                )}
              </div>
            </aside>
            <button
              type="button"
              onClick={() => setSidebarCollapsed((v) => !v)}
              title={sidebarCollapsed ? "Show sidebar (Ctrl+B)" : "Hide sidebar (Ctrl+B)"}
              aria-label={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
              className={`absolute bottom-0 z-20 flex h-8 w-5 items-center justify-center rounded-t-md border border-b-0 border-zinc-700 bg-zinc-900 text-zinc-500 shadow-lg transition-all duration-200 hover:text-zinc-200 ${
                sidebarCollapsed ? "left-0" : "left-[278px]"
              }`}
            >
              {sidebarCollapsed ? <CaretRightIcon size={12} /> : <CaretLeftIcon size={12} />}
            </button>
          </>
        )}

        <main className="min-w-0 flex-1 overflow-y-auto">
          {!paneReady && !loading && !loadError && <div className="p-6 text-sm text-zinc-500">Select an item.</div>}
          {loading && (
            <div className="flex items-center gap-2 p-6 text-sm text-zinc-400">
              <CircleNotchIcon size={18} className="animate-spin" /> Loading…
            </div>
          )}
          {loadError && <div className="m-6 rounded-md bg-red-950/50 p-4 text-sm text-red-300">{loadError}</div>}

          {paneReady && (
            <>
              <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-zinc-800 bg-zinc-950/95 px-6 py-3 backdrop-blur">
                <h2 className="mr-auto truncate text-sm font-bold capitalize text-white">
                  {tab === "assets"
                    ? "Assets"
                    : tab === "mods"
                      ? "Mods board"
                      : tab === "authors"
                        ? "Authors registry"
                        : tab === "converter"
                          ? "Converter"
                          : selected
                            ? selected.title || "(untitled)"
                            : `${tab} · ${lang}`}
                  {viewDirty && (
                    <span className="ml-2 align-middle text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      unsaved
                    </span>
                  )}
                </h2>
                {justSaved && <span className="text-xs font-semibold text-green-400">Saved ✓</span>}
                {contentTab && (
                  <Button variant="primary" onClick={() => void save()} disabled={!viewDirty || saving}>
                    {saving ? <CircleNotchIcon size={15} className="animate-spin" /> : <FloppyDiskIcon size={15} />}
                    Save
                    <kbd className="ml-1 rounded bg-black/30 px-1 text-[10px] opacity-80">Ctrl+S</kbd>
                  </Button>
                )}
              </div>

              {activeIssues && activeIssues.length > 0 && (
                <div
                  className={`mx-6 mt-4 rounded-md border p-3 text-xs ${
                    activeIssues.some((i) => i.severity === "error")
                      ? "border-red-900/60 bg-red-950/40 text-red-300"
                      : "border-amber-900/60 bg-amber-950/30 text-amber-300"
                  }`}
                >
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-bold">
                      <WarningCircleIcon size={14} />
                      Validation{" "}
                      {activeIssues.some((i) => i.severity === "error")
                        ? saveIssues
                          ? "errors — nothing was written"
                          : "errors"
                        : "warnings"}
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] uppercase tracking-wider ${
                          saveIssues ? "bg-zinc-800 text-zinc-400" : "bg-green-950 text-green-400"
                        }`}
                      >
                        {saveIssues ? "on save" : "live check"}
                      </span>
                    </span>
                    {!saveIssues && <span className="opacity-60">auto-dismisses when fixed · enforced on save</span>}
                    {saveIssues && (
                      <button
                        type="button"
                        onClick={() => setSaveIssues(null)}
                        className="opacity-60 hover:opacity-100"
                      >
                        dismiss
                      </button>
                    )}
                  </div>
                  <ul className="max-h-44 space-y-1 overflow-y-auto">
                    {activeIssues.map((issue, i) => (
                      <li key={i} className="font-mono">
                        [{issue.entry >= 0 ? issue.entry : "—"}] {issue.field}: {issue.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="p-6 pb-16">
                {(tab === "posts" || tab === "wiki") && (
                  <>
                    {!selected && (
                      <p className="text-sm text-zinc-500">Select an entry on the left, or create a new one.</p>
                    )}
                    {selected && counterpartMissing && (
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-900/60 bg-amber-950/30 p-3 text-xs text-amber-300">
                        <span>
                          No {otherLang.toUpperCase()} counterpart with slug &quot;{selected.slug}&quot; — this entry is
                          invisible in {otherLang.toUpperCase()}.
                        </span>
                        <Button onClick={() => void createTranslation(selected)}>
                          Create {otherLang.toUpperCase()} translation
                        </Button>
                      </div>
                    )}
                    {selected && isBlogPost(selected) && tab === "posts" && (
                      <PostEditor post={selected} lang={lang} categories={categories} onChange={updateSelected} />
                    )}
                    {selected && !isBlogPost(selected) && tab === "wiki" && (
                      <WikiEditor doc={selected} lang={lang} categories={categories} onChange={updateSelected} />
                    )}
                    {selectedHasErrors && (
                      <p className="mt-3 text-xs text-red-400">
                        This entry has validation errors — see the banner above.
                      </p>
                    )}
                  </>
                )}

                {tab === "authors" && authors && (
                  <>
                    <AuthorForm
                      author={selectedAuthor}
                      onChange={(next) => {
                        setAuthors((list) =>
                          list ? list.map((a, i) => (i === selectedAuthorIndex ? next : a)) : list
                        );
                      }}
                    />
                    {authorsError && (
                      <div className="mt-4 rounded-md border border-red-900/60 bg-red-950/40 p-3 text-xs text-red-300">
                        <div className="flex items-center justify-between gap-3">
                          <span>{authorsError}</span>
                          <button
                            type="button"
                            onClick={() => setAuthorsError(null)}
                            className="shrink-0 opacity-60 hover:opacity-100"
                          >
                            dismiss
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {tab === "assets" && <AssetsView />}

                {tab === "converter" && <ConverterView />}

                <div hidden={tab !== "mods"}>
                  <ModsBoard />
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {previewOpen && <PreviewWindow entryPath={entryPreviewPath} onClose={() => setPreviewOpen(false)} />}
    </div>
  );
};
