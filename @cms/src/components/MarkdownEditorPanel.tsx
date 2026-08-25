import { useRef, useState } from "react";
import { EyeIcon, ImageIcon, ImagesIcon, PencilSimpleIcon } from "@phosphor-icons/react";
import { KNOWN_ICONS } from "@smc/shared/icons";
import { useImagePicker } from "./useImagePicker";
import { MarkdownPreview } from "./MarkdownPreview";
import { Button, TextArea } from "./fields";

interface MarkdownEditorPanelProps {
  id: string;
  value: string;
  onChange: (next: string) => void;
}

const CAROUSEL_IMAGE_LINE = /^!\[[^\]]*\]\([^)\s]+\)$/;

export const MarkdownEditorPanel = ({ id, value, onChange }: MarkdownEditorPanelProps) => {
  const [mode, setMode] = useState<"split" | "write">("split");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insert = (snippet: string) => {
    const el = textareaRef.current;
    if (!el) {
      onChange(value + snippet);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    onChange(value.slice(0, start) + snippet + value.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + snippet.length;
    });
  };

  const { open, picker } = useImagePicker((path, target) => {
    const caption = window.prompt("Image caption / alt text (optional):", "") ?? "";
    if (target === "carousel") {
      insert(`:carouselStart:\n![${caption}](${path})\n:carouselEnd:`);
    } else {
      insert(`![${caption}](${path})`);
    }
  });

  const insertImageAtCursor = () => {
    open("image");
  };

  const insertOrWrapCarousel = () => {
    const el = textareaRef.current;
    const selected = el ? value.slice(el.selectionStart, el.selectionEnd).trim() : "";
    if (!selected) {
      open("carousel");
      return;
    }
    const lines = selected
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => (CAROUSEL_IMAGE_LINE.test(l) ? l : `![](${l})`))
      .join("\n");
    insert(`:carouselStart:\n${lines}\n:carouselEnd:`);
  };

  const handleTab = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Tab") return;
    e.preventDefault();
    insert("  ");
  };

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h3 className="mr-auto text-xs font-semibold tracking-wider text-zinc-500 uppercase">Content (markdown)</h3>

        <select
          value=""
          onChange={(e) => {
            if (e.target.value) insert(`:${e.target.value}:`);
            e.target.value = "";
          }}
          className="cursor-pointer rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-300 outline-none hover:border-green-500"
          title="Insert icon placeholder at cursor"
        >
          <option value="">Insert icon…</option>
          {KNOWN_ICONS.map((name) => (
            <option key={name} value={name}>
              :{name}:
            </option>
          ))}
        </select>

        <Button
          variant="default"
          className="px-2.5 py-1 text-xs"
          onClick={insertImageAtCursor}
          title="Insert an image at the cursor"
        >
          <ImageIcon size={13} /> Image
        </Button>

        <Button
          variant="default"
          className="px-2.5 py-1 text-xs"
          onClick={insertOrWrapCarousel}
          title="Insert a carousel block, or wrap the selected images/lines"
        >
          <ImagesIcon size={13} /> Carousel
        </Button>

        <div className="flex rounded-md border border-zinc-700">
          <button
            type="button"
            onClick={() => setMode("write")}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs ${mode === "write" ? "bg-green-600 text-white" : "text-zinc-400 hover:text-zinc-200"}`}
          >
            <PencilSimpleIcon size={12} /> Write
          </button>
          <button
            type="button"
            onClick={() => setMode("split")}
            className={`flex items-center gap-1 border-l border-zinc-700 px-2.5 py-1 text-xs ${mode === "split" ? "bg-green-600 text-white" : "text-zinc-400 hover:text-zinc-200"}`}
          >
            <EyeIcon size={12} /> Split
          </button>
        </div>
      </div>

      <div className={`grid gap-3 ${mode === "split" ? "lg:grid-cols-2" : ""}`}>
        <TextArea
          ref={textareaRef}
          id={id}
          rows={20}
          value={value}
          spellCheck={false}
          onKeyDown={handleTab}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[24rem] font-mono text-xs leading-5"
        />
        {mode === "split" && (
          <div className="min-h-[24rem] overflow-y-auto scrollbar-gutter-stable rounded-md border border-zinc-800 bg-black/40 p-4">
            <MarkdownPreview content={value} />
          </div>
        )}
      </div>

      {picker}
    </div>
  );
};
