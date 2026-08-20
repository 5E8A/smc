import { useEffect, useMemo, useState } from "react";
import { slug as githubSlug } from "github-slugger";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface WikiTOCProps {
  content: string;
}

const slugify = (text: string): string => githubSlug(text);

const WikiTOC = ({ content }: WikiTOCProps) => {
  const [activeId, setActiveId] = useState<string>("");

  const headings = useMemo(() => {
    const items: TocItem[] = [];
    const lines = content.split("\n");
    for (const line of lines) {
      const match = line.match(/^(#{1,6})\s+(.+)/);
      if (match) {
        const level = match[1].length;
        const text = match[2].replace(/[*_~`]/g, "");
        items.push({ id: slugify(text), text, level });
      }
    }
    return items;
  }, [content]);

  useEffect(() => {
    if (headings.length === 0) return;

    const offset = 120;
    const onScroll = () => {
      let current = headings[0]?.id ?? "";
      for (const h of headings) {
        const el = document.getElementById(h.id);
        if (el && el.getBoundingClientRect().top <= offset) {
          current = h.id;
        }
      }
      setActiveId(current);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [headings]);

  const minLevel = headings.length > 0 ? Math.min(...headings.map((h) => h.level)) : 1;

  if (headings.length === 0) return null;

  return (
    <nav className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto rounded-lg border border-white/5 bg-mc-surface/60 p-4">
      <p className="mb-3 border-b border-white/5 pb-2 text-xs font-bold tracking-wider text-white/60 uppercase">On this page</p>
      <ul className="space-y-0.5">
        {headings.map((h) => {
          const indent = h.level - minLevel;
          const isActive = h.id === activeId;
          return (
            <li key={h.id} style={{ paddingLeft: `${indent * 12}px` }}>
              <a
                href={`#${h.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`block truncate rounded px-2 py-1 text-sm transition-colors ${
                  isActive
                    ? "border-l-2 border-green-500 bg-green-500/10 font-medium text-green-400"
                    : "text-white/65 hover:bg-white/5 hover:text-white/90"
                }`}
              >
                {h.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default WikiTOC;
