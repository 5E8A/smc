import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import {
  ArrowsClockwiseIcon,
  CpuIcon,
  DeviceMobileIcon,
  DownloadIcon,
  FolderIcon,
  GearIcon,
  GlobeIcon,
  HouseIcon,
  ImageIcon,
  ImagesIcon,
  KeyboardIcon,
  NoteIcon,
  PushPinIcon,
  RocketIcon,
  ScissorsIcon,
  SparkleIcon,
  StarIcon,
  TelevisionIcon,
  UsersIcon,
  WarningIcon,
  WrenchIcon,
} from "@phosphor-icons/react";
import { assetUrl } from "../api";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ArrowsClockwiseIcon,
  CpuIcon,
  DeviceMobileIcon,
  DownloadIcon,
  FolderIcon,
  GearIcon,
  GlobeIcon,
  HouseIcon,
  ImageIcon,
  KeyboardIcon,
  NoteIcon,
  PushPinIcon,
  RocketIcon,
  ScissorsIcon,
  SparkleIcon,
  StarIcon,
  TelevisionIcon,
  UsersIcon,
  WarningIcon,
  WrenchIcon,
};

const Icon = ({ name, className }: { name?: string; className?: string }) => {
  const Comp = iconMap[name ?? ""];
  if (!Comp) return null;
  return <Comp className={className ?? "inline-block size-[1em] align-middle text-green-400"} />;
};

const remarkNoH1 = () => (tree: { children: Array<{ type: string; depth?: number }> }) => {
  for (const node of tree.children) {
    if (node.type === "heading" && node.depth === 1) node.depth = 2;
  }
};

interface MdastNode {
  type: string;
  children?: MdastNode[];
  value?: string;
}

const remarkUnwrapBlocks = () => (tree: MdastNode) => {
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

const processIcons = (content: string) => content.replace(/:([A-Z][A-Za-z]+Icon):/g, '<icon name="$1"></icon>');

type MarkdownComponents = Components & {
  icon: React.ComponentType<{ name?: string; className?: string; node?: unknown }>;
  carousel: React.ComponentType<{ images?: string; className?: string; node?: unknown }>;
};

const parseCarouselImages = (raw?: string): { src: string }[] => {
  try {
    const parsed: unknown = JSON.parse(raw ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter(
          (i): i is { src: string } =>
            typeof i === "object" && i !== null && typeof (i as { src?: unknown }).src === "string"
        )
      : [];
  } catch {
    return [];
  }
};

const components: MarkdownComponents = {
  icon: ({ name, node, ...rest }) => <Icon name={name} {...rest} />,
  carousel: ({ images, node, ...rest }) => {
    const imgs = parseCarouselImages(images);
    if (imgs.length === 0) return null;
    return (
      <div
        className="my-4 flex items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-700 bg-zinc-900/60 p-6 text-xs text-zinc-400"
        {...rest}
      >
        <ImagesIcon size={16} />
        Carousel preview · {imgs.length} image{imgs.length === 1 ? "" : "s"} · interactive on the site
      </div>
    );
  },
  a: ({ href, children, node, ...props }) => (
    <a
      href={href}
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel="noopener noreferrer"
      className="font-semibold text-green-400 hover:text-white"
      {...props}
    >
      {children}
    </a>
  ),
  h2: ({ children, node, ...props }) => (
    <h2 className="mt-8 mb-3 border-b border-zinc-800 pb-1.5 text-xl font-bold text-white first:mt-0" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, node, ...props }) => (
    <h3 className="mt-6 mb-2 text-lg font-bold text-white" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, node, ...props }) => (
    <h4 className="mt-5 mb-2 font-bold text-zinc-200" {...props}>
      {children}
    </h4>
  ),
  p: ({ children, node, ...props }) => (
    <p className="mb-3 text-sm leading-6 text-zinc-300" {...props}>
      {children}
    </p>
  ),
  strong: ({ children, node, ...props }) => (
    <strong className="font-bold text-white" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, node, ...props }) => (
    <em className="text-zinc-300 italic" {...props}>
      {children}
    </em>
  ),
  del: ({ children, node, ...props }) => (
    <del className="text-zinc-500 line-through" {...props}>
      {children}
    </del>
  ),
  code: ({ className: codeClassName, children, node, ...props }) =>
    codeClassName?.includes("language-") ? (
      <code className="block overflow-x-auto rounded bg-zinc-900 p-3 text-xs text-green-300" {...props}>
        {children}
      </code>
    ) : (
      <code
        className="rounded border border-zinc-800 bg-zinc-900 px-1 py-0.5 font-mono text-xs text-green-300"
        {...props}
      >
        {children}
      </code>
    ),
  pre: ({ children, node, ...props }) => (
    <pre className="mb-4 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3" {...props}>
      {children}
    </pre>
  ),
  blockquote: ({ children, node, ...props }) => (
    <blockquote className="my-4 border-l-4 border-green-500/50 pl-3 text-sm text-zinc-400 italic" {...props}>
      {children}
    </blockquote>
  ),
  ul: ({ children, node, ...props }) => (
    <ul className="mb-3 ml-5 list-disc space-y-0.5 text-sm text-zinc-300" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, node, ...props }) => (
    <ol className="mb-3 ml-5 list-decimal space-y-0.5 text-sm text-zinc-300" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, node, ...props }) => (
    <li className="leading-6" {...props}>
      {children}
    </li>
  ),
  input: ({ checked, node, ...props }) => (
    <input type="checkbox" checked={checked} readOnly className="mr-2 accent-green-500" {...props} />
  ),
  table: ({ children, node, ...props }) => (
    <div className="my-4 overflow-x-auto rounded border border-zinc-800">
      <table className="w-full border-collapse text-xs" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, node, ...props }) => (
    <thead className="border-b border-zinc-800 bg-zinc-900/60" {...props}>
      {children}
    </thead>
  ),
  th: ({ children, node, ...props }) => (
    <th className="px-2.5 py-1.5 text-left font-bold text-white" {...props}>
      {children}
    </th>
  ),
  td: ({ children, node, ...props }) => (
    <td className="border-b border-zinc-800/70 px-2.5 py-1.5 text-zinc-300" {...props}>
      {children}
    </td>
  ),
  hr: ({ node, ...props }) => <hr className="my-5 border-zinc-800" {...props} />,
  img: ({ src, alt, node, ...props }) => (
    <figure className="my-4 overflow-hidden rounded-lg border border-zinc-800">
      <img
        src={typeof src === "string" && src.startsWith("/smc/assets/") ? assetUrl(src) : src}
        alt={alt || ""}
        className="max-h-72 w-auto object-contain"
        {...props}
      />
      {alt && <figcaption className="bg-zinc-900 p-1.5 text-center text-[11px] text-zinc-500">{alt}</figcaption>}
    </figure>
  ),
};

export const MarkdownPreview = ({ content }: { content: string }) => (
  <Markdown
    remarkPlugins={[remarkGfm, remarkBreaks, remarkNoH1, remarkUnwrapBlocks]}
    rehypePlugins={[rehypeSlug, rehypeRaw]}
    components={components}
  >
    {processIcons(content)}
  </Markdown>
);
