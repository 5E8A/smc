export interface CarouselImage {
  src: string;
  alt: string;
}

const escapeAttr = (value: string): string => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");

export const CAROUSEL_RE = /:carouselStart:\s*\n([\s\S]*?)\n?\s*:carouselEnd:/gi;

export const processCarousel = (content: string) =>
  content.replace(CAROUSEL_RE, (_, inner: string) => {
    const images: CarouselImage[] = [...inner.matchAll(/!\[([^\]]*)\]\(([^)\s]+)\)/g)].map((m) => ({
      src: m[2] ?? "",
      alt: m[1] ?? "",
    }));
    return `<carousel images="${escapeAttr(JSON.stringify(images))}"></carousel>`;
  });

export const processIcons = (content: string) => content.replace(/:([A-Z][A-Za-z]+Icon):/g, '<icon name="$1"></icon>');

export const parseCarouselImages = (raw?: string): CarouselImage[] => {
  try {
    const parsed: unknown = JSON.parse(raw ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter(
          (i): i is CarouselImage => typeof i === "object" && i !== null && typeof (i as CarouselImage).src === "string"
        )
      : [];
  } catch {
    return [];
  }
};

interface MdastNode {
  type: string;
  children?: MdastNode[];
  value?: string;
  data?: { hProperties?: Record<string, string | number> };
  align?: (string | null)[];
}

interface HastElement {
  type: "element";
  tagName: string;
  properties: Record<string, unknown>;
  children: HastNode[];
}

type HastNode = HastElement | { type: string; value?: string };

export function remarkNoH1() {
  return (tree: { children: Array<{ type: string; depth?: number }> }) => {
    for (const node of tree.children) {
      if (node.type === "heading" && node.depth === 1) node.depth = 2;
    }
  };
}

export function remarkUnwrapBlocks() {
  return (tree: MdastNode) => {
    const transform = (node: MdastNode): void => {
      if (!node.children) return;
      for (const child of node.children) transform(child);
      const next: MdastNode[] = [];
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (!child) continue;
        if (child.type === "paragraph") {
          const parts: MdastNode[] = [];
          for (const sub of child.children ?? []) {
            if (sub.type === "text" && !sub.value?.trim()) continue;
            parts.push(sub);
          }
          const isSoloImage = parts.length === 1 && parts[0]?.type === "image";
          const joined = parts.map((p) => (p.type === "html" ? (p.value ?? "") : "")).join("");
          const isSoloCarousel =
            parts.length > 0 && parts.every((p) => p.type === "html") && /^<carousel[\s>]/i.test(joined.trim());
          if (isSoloImage) {
            next.push(parts[0]!);
            continue;
          }
          if (isSoloCarousel) {
            next.push({ type: "html", value: joined });
            continue;
          }
        }
        next.push(child);
      }
      node.children = next;
    };
    transform(tree);
  };
}

export function remarkTableCategoryHeader() {
  return (tree: MdastNode) => {
    if (!tree.children) return;
    for (const node of tree.children) {
      if (node.type !== "table" || !node.children) continue;
      const cols = node.align?.length ?? 2;
      for (const row of node.children) {
        if (row.type !== "tableRow" || !row.children?.length) continue;
        const cell = row.children[0];
        if (!cell || cell.type !== "tableCell" || !cell.children?.length) continue;
        const first = cell.children[0];
        if (first?.type !== "strong" || !first.children?.length) continue;
        const text = first.children[0];
        if (text?.type !== "text" || !text.value) continue;

        row.children = [
          {
            type: "tableCell",
            children: [{ type: "text", value: text.value }],
            data: { hProperties: { colSpan: cols, className: "category-header" } },
          },
        ];

        if (node.children[0] === row) {
          const nextRow = node.children[1];
          if (nextRow?.type === "tableRow" && nextRow.children) {
            for (const c of nextRow.children) {
              if (c.type === "tableCell") {
                c.data = { hProperties: { className: "category-sub-header" } };
              }
            }
          }
        }
      }
    }
  };
}

function selectAll(tag: string, tree: HastNode): HastElement[] {
  const results: HastElement[] = [];
  const walk = (node: HastNode) => {
    if (node.type === "element") {
      const el = node as HastElement;
      if (el.tagName === tag) results.push(el);
      for (const child of el.children) walk(child);
    } else if ("children" in node) {
      for (const child of (node as { children: HastNode[] }).children) walk(child);
    }
  };
  walk(tree);
  return results;
}

export function rehypeRemoveEmptyColSpanCells() {
  return (tree: HastNode) => {
    for (const tr of selectAll("tr", tree)) {
      const cells = tr.children.filter((n): n is HastElement => n.type === "element");
      const hasColSpan = cells.some((c) => typeof c.properties.colSpan === "number" && c.properties.colSpan > 1);
      if (hasColSpan) {
        tr.children = tr.children.filter((n) => {
          if (n.type !== "element") return true;
          const el = n as HastElement;
          return el.tagName !== "td" || el.children.length > 0 || Object.keys(el.properties).length > 0;
        });
      }
    }
  };
}
