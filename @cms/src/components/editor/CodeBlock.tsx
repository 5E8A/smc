import { useRef, useState } from "react";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { Highlight, Prism, type PrismTheme } from "prism-react-renderer";
import { registerExtraCodeGrammars } from "@smc/shared/code-grammars";

// Register bash, java, diff, toml, ini (and aliases) onto prism-react-renderer's
// bundled Prism instance. Runs once at module load, identically on SSR + client.
registerExtraCodeGrammars(Prism);

interface CodeBlockProps extends React.HTMLAttributes<HTMLPreElement> {
  code: string;
  language?: string;
}

const codeTheme: PrismTheme = {
  plain: { color: "#e4e4e7" },
  styles: [
    { types: ["comment", "prolog", "doctype", "cdata"], style: { color: "#71717a", fontStyle: "italic" } },
    { types: ["keyword", "atrule", "important", "rule", "selector"], style: { color: "#4ade80" } },
    { types: ["string", "char", "attr-value", "regex", "url"], style: { color: "#86efac" } },
    { types: ["number", "boolean", "constant", "symbol", "unit", "inserted"], style: { color: "#5eead4" } },
    { types: ["function"], style: { color: "#a7f3d0" } },
    { types: ["class-name"], style: { color: "#f0fdf4" } },
    { types: ["operator", "punctuation", "comma"], style: { color: "#a1a1aa" } },
    { types: ["tag"], style: { color: "#2dd4bf" } },
    { types: ["deleted"], style: { color: "#f87171" } },
    { types: ["property", "attr-name", "variable", "parameter"], style: { color: "#22d3ee" } },
  ],
};

const CodeBlock = ({ code, language, ...props }: CodeBlockProps) => {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    const text = ref.current?.textContent?.trimEnd();
    if (!text) return;
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  };

  const lang = language?.trim() || "text";
  const supported = lang in Prism.languages;

  const preClassName =
    "overflow-x-auto rounded-xl border border-zinc-700 bg-zinc-900 p-3.5 pt-10 font-mono text-xs shadow-sm";

  return (
    <div className="group relative mb-4">
      {supported ? (
        <Highlight code={code} language={lang} theme={codeTheme}>
          {({ tokens: tokenLines, getLineProps, getTokenProps }) => {
            // prism-react-renderer emits an empty "phantom" line for a trailing
            // newline in the source; drop trailing ones so the box has no blank row.
            let count = tokenLines.length;
            while (count > 0) {
              const last = tokenLines[count - 1];
              if (last && last.length === 1 && last[0]?.empty) {
                count--;
              } else {
                break;
              }
            }
            return (
              <pre ref={ref} className={preClassName} {...props}>
                {tokenLines.slice(0, count).map((line, i) => (
                  <div key={i} {...getLineProps({ line })}>
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token })} />
                    ))}
                  </div>
                ))}
              </pre>
            );
          }}
        </Highlight>
      ) : (
        <pre ref={ref} className={preClassName} {...props}>
          {code}
        </pre>
      )}
      <div className="pointer-events-none absolute inset-x-4 top-2 z-10 flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-500">{lang}</span>
        <button
          type="button"
          onClick={copy}
          title={copied ? "Copied" : "Copy code"}
          aria-label={copied ? "Copied to clipboard" : "Copy code block"}
          className="pointer-events-auto rounded p-0.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
        >
          {copied ? <CheckIcon size={15} weight="bold" className="text-green-400" /> : <CopyIcon size={15} />}
        </button>
      </div>
    </div>
  );
};

export { CodeBlock };
