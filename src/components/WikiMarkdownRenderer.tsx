import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { ArrowSquareOutIcon } from "@phosphor-icons/react";

interface WikiMarkdownRendererProps {
  content: string;
}

const WikiMarkdownRenderer = ({ content }: WikiMarkdownRendererProps) => (
  <Markdown
    remarkPlugins={[remarkGfm]}
    rehypePlugins={[rehypeSlug]}
    components={{
      a: ({ href, children, ...props }) => {
        const isExternal = href?.startsWith("http");
        if (isExternal) {
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-mc-green-text transition-colors hover:text-white hover:shadow-[inset_0_-1px_0_currentColor]"
              {...props}
            >
              {children}
              <ArrowSquareOutIcon
                aria-hidden
                weight="bold"
                size="1em"
                className="ml-1 inline-block"
                style={{ verticalAlign: "-0.125em" }}
              />
            </a>
          );
        }
        return (
          <a href={href} className="text-mc-green-text hover:text-white" {...props}>
            {children}
          </a>
        );
      },
      h1: ({ children, ...props }) => (
        <h1
          className="mb-6 mt-2 scroll-mt-28 text-3xl font-bold text-white md:text-4xl"
          {...props}
        >
          {children}
        </h1>
      ),
      h2: ({ children, ...props }) => (
        <h2
          className="mb-4 mt-10 scroll-mt-28 border-b border-white/10 pb-2 text-2xl font-bold text-white"
          {...props}
        >
          {children}
        </h2>
      ),
      h3: ({ children, ...props }) => (
        <h3 className="mb-3 mt-8 scroll-mt-28 text-xl font-bold text-white" {...props}>
          {children}
        </h3>
      ),
      h4: ({ children, ...props }) => (
        <h4 className="mb-2 mt-6 scroll-mt-28 text-lg font-bold text-white/90" {...props}>
          {children}
        </h4>
      ),
      p: ({ children, ...props }) => (
        <p className="mb-4 text-base leading-7 text-gray-300" {...props}>
          {children}
        </p>
      ),
      strong: ({ children, ...props }) => (
        <strong className="font-bold text-white" {...props}>
          {children}
        </strong>
      ),
      em: ({ children, ...props }) => (
        <em className="italic text-white/80" {...props}>
          {children}
        </em>
      ),
      del: ({ children, ...props }) => (
        <del className="text-white/40 line-through" {...props}>
          {children}
        </del>
      ),
      code: ({ className: codeClassName, children, ...props }) => {
        const isBlock = codeClassName?.includes("language-");
        if (isBlock) {
          return (
            <code className="block overflow-x-auto rounded-lg bg-black/40 p-4 text-sm text-green-300" {...props}>
              {children}
            </code>
          );
        }
        return (
          <code className="rounded border border-white/10 bg-black/30 px-1.5 py-0.5 font-mono text-sm text-green-300" {...props}>
            {children}
          </code>
        );
      },
      pre: ({ children, ...props }) => (
        <pre className="mb-6 overflow-x-auto rounded-xl border border-white/5 bg-black/20" {...props}>
          {children}
        </pre>
      ),
      blockquote: ({ children, ...props }) => (
        <blockquote
          className="my-6 border-l-4 border-green-500/50 pl-4 text-gray-400 italic"
          {...props}
        >
          {children}
        </blockquote>
      ),
      ul: ({ children, ...props }) => (
        <ul className="mb-4 ml-6 list-disc space-y-1 text-gray-300" {...props}>
          {children}
        </ul>
      ),
      ol: ({ children, ...props }) => (
        <ol className="mb-4 ml-6 list-decimal space-y-1 text-gray-300" {...props}>
          {children}
        </ol>
      ),
      li: ({ children, ...props }) => (
        <li className="leading-7" {...props}>
          {children}
        </li>
      ),
      input: ({ checked, ...props }) => (
        <input
          type="checkbox"
          checked={checked}
          readOnly
          className="mr-2 accent-green-500"
          {...props}
        />
      ),
      table: ({ children, ...props }) => (
        <div className="my-6 overflow-x-auto rounded-lg border border-white/5">
          <table className="w-full border-collapse text-sm" {...props}>
            {children}
          </table>
        </div>
      ),
      thead: ({ children, ...props }) => (
        <thead className="border-b border-white/10 bg-black/20" {...props}>
          {children}
        </thead>
      ),
      th: ({ children, ...props }) => (
        <th className="px-4 py-3 text-left font-bold text-white" {...props}>
          {children}
        </th>
      ),
      td: ({ children, ...props }) => (
        <td className="border-b border-white/5 px-4 py-2.5 text-gray-300" {...props}>
          {children}
        </td>
      ),
      hr: (props) => <hr className="my-8 border-white/5" {...props} />,
      img: ({ src, alt, ...props }) => (
        <figure className="my-6 overflow-hidden rounded-xl border border-white/10">
          {/* biome-ignore lint/a11y/useAltText: alt is passed through */}
          <img src={src} alt={alt || ""} className="h-auto w-full object-cover" {...props} />
          {alt && <figcaption className="bg-black/40 p-2 text-center text-xs text-mc-text-muted">{alt}</figcaption>}
        </figure>
      ),
    }}
  >
    {content}
  </Markdown>
);

export default WikiMarkdownRenderer;
