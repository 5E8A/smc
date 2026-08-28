import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDownIcon, ImageIcon, ImagesIcon, SparkleIcon } from "@phosphor-icons/react";
import { useImagePicker } from "./useImagePicker";
import { MarkdownPreview } from "./MarkdownPreview";
import { IconPicker } from "./IconPicker";
import { useIconsSync } from "../lib/useIconsSync";
import { Button, TextArea } from "./fields";

interface MarkdownEditorPanelProps {
  id: string;
  value: string;
  onChange: (next: string) => void;
  actions?: ReactNode;
}

const CAROUSEL_IMAGE_LINE = /^!\[[^\]]*\]\([^)\s]+\)$/;

export const MarkdownEditorPanel = ({ id, value, onChange, actions }: MarkdownEditorPanelProps) => {
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const syncIcons = useIconsSync();

  // Proportional scroll sync, editor -> preview only: the caret's pane stays the source of truth.
  const syncPreviewScroll = useCallback(() => {
    const ta = textareaRef.current;
    const pv = previewRef.current;
    if (!ta || !pv) return;
    const taMax = ta.scrollHeight - ta.clientHeight;
    const pvMax = pv.scrollHeight - pv.clientHeight;
    if (taMax <= 0 || pvMax <= 0) return;
    pv.scrollTop = (ta.scrollTop / taMax) * pvMax;
  }, []);

  useEffect(() => {
    syncPreviewScroll();
  }, [value, syncPreviewScroll]);

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

  const { open, picker } = useImagePicker({
    onPickMany: (items, target) => {
      const lines = items.map((i) => `![${i.alt}](${i.path})`).join("\n");
      insert(target === "carousel" ? `:carouselStart:\n${lines}\n:carouselEnd:` : lines);
    },
  });

  const insertOrWrapCarousel = () => {
    const el = textareaRef.current;
    const selected = el ? value.slice(el.selectionStart, el.selectionEnd).trim() : "";
    if (!selected) {
      open("carousel", { multi: true, title: "Build carousel" });
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
    <div className="flex min-h-0 flex-col lg:h-full lg:shrink-0">
      <div className="sticky top-0 z-[5] flex h-[55px] shrink-0 items-center gap-2 border-b border-zinc-800 bg-zinc-950/95 px-6 backdrop-blur">
        <h3 className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">Content</h3>

        <Button
          variant="default"
          className="px-2.5 py-1 text-xs"
          onClick={() => setIconPickerOpen(true)}
          title="Insert an icon placeholder at cursor"
        >
          <SparkleIcon size={13} /> Icon
        </Button>

        <Button
          variant="default"
          className="px-2.5 py-1 text-xs"
          onClick={() => open("image", { multi: true, title: "Insert media" })}
          title="Insert media at the cursor"
        >
          <ImageIcon size={13} /> Media
        </Button>

        <Button
          variant="default"
          className="px-2.5 py-1 text-xs"
          onClick={insertOrWrapCarousel}
          title="Insert a carousel block, or wrap the selected images/lines"
        >
          <ImagesIcon size={13} /> Carousel
        </Button>

        <Button
          variant="default"
          className="px-2.5 py-1 text-xs"
          onClick={(e) => {
            const main = e.currentTarget.closest("main");
            main?.scrollTo({ top: main.scrollHeight });
          }}
          title="Snap to editor — scroll to the bottom"
        >
          <ArrowDownIcon size={13} /> Editor
        </Button>

        {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
      </div>

      {/* Fills the panel below the toolbar (panel = full main height, so the workspace is exactly
          the space between toolbar and Runner Console); the minmax row makes both panes scroll
          internally. */}
      <div className="grid min-h-0 flex-1 lg:grid-cols-2 lg:grid-rows-[minmax(0,1fr)]">
        <TextArea
          ref={textareaRef}
          id={id}
          rows={20}
          value={value}
          spellCheck={false}
          borderless
          onKeyDown={handleTab}
          onScroll={syncPreviewScroll}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[24rem] pl-6 pr-4 pb-4 pt-1.5 font-mono text-xs leading-5"
        />
        <div
          ref={previewRef}
          className="min-h-[24rem] overflow-y-auto scrollbar-gutter-stable border-t border-zinc-800 bg-black/40 p-4 lg:border-t-0 lg:border-l"
        >
          <MarkdownPreview content={value} />
        </div>
      </div>

      {iconPickerOpen && (
        <IconPicker
          onPick={(name) => {
            insert(`:${name}:`);
            syncIcons();
          }}
          onClose={() => setIconPickerOpen(false)}
        />
      )}

      {picker}
    </div>
  );
};
