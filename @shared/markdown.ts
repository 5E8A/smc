export interface CarouselImage {
  src: string;
  alt: string;
}

const escapeAttr = (value: string): string => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");

export const processCarousel = (content: string) =>
  content.replace(/:carouselStart:\s*\n([\s\S]*?)\n?\s*:carouselEnd:/gi, (_, inner: string) => {
    const images: CarouselImage[] = [...inner.matchAll(/!\[([^\]]*)\]\(([^)\s]+)\)/g)].map((m) => ({
      src: m[2],
      alt: m[1],
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
}

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
        if (child.type === "paragraph") {
          const parts: MdastNode[] = [];
          for (const sub of child.children ?? []) {
            if (sub.type === "text" && !sub.value?.trim()) continue;
            parts.push(sub);
          }
          const isSoloImage = parts.length === 1 && parts[0].type === "image";
          const joined = parts.map((p) => (p.type === "html" ? (p.value ?? "") : "")).join("");
          const isSoloCarousel =
            parts.length > 0 && parts.every((p) => p.type === "html") && /^<carousel[\s>]/i.test(joined.trim());
          if (isSoloImage) {
            next.push(parts[0]);
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
