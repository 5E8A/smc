import { useState, type ReactNode } from "react";
import { ImageIcon } from "@phosphor-icons/react";
import type { Lang, WikiDoc } from "../types";
import { slugify } from "@smc/shared/slug";
import { AssetThumb } from "./ImageLibrary";
import { useImagePicker } from "./useImagePicker";
import { AuthorPicker } from "./AuthorPicker";
import { MarkdownEditorPanel } from "./MarkdownEditorPanel";
import { ComboInput, Field, TextArea, TextInput } from "./fields";

interface WikiEditorProps {
  doc: WikiDoc;
  lang: Lang;
  categories: string[];
  onChange: (next: WikiDoc) => void;
  actions?: ReactNode;
}

export const WikiEditor = ({ doc, lang, categories, onChange, actions }: WikiEditorProps) => {
  // Slug auto-fills from the title until the user edits it by hand (or it was already hand-set).
  const [slugTouched, setSlugTouched] = useState(doc.slug !== slugify(doc.title));
  const { open, picker } = useImagePicker({
    onPick: (path) => {
      onChange({ ...doc, coverImage: path });
    },
  });

  return (
    <div className="flex flex-col lg:h-full">
      {picker}

      <div className="shrink-0 space-y-5 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title">
            <TextInput
              value={doc.title}
              onChange={(e) => {
                const title = e.target.value;
                onChange({
                  ...doc,
                  title,
                  slug: slugTouched ? doc.slug : slugify(title),
                });
              }}
            />
          </Field>
          <Field label="Slug">
            <TextInput
              value={doc.slug}
              onChange={(e) => {
                setSlugTouched(true);
                onChange({ ...doc, slug: e.target.value });
              }}
              className="font-mono"
            />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Category">
            <ComboInput
              id={`wiki-category-${lang}`}
              options={categories}
              value={doc.category}
              onChange={(e) => onChange({ ...doc, category: e.target.value })}
            />
          </Field>
          <Field label="Date">
            <input
              type="date"
              value={doc.date}
              onChange={(e) => onChange({ ...doc, date: e.target.value })}
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-100 outline-none focus:border-green-500 [color-scheme:dark]"
            />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Cover image" variant="block">
            <div className="flex items-center gap-2">
              <AssetThumb path={doc.coverImage} onPick={() => open("cover")} />
              <div className="relative flex-1">
                <TextInput
                  value={doc.coverImage}
                  onChange={(e) => onChange({ ...doc, coverImage: e.target.value })}
                  placeholder="/smc/assets/banners/…"
                  className="h-[74px] pr-20"
                />
                <button
                  type="button"
                  onClick={() => open("cover")}
                  className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-md bg-zinc-800 px-2.5 py-2 text-xs text-zinc-300 hover:bg-zinc-700"
                >
                  <ImageIcon size={14} /> Pick
                </button>
              </div>
            </div>
          </Field>

          <Field label="Summary">
            <TextArea rows={3} value={doc.summary} onChange={(e) => onChange({ ...doc, summary: e.target.value })} />
          </Field>
        </div>

        <Field label="Author" variant="block">
          <AuthorPicker value={doc.author} lang={lang} onChange={(author) => onChange({ ...doc, author })} />
        </Field>
      </div>

      <MarkdownEditorPanel
        id="wiki-content"
        value={doc.content}
        onChange={(content) => onChange({ ...doc, content })}
        actions={actions}
      />
    </div>
  );
};
