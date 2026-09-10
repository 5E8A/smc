import { useEffect, useMemo, useRef, useState } from "react";
import Slugger from "github-slugger";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface DocsTOCProps {
  content: string;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

const OFFSET = 28;

const DocsTOC = ({ content, scrollRef }: DocsTOCProps) => {
  const [activeId, setActiveId] = useState("");
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const headings = useMemo<TocItem[]>(() => {
    const slugger = new Slugger();
    const items: TocItem[] = [];
    for (const line of content.split("\n")) {
      const match = line.match(/^(#{1,6})\s+(.+)/);
      if (!match) continue;
      const level = match[1]!.length;
      const text = match[2]!.replace(/[*_~`]/g, "");
      items.push({ id: slugger.slug(text), text, level });
    }
    return items;
  }, [content]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || headings.length === 0) return;

    const onScroll = () => {
      if (scrollTimeout.current) return;

      const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 12;
      if (atBottom) {
        setActiveId(headings[headings.length - 1]?.id ?? "");
        return;
      }

      const containerTop = container.getBoundingClientRect().top;
      let current = headings[0]?.id ?? "";
      let closestTop = Infinity;
      let found = false;
      for (const h of headings) {
        const el = container.querySelector(`#${CSS.escape(h.id)}`);
        if (!el) continue;
        const top = el.getBoundingClientRect().top - containerTop;
        if (top <= OFFSET) {
          current = h.id;
          found = true;
        } else if (!found && top < closestTop) {
          closestTop = top;
          current = h.id;
        }
      }
      setActiveId(current);
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      container.removeEventListener("scroll", onScroll);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, [headings, scrollRef]);

  const scrollToHeading = (event: React.MouseEvent, id: string) => {
    event.preventDefault();
    const container = scrollRef.current;
    const target = container?.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
    if (!container || !target) return;

    setActiveId(id);
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      scrollTimeout.current = null;
    }, 800);

    const containerTop = container.getBoundingClientRect().top;
    const top = target.getBoundingClientRect().top - containerTop + container.scrollTop - 24;
    container.scrollTo({
      top: Math.max(0, top),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
    target.tabIndex = -1;
    target.focus({ preventScroll: true });
  };

  const minLevel = headings.length > 0 ? Math.min(...headings.map((h) => h.level)) : 1;

  if (headings.length === 0) return null;

  return (
    <nav
      aria-label="On this page"
      className="sticky top-8 max-h-[calc(100vh-12rem)] overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3"
    >
      <p className="mb-2 border-b border-zinc-800 pb-2 text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
        On this page
      </p>
      <ul className="space-y-0.5">
        {headings.map((h) => {
          const indent = h.level - minLevel;
          const isActive = h.id === activeId;
          return (
            <li key={h.id} style={{ paddingLeft: `${indent * 12}px` }}>
              <a
                href={`#${h.id}`}
                onClick={(e) => scrollToHeading(e, h.id)}
                className={`block truncate rounded px-2 py-1 text-xs transition-colors ${
                  isActive
                    ? "border-l-2 border-green-500 bg-green-500/10 font-medium text-green-400"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
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

export default DocsTOC;
