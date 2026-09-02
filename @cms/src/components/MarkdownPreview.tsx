import Markdown, { type Components, type ExtraProps } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { smcSanitizeSchema } from "@smc/shared/rehype-sanitize-schema";
import rehypeSlug from "rehype-slug";
import { ArrowSquareOutIcon } from "@phosphor-icons/react";
import {
  parseCarouselImages,
  processCarousel,
  processIcons,
  remarkNoH1,
  remarkTableCategoryHeader,
  remarkUnwrapBlocks,
} from "@smc/shared/markdown";
import { assetUrl } from "../api";
import { isVideoSrc, videoPosterSrc } from "../lib/videoAsset";
import { remarkLineAttrs } from "../lib/remarkLineAttrs";
import type { PluggableList } from "unified";
import Carousel from "./Carousel";
import { ICON_COMPONENTS } from "./icon-map.generated";

const Icon = ({ name, className }: { name?: string; className?: string }) => {
  const Comp = name ? ICON_COMPONENTS[name] : undefined;
  if (!Comp) return null;
  return <Comp className={className ?? "icon-inline text-green-400"} />;
};

type MarkdownComponents = Omit<Components, "img"> & {
  icon: React.ComponentType<{ name?: string; className?: string; node?: unknown }>;
  carousel: React.ComponentType<{ images?: string; className?: string; node?: unknown }>;
  img: React.ComponentType<{
    src?: string;
    alt?: string;
    title?: string;
    className?: string;
    "data-md-line"?: string;
    node?: ExtraProps["node"];
  }>;
};

const components: MarkdownComponents = {
  icon: ({ name, node, ...rest }) => <Icon name={name} {...rest} />,
  carousel: ({ images, node, ...rest }) => {
    const imgs = parseCarouselImages(images);
    if (imgs.length === 0) return null;
    return (
      <div className="my-4 overflow-hidden rounded-lg border border-white/10 shadow-lg" {...rest}>
        <Carousel images={imgs.map((i) => i.src)} />
      </div>
    );
  },
  a: ({ href, children, node, ...props }) => {
    const isExternal = href?.startsWith("http");
    if (isExternal) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-green-400 transition-colors hover:text-white hover:shadow-[inset_0_-1px_0_currentColor]"
          {...props}
        >
          {children}
          <ArrowSquareOutIcon aria-hidden weight="bold" className="icon-inline ml-1" />
        </a>
      );
    }
    return (
      <a href={href} className="text-green-400 hover:text-white" {...props}>
        {children}
      </a>
    );
  },
  h2: ({ children, node, ...props }) => (
    <h2 className="mt-8 mb-3 border-b border-white/10 pb-1.5 text-xl font-bold text-white first:mt-0" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, node, ...props }) => (
    <h3 className="mt-6 mb-2 text-lg font-bold text-white" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, node, ...props }) => (
    <h4 className="mt-5 mb-2 font-bold text-white/90" {...props}>
      {children}
    </h4>
  ),
  p: ({ children, node, ...props }) => (
    <p className="mb-3 text-sm leading-6 text-gray-300" {...props}>
      {children}
    </p>
  ),
  strong: ({ children, node, ...props }) => (
    <strong className="font-bold text-white" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, node, ...props }) => (
    <em className="text-white/80 italic" {...props}>
      {children}
    </em>
  ),
  del: ({ children, node, ...props }) => (
    <del className="text-white/40 line-through" {...props}>
      {children}
    </del>
  ),
  code: ({ className: codeClassName, children, node, ...props }) =>
    codeClassName?.includes("language-") ? (
      <code className="block overflow-x-auto rounded-lg bg-black/40 p-3 text-xs text-green-300" {...props}>
        {children}
      </code>
    ) : (
      <code
        className="rounded border border-white/10 bg-black/30 px-1 py-0.5 font-mono text-xs text-green-300"
        {...props}
      >
        {children}
      </code>
    ),
  pre: ({ children, node, ...props }) => (
    <pre className="mb-4 overflow-x-auto rounded-xl border border-white/5 bg-black/20 p-3" {...props}>
      {children}
    </pre>
  ),
  blockquote: ({ children, node, ...props }) => (
    <blockquote className="my-4 border-l-4 border-green-500/50 pl-3 text-sm text-gray-400 italic" {...props}>
      {children}
    </blockquote>
  ),
  ul: ({ children, node, ...props }) => (
    <ul className="mb-3 ml-5 list-disc space-y-0.5 text-gray-300" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, node, ...props }) => (
    <ol className="mb-3 ml-5 list-decimal space-y-0.5 text-gray-300" {...props}>
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
    <div className="my-4 overflow-x-auto rounded-lg border border-white/5">
      <table className="w-full border-collapse text-xs" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, node, ...props }) => (
    <thead className="border-b border-white/10 bg-black/20" {...props}>
      {children}
    </thead>
  ),
  th: ({ children, node, className: thClassName, ...props }) => (
    <th className={`px-2.5 py-1.5 text-left font-bold text-white${thClassName ? ` ${thClassName}` : ""}`} {...props}>
      {children}
    </th>
  ),
  td: ({ children, node, className: tdClassName, ...props }) => (
    <td className={`border-r border-b border-white/5 px-2.5 py-1.5 text-gray-300${tdClassName ? ` ${tdClassName}` : ""}`} {...props}>
      {children}
    </td>
  ),
  hr: ({ node, ...props }) => <hr className="my-5 border-white/5" {...props} />,
  img: ({ src, alt, title, node, "data-md-line": mdLine, ...props }) => {
    const raw = typeof src === "string" ? src : "";
    const resolve = (p: string): string => (p.startsWith("/smc/assets/") ? assetUrl(p) : p);
    return (
      <figure data-md-line={mdLine} className="my-4 w-fit max-w-full overflow-hidden rounded-xl border border-white/10">
        {isVideoSrc(raw) ? (
          <video
            src={resolve(raw)}
            poster={resolve(videoPosterSrc(raw))}
            muted
            loop
            autoPlay
            playsInline
            className="block h-auto w-auto max-w-full"
          />
        ) : (
          <img
            src={resolve(raw) || undefined}
            alt={alt || ""}
            loading="lazy"
            className="block h-auto w-auto max-w-full"
            {...props}
          />
        )}
        {title && <figcaption className="bg-black/40 p-1.5 text-center text-[11px] text-zinc-400">{title}</figcaption>}
      </figure>
    );
  },
};

const remarkPlugins: PluggableList = [remarkGfm, remarkBreaks, remarkNoH1, remarkTableCategoryHeader, remarkUnwrapBlocks, remarkLineAttrs];
const rehypePlugins: PluggableList = [rehypeSlug, rehypeRaw, [rehypeSanitize, smcSanitizeSchema]];

export const MarkdownPreview = ({ content }: { content: string }) => (
  <Markdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins} components={components}>
    {processIcons(processCarousel(content))}
  </Markdown>
);
