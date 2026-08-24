import { useImagePicker } from "./ImagePicker";
import type { Author } from "../types";
import { AssetThumb } from "./ImagePicker";
import { Button, Field, TextArea, TextInput } from "./fields";

interface AuthorFormProps {
  author: Author | null;
  onChange: (next: Author) => void;
}

export const AuthorForm = ({ author, onChange }: AuthorFormProps) => {
  if (!author) {
    return (
      <p className="text-sm text-zinc-500">
        Authors are shared across languages. Picking one in the post/wiki editors links it by id — edits here propagate
        to every page using them on the next site build.
      </p>
    );
  }
  return <AuthorEditor key={author.id} author={author} onChange={onChange} />;
};

function AuthorEditor({ author, onChange }: { author: Author; onChange: (next: Author) => void }) {
  const { open, picker } = useImagePicker((path) => onChange({ ...author, avatar: path }));

  const loc = (field: "name" | "bio", l: "en" | "pl", v: string) =>
    onChange({ ...author, [field]: { ...author[field], [l]: v } });

  return (
    <div className="space-y-4">
      {picker}

      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">Id</span>
        <code className="rounded border border-zinc-800 bg-black/40 px-2 py-0.5 font-mono text-xs text-green-300">
          {author.id || "(generated on save)"}
        </code>
      </div>

      <Field label="Avatar" variant="block">
        <div className="flex items-start gap-2">
          <AssetThumb path={author.avatar} />
          <div className="flex-1 space-y-2">
            <TextInput
              value={author.avatar}
              onChange={(e) => onChange({ ...author, avatar: e.target.value })}
              className="font-mono text-xs"
              placeholder="/smc/assets/avatars/…"
            />
            <Button variant="ghost" onClick={() => open("avatar")}>
              Pick image
            </Button>
          </div>
        </div>
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Name (EN)">
          <TextInput value={author.name.en} onChange={(e) => loc("name", "en", e.target.value)} />
        </Field>
        <Field label="Name (PL)">
          <TextInput value={author.name.pl} onChange={(e) => loc("name", "pl", e.target.value)} />
        </Field>
        <Field label="Bio (EN)">
          <TextArea rows={3} value={author.bio.en} onChange={(e) => loc("bio", "en", e.target.value)} />
        </Field>
        <Field label="Bio (PL)">
          <TextArea rows={3} value={author.bio.pl} onChange={(e) => loc("bio", "pl", e.target.value)} />
        </Field>
      </div>

      <p className="text-[11px] text-zinc-600">
        Posts and wiki docs reference this author by id — edits propagate everywhere on the next site build. Ids are
        generated automatically and never editable.
      </p>
    </div>
  );
}
