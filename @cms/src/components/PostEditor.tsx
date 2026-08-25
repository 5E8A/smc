import { useState } from "react";
import { ImageIcon } from "@phosphor-icons/react";
import type { BlogPost, Lang } from "../types";
import { displayToIso, isoToDisplay } from "../lib/dates";
import { slugify } from "@smc/shared/slug";
import { AssetThumb } from "./ImageLibrary";
import { useImagePicker } from "./useImagePicker";
import { AuthorPicker } from "./AuthorPicker";
import { MarkdownEditorPanel } from "./MarkdownEditorPanel";
import { Button, ComboInput, Field, TextArea, TextInput } from "./fields";

interface PostEditorProps {
  post: BlogPost;
  lang: Lang;
  categories: string[];
  onChange: (next: BlogPost) => void;
}

export const PostEditor = ({ post, lang, categories, onChange }: PostEditorProps) => {
  const [slugAuto, setSlugAuto] = useState(post.slug === "");
  const { open, picker } = useImagePicker((path, target) => {
    if (target === "cover") onChange({ ...post, coverImage: path });
  });

  return (
    <div className="space-y-5">
      {picker}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Title">
          <TextInput
            value={post.title}
            onChange={(e) => {
              const title = e.target.value;
              onChange(slugAuto ? { ...post, title, slug: slugify(title) } : { ...post, title });
            }}
          />
        </Field>
        <Field label="Slug" hint={slugAuto ? "Auto-generated from title" : undefined}>
          <div className="flex items-center gap-2">
            <TextInput
              value={post.slug}
              onChange={(e) => onChange({ ...post, slug: e.target.value })}
              className="font-mono"
            />
            <label className="flex shrink-0 cursor-pointer items-center gap-1 text-xs text-zinc-400">
              <input
                type="checkbox"
                checked={slugAuto}
                onChange={(e) => {
                  setSlugAuto(e.target.checked);
                  if (e.target.checked) onChange({ ...post, slug: slugify(post.title) });
                }}
                className="accent-green-500"
              />
              auto
            </label>
          </div>
        </Field>

        <Field label="Category">
          <ComboInput
            id="post-category"
            options={categories}
            value={post.category}
            onChange={(e) => onChange({ ...post, category: e.target.value })}
          />
        </Field>
        <Field label="Date" hint={`Stored as "${post.date}" (${lang})`}>
          <input
            type="date"
            value={displayToIso(post.date, lang) ?? ""}
            onChange={(e) => onChange({ ...post, date: isoToDisplay(e.target.value, lang) ?? e.target.value })}
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-100 outline-none focus:border-green-500 [color-scheme:dark]"
          />
        </Field>
      </div>

      <Field label="Author" variant="block" hint="Referenced by id from the shared registry">
        <AuthorPicker value={post.author} lang={lang} onChange={(author) => onChange({ ...post, author })} />
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Cover image" variant="block">
          <div className="flex items-start gap-2">
            <AssetThumb path={post.coverImage} />
            <div className="flex-1 space-y-2">
              <TextInput
                value={post.coverImage}
                onChange={(e) => onChange({ ...post, coverImage: e.target.value })}
                className="font-mono text-xs"
                placeholder="/smc/assets/posts/…"
              />
              <Button variant="ghost" onClick={() => open("cover")}>
                <ImageIcon size={15} /> Pick
              </Button>
            </div>
          </div>
        </Field>

        <Field label="Summary">
          <TextArea rows={3} value={post.summary} onChange={(e) => onChange({ ...post, summary: e.target.value })} />
        </Field>
      </div>

      <MarkdownEditorPanel
        id="post-content"
        value={post.content}
        onChange={(content) => onChange({ ...post, content })}
      />
    </div>
  );
};
