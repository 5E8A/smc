import { useState } from "react";
import { ImageIcon } from "@phosphor-icons/react";
import type { Lang, WikiDoc } from "../types";
import { slugify } from "../../../shared/slug";
import { AssetThumb, useImagePicker } from "./ImagePicker";
import { AuthorPicker } from "./AuthorPicker";
import { MarkdownEditorPanel } from "./MarkdownEditorPanel";
import { Button, ComboInput, Field, TextArea, TextInput } from "./fields";

interface WikiEditorProps {
  doc: WikiDoc;
  lang: Lang;
  categories: string[];
  onChange: (next: WikiDoc) => void;
}

export const WikiEditor = ({ doc, lang, categories, onChange }: WikiEditorProps) => {
  const [slugAuto, setSlugAuto] = useState(doc.slug === "");
  const { open, picker } = useImagePicker((path) => {
    onChange({ ...doc, coverImage: path });
  });

  return (
    <div className="space-y-5">
      {picker}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Title">
          <TextInput
            value={doc.title}
            onChange={(e) => {
              const title = e.target.value;
              onChange(slugAuto ? { ...doc, title, slug: slugify(title) } : { ...doc, title });
            }}
          />
        </Field>
        <Field label="Slug" hint={slugAuto ? "Auto-generated from title" : undefined}>
          <div className="flex items-center gap-2">
            <TextInput
              value={doc.slug}
              onChange={(e) => onChange({ ...doc, slug: e.target.value })}
              className="font-mono"
            />
            <label className="flex shrink-0 cursor-pointer items-center gap-1 text-xs text-zinc-400">
              <input
                type="checkbox"
                checked={slugAuto}
                onChange={(e) => {
                  setSlugAuto(e.target.checked);
                  if (e.target.checked) onChange({ ...doc, slug: slugify(doc.title) });
                }}
                className="accent-green-500"
              />
              auto
            </label>
          </div>
        </Field>

        <Field label="Author" variant="block" hint="Referenced by id from the shared registry">
          <AuthorPicker value={doc.author} lang={lang} onChange={(author) => onChange({ ...doc, author })} />
        </Field>
        <Field label="Category">
          <ComboInput
            id={`wiki-category-${lang}`}
            options={categories}
            value={doc.category}
            onChange={(e) => onChange({ ...doc, category: e.target.value })}
          />
        </Field>

        <Field label="Date (ISO)">
          <input
            type="date"
            value={doc.date}
            onChange={(e) => onChange({ ...doc, date: e.target.value })}
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-100 outline-none focus:border-green-500 [color-scheme:dark]"
          />
        </Field>
        <Field label="Cover image" variant="block">
          <div className="flex items-start gap-2">
            <AssetThumb path={doc.coverImage} />
            <div className="flex-1 space-y-2">
              <TextInput
                value={doc.coverImage}
                onChange={(e) => onChange({ ...doc, coverImage: e.target.value })}
                className="font-mono text-xs"
                placeholder="/smc/assets/banners/…"
              />
              <Button variant="ghost" onClick={() => open("cover")}>
                <ImageIcon size={15} /> Pick
              </Button>
            </div>
          </div>
        </Field>

        <div className="md:col-span-2">
          <Field label="Summary">
            <TextArea rows={2} value={doc.summary} onChange={(e) => onChange({ ...doc, summary: e.target.value })} />
          </Field>
        </div>
      </div>

      <MarkdownEditorPanel
        id="wiki-content"
        value={doc.content}
        onChange={(content) => onChange({ ...doc, content })}
      />
    </div>
  );
};
