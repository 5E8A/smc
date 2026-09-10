import { useRef, useState } from "react";
import { CaretDownIcon } from "@phosphor-icons/react";
import { MarkdownPreview } from "../editor/MarkdownPreview";
import DocsTOC from "./DocsTOC";

const docModules = import.meta.glob<string>("../../content/docs/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

interface DocGroup {
  label: string;
  slugs: string[];
}

const DOC_GROUPS: DocGroup[] = [
  { label: "Start Here", slugs: ["getting-started"] },
  { label: "Content", slugs: ["posts", "wiki", "mods", "authors"] },
  { label: "Media", slugs: ["assets", "converter"] },
  { label: "Publishing", slugs: ["deploy", "preview"] },
  { label: "Reference", slugs: ["markdown-syntax", "code-blocks", "tips-and-tricks"] },
];

const DOC_SLUGS = DOC_GROUPS.flatMap((g) => g.slugs);

interface DocPage {
  slug: string;
  title: string;
  content: string;
}

function buildDocs(entries: Record<string, string>): DocPage[] {
  const bySlug = new Map<string, string>();
  for (const [key, content] of Object.entries(entries)) {
    const slug = key.split("/").pop()?.replace(/\.md$/, "") ?? "";
    if (slug) bySlug.set(slug, content);
  }
  return DOC_SLUGS.filter((slug) => bySlug.has(slug)).map((slug) => {
    const content = bySlug.get(slug)!;
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch?.[1] ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return { slug, title, content };
  });
}

const docs = buildDocs(docModules);

export const DocsTab = () => {
  const [selected, setSelected] = useState(docs[0]?.slug ?? "getting-started");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const contentRef = useRef<HTMLDivElement>(null);

  const active = docs.find((d) => d.slug === selected) ?? docs[0];

  const toggleGroup = (label: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-1">
      <aside className="w-60 shrink-0 overflow-y-auto border-r border-zinc-800 bg-zinc-950">
        <div className="px-3 pt-3 pb-2">
          <span className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
            Documentation ({docs.length})
          </span>
        </div>
        <div className="min-h-0 flex-1 px-2 pb-3">
          {DOC_GROUPS.map((group) => {
            const groupDocs = group.slugs
              .map((slug) => docs.find((d) => d.slug === slug))
              .filter((d): d is DocPage => Boolean(d));
            if (groupDocs.length === 0) return null;
            const isCollapsed = collapsed.has(group.label);
            return (
              <div key={group.label} className="mb-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  aria-expanded={!isCollapsed}
                  className="flex w-full cursor-pointer items-center justify-between rounded px-2 py-1.5 text-left text-xs font-semibold tracking-wider text-zinc-500 uppercase transition-colors hover:bg-zinc-900 hover:text-zinc-300"
                >
                  {group.label}
                  <CaretDownIcon
                    size={12}
                    weight="bold"
                    className={`shrink-0 transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
                  />
                </button>
                {!isCollapsed && (
                  <div className="mt-1 space-y-1 pb-2">
                    {groupDocs.map((doc) => {
                      const isActive = doc.slug === selected;
                      return (
                        <button
                          key={doc.slug}
                          type="button"
                          onClick={() => setSelected(doc.slug)}
                          className={`w-full cursor-pointer rounded-lg border px-2.5 py-2 text-left transition-colors ${
                            isActive ? "border-green-600/60 bg-green-950/30" : "border-transparent hover:bg-zinc-900"
                          }`}
                        >
                          <span
                            className={`min-w-0 flex-1 truncate text-sm font-medium ${
                              isActive ? "text-white" : "text-zinc-300"
                            }`}
                          >
                            {doc.title}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto scrollbar-gutter-stable">
        {active && (
          <div className="flex max-w-6xl gap-10 px-10 py-8">
            <div className="min-w-0 flex-1">
              <MarkdownPreview content={active.content} />
            </div>
            <aside className="hidden w-56 shrink-0 lg:block">
              <DocsTOC content={active.content} scrollRef={contentRef} />
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};
