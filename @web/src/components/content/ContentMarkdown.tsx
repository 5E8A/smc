import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeSlug from "rehype-slug";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { smcSanitizeSchema } from "@smc/shared/rehype-sanitize-schema";
import type { PluggableList } from "unified";
import { ArrowSquareOutIcon } from "@phosphor-icons/react";
import {
  parseCarouselImages,
  processCarousel,
  processIcons,
  remarkNoH1,
  remarkTableCategoryHeader,
  remarkUnwrapBlocks,
} from "@smc/shared/markdown";
import Icon from "@/components/content/IconMap";
import Carousel from "@/components/media/Carousel";
import SmartImage from "@/components/media/SmartImage";

type MarkdownComponents = Components & {
  icon: React.ComponentType<{ name?: string; className?: string; node?: unknown }>;
  carousel: React.ComponentType<{ images?: string; className?: string; node?: unknown }>;
};

interface ContentMarkdownProps {
  content: string;
}

const components: MarkdownComponents = {
  icon: ({ name: iconName, node, ...rest }) => <Icon name={iconName ?? ""} {...rest} />,
  carousel: ({ images, node, ...rest }) => {
    const imgs = parseCarouselImages(images);
    if (imgs.length === 0) return null;
    return (
      <div className="my-8 overflow-hidden rounded-xl border border-white/10 shadow-lg" {...rest}>
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
  h1: ({ children, node, ...props }) => (
    <h1 className="mt-2 mb-6 scroll-mt-28 text-3xl font-bold text-white md:text-4xl" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, node, ...props }) => (
    <h2 className="mt-10 mb-4 scroll-mt-28 border-b border-white/10 pb-2 text-2xl font-bold text-white" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, node, ...props }) => (
    <h3 className="mt-8 mb-3 scroll-mt-28 text-xl font-bold text-white" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, node, ...props }) => (
    <h4 className="mt-6 mb-2 scroll-mt-28 text-lg font-bold text-white/90" {...props}>
      {children}
    </h4>
  ),
  p: ({ children, node, ...props }) => (
    <p className="mb-4 text-base leading-7 text-gray-300" {...props}>
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
    <del className="text-white/50 line-through" {...props}>
      {children}
    </del>
  ),
  code: ({ className: codeClassName, children, node, ...props }) => {
    const isBlock = codeClassName?.includes("language-");
    if (isBlock) {
      return (
        <code className="block overflow-x-auto rounded-lg bg-black/40 p-4 text-sm text-green-300" {...props}>
          {children}
        </code>
      );
    }
    return (
      <code
        className="rounded border border-white/10 bg-black/30 px-1.5 py-0.5 font-mono text-sm text-green-300"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children, node, ...props }) => (
    <pre className="mb-6 overflow-x-auto rounded-xl border border-white/5 bg-black/20" {...props}>
      {children}
    </pre>
  ),
  blockquote: ({ children, node, ...props }) => (
    <blockquote className="my-6 border-l-4 border-green-500/50 pl-4 text-gray-400 italic" {...props}>
      {children}
    </blockquote>
  ),
  ul: ({ children, node, ...props }) => (
    <ul className="mb-4 ml-6 list-disc space-y-1 text-gray-300" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, node, ...props }) => (
    <ol className="mb-4 ml-6 list-decimal space-y-1 text-gray-300" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, node, ...props }) => (
    <li className="leading-7" {...props}>
      {children}
    </li>
  ),
  input: ({ checked, node, ...props }) => (
    <input type="checkbox" checked={checked} readOnly className="mr-2 accent-green-500" {...props} />
  ),
  table: ({ children, node, ...props }) => (
    <div className="my-6 overflow-x-auto rounded-lg border border-white/5">
      <table className="w-full border-collapse text-sm" {...props}>
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
    <th className={`px-4 py-3 text-left font-bold text-white${thClassName ? ` ${thClassName}` : ""}`} {...props}>
      {children}
    </th>
  ),
  td: ({ children, node, className: tdClassName, ...props }) => (
    <td className={`border-r border-b border-white/5 px-4 py-2.5 text-gray-300${tdClassName ? ` ${tdClassName}` : ""}`} {...props}>
      {children}
    </td>
  ),
  hr: ({ node, ...props }) => <hr className="my-8 border-white/5" {...props} />,
  img: ({ src, alt, title }) => (
    <figure className="my-6 w-fit max-w-full overflow-hidden rounded-xl border border-white/10">
      <SmartImage src={typeof src === "string" ? src : ""} alt={alt || ""} fit="natural" controls />
      {title && <figcaption className="bg-black/40 p-2 text-center text-xs text-mc-text-muted">{title}</figcaption>}
    </figure>
  ),
};

const remarkPlugins: PluggableList = [remarkGfm, remarkBreaks, remarkNoH1, remarkTableCategoryHeader, remarkUnwrapBlocks];
const rehypePlugins: PluggableList = [rehypeSlug, rehypeRaw, [rehypeSanitize, smcSanitizeSchema]];

const ContentMarkdown = ({ content }: ContentMarkdownProps) => (
  <Markdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins} components={components}>
    {processIcons(processCarousel(content))}
  </Markdown>
);

export default ContentMarkdown;
