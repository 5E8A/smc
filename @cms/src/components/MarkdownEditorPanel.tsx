import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDownIcon, ImageIcon, ImagesIcon, SparkleIcon } from "@phosphor-icons/react";
import { useImagePicker } from "./useImagePicker";
import { MarkdownPreview } from "./MarkdownPreview";
import { IconPicker } from "./IconPicker";
import { useIconsSync } from "../lib/useIconsSync";
import { caretViewportY, toPreviewLine } from "../lib/caretAnchor";
import { Button, TextArea } from "./fields";

interface MarkdownEditorPanelProps {
  id: string;
  value: string;
  onChange: (next: string) => void;
  actions?: ReactNode;
}

const CAROUSEL_IMAGE_LINE = /^!\[[^\]]*\]\([^)\s]+\)$/;

const CARET_SYNC_DELAY = 150;
const CARET_GUARD_MS = 250;
const CARET_VISIBLE_MARGIN = 48;

export const MarkdownEditorPanel = ({ id, value, onChange, actions }: MarkdownEditorPanelProps) => {
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const syncIcons = useIconsSync();

  const lastCaretAt = useRef(0);
  const caretFrame = useRef(0);
  const caretTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Proportional scroll sync for scroll gestures, editor -> preview only. Skipped briefly
  // after caret activity so caret auto-reveal scrolls can't fight the caret-anchored write.
  const syncPreviewScroll = useCallback(() => {
    const ta = textareaRef.current;
    const pv = previewRef.current;
    if (!ta || !pv) return;
    if (performance.now() - lastCaretAt.current < CARET_GUARD_MS) return;
    const taMax = ta.scrollHeight - ta.clientHeight;
    const pvMax = pv.scrollHeight - pv.clientHeight;
    if (taMax <= 0 || pvMax <= 0) return;
    pv.scrollTop = (ta.scrollTop / taMax) * pvMax;
  }, []);

  // Caret-anchored sync. "pin" (typing/inserts) always parks the preview block containing
  // the caret at the caret's own viewport height; the debounced path (arrow keys/clicks)
  // leaves the preview alone while that block stays comfortably visible. Falls back to 1/3
  // placement when the caret can't be measured, and a line-fraction guess when no block
  // is mapped.
  const syncPreviewToCaret = useCallback((pin: boolean) => {
    const ta = textareaRef.current;
    const pv = previewRef.current;
    if (!ta || !pv || document.activeElement !== ta) return;
    const pvMax = pv.scrollHeight - pv.clientHeight;
    if (pvMax <= 0) return;
    lastCaretAt.current = performance.now();
    const caretIndex = ta.selectionStart ?? 0;
    const content = ta.value;
    const caretLine = toPreviewLine(content, caretIndex);
    let anchor: HTMLElement | null = null;
    for (const el of pv.querySelectorAll<HTMLElement>("[data-md-line]")) {
      if (Number(el.dataset.mdLine ?? 0) > caretLine + 1) break;
      anchor = el;
    }
    if (!anchor) {
      const lines = Math.max(1, content.split("\n").length - 1);
      pv.scrollTop = Math.min(pvMax, Math.max(0, (caretLine / lines) * pvMax));
      return;
    }
    const pvRect = pv.getBoundingClientRect();
    const anchorTop = anchor.getBoundingClientRect().top - pvRect.top + pv.scrollTop;
    const anchorBottom = anchorTop + anchor.offsetHeight;
    const relTop = anchorTop - pv.scrollTop;
    const relBottom = anchorBottom - pv.scrollTop;
    const visible =
      (relTop >= -CARET_VISIBLE_MARGIN && relBottom <= pv.clientHeight + CARET_VISIBLE_MARGIN) ||
      (relTop <= 0 && relBottom >= pv.clientHeight);
    if (!pin && visible) return;
    const caretY = caretViewportY(ta, content, caretIndex);
    pv.scrollTop = Math.min(pvMax, Math.max(0, caretY === null ? anchorTop - pv.clientHeight / 3 : anchorTop - caretY));
  }, []);

  // Typing/inserts sync immediately in pin mode; caret moves without content changes
  // debounce into an if-needed pass so continuous arrowing stays calm.
  const queueCaretSync = useCallback(
    (pin = false) => {
      clearTimeout(caretTimer.current);
      cancelAnimationFrame(caretFrame.current);
      lastCaretAt.current = performance.now();
      const run = () => {
        caretFrame.current = requestAnimationFrame(() => syncPreviewToCaret(pin));
      };
      if (pin) run();
      else caretTimer.current = setTimeout(run, CARET_SYNC_DELAY);
    },
    [syncPreviewToCaret]
  );

  useEffect(() => {
    queueCaretSync(true);
  }, [value, queueCaretSync]);

  useEffect(
    () => () => {
      clearTimeout(caretTimer.current);
      cancelAnimationFrame(caretFrame.current);
    },
    []
  );

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
      // Arm + schedule before setting the caret: its reveal-scroll fires in the scroll steps
      // of the next rendering update, before rAF callbacks run.
      queueCaretSync(true);
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      insert("  ");
      return;
    }
    // Arm the guard before the browser's default action moves the caret: the reveal-scroll
    // event fires before `select`, so queue-time arming alone would miss it.
    lastCaretAt.current = performance.now();
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
          onKeyDown={handleKeyDown}
          onScroll={syncPreviewScroll}
          onSelect={() => queueCaretSync()}
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
