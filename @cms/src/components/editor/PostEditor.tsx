import { useState, type ReactNode } from "react";
import { ImageIcon } from "@phosphor-icons/react";
import type { BlogPost, Lang } from "../../types";
import { slugify } from "@smc/shared/slug";
import { AssetThumb } from "../media/ImageLibrary";
import { useImagePicker } from "../media/useImagePicker";
import { AuthorPicker } from "./AuthorPicker";
import { MarkdownEditorPanel } from "./MarkdownEditorPanel";
import { ComboInput, Field, TextArea, TextInput } from "../ui/fields";

interface PostEditorProps {
  post: BlogPost;
  lang: Lang;
  categories: string[];
  onChange: (next: BlogPost) => void;
  actions?: ReactNode;
}

export const PostEditor = ({ post, lang, categories, onChange, actions }: PostEditorProps) => {
  // Slug auto-fills from the title until the user edits it by hand (or it was already hand-set).
  const [slugTouched, setSlugTouched] = useState(post.slug !== slugify(post.title));
  const { open, picker } = useImagePicker({
    onPick: (path, target) => {
      if (target === "cover") onChange({ ...post, coverImage: path });
    },
  });

  return (
    <div className="flex flex-col lg:h-full">
      {picker}

      <div className="shrink-0 space-y-5 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title">
            <TextInput
              value={post.title}
              onChange={(e) => {
                const title = e.target.value;
                onChange({
                  ...post,
                  title,
                  slug: slugTouched ? post.slug : slugify(title),
                });
              }}
            />
          </Field>
          <Field label="Slug">
            <TextInput
              value={post.slug}
              onChange={(e) => {
                setSlugTouched(true);
                onChange({ ...post, slug: e.target.value });
              }}
              className="font-mono"
            />
          </Field>

          <Field label="Category">
            <ComboInput
              id="post-category"
              options={categories}
              value={post.category}
              onChange={(e) => onChange({ ...post, category: e.target.value })}
            />
          </Field>
          <Field label="Date">
            <input
              type="date"
              value={post.date}
              onChange={(e) => onChange({ ...post, date: e.target.value })}
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-100 outline-none focus:border-green-500 [color-scheme:dark]"
            />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Cover image" variant="block">
            <div className="flex items-center gap-2">
              <AssetThumb path={post.coverImage} onPick={() => open("cover")} />
              <div className="relative flex-1">
                <TextInput
                  value={post.coverImage}
                  onChange={(e) => onChange({ ...post, coverImage: e.target.value })}
                  placeholder="/smc/assets/posts/…"
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
            <TextArea rows={3} value={post.summary} onChange={(e) => onChange({ ...post, summary: e.target.value })} />
          </Field>
        </div>

        <Field label="Author" variant="block">
          <AuthorPicker value={post.author} lang={lang} onChange={(author) => onChange({ ...post, author })} />
        </Field>
      </div>

      <MarkdownEditorPanel
        id="post-content"
        value={post.content}
        onChange={(content) => onChange({ ...post, content })}
        actions={actions}
      />
    </div>
  );
};
