import { useEffect, useState } from "react";
import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import type { Author, Lang } from "../types";
import { loadAuthorsList, getCachedAuthors } from "../lib/authorCache";
import { AssetThumb } from "./ImageLibrary";
import { Button } from "./fields";

interface PickerProps {
  lang: Lang;
  onClose: () => void;
  onSelect: (id: string) => void;
}

const AuthorPickerModal = ({ lang, onClose, onSelect }: PickerProps) => {
  const [authors, setAuthors] = useState<Author[] | null>(getCachedAuthors());
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getCachedAuthors()) {
      loadAuthorsList()
        .then(setAuthors)
        .catch((e) => setError(String(e)));
    }
  }, []);

  const filtered = (authors ?? []).filter(
    (a) =>
      a.name.en.toLowerCase().includes(query.toLowerCase()) ||
      a.name.pl.toLowerCase().includes(query.toLowerCase()) ||
      a.id.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" onClick={onClose}>
      <div
        className="flex h-full max-h-[560px] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <h2 className="text-sm font-bold text-white">Pick an author</h2>
          <Button variant="ghost" onClick={onClose} aria-label="Close">
            <XIcon size={16} />
          </Button>
        </div>

        <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-2.5">
          <div className="relative flex-1">
            <MagnifyingGlassIcon size={14} className="absolute top-1/2 left-2.5 -translate-y-1/2 text-zinc-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 py-1.5 pr-2 pl-7 text-sm outline-none focus:border-green-500"
            />
          </div>
        </div>

        {error && <p className="mx-4 mt-2 rounded-md bg-red-950/50 p-2 text-xs text-red-300">{error}</p>}

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {authors === null ? (
            <p className="text-sm text-zinc-500">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-zinc-500">No authors match.</p>
          ) : (
            filtered.map((a) => (
              <div key={a.id} className="mb-2 flex items-center gap-3 rounded-lg border border-zinc-800 p-2.5">
                <AssetThumb path={a.avatar} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {a.name[lang]} <span className="ml-1 font-mono text-[10px] text-zinc-600">{a.id}</span>
                  </p>
                  <p className="truncate text-xs text-zinc-500">{a.bio[lang]}</p>
                </div>
                <Button variant="default" onClick={() => onSelect(a.id)}>
                  Use
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

interface AuthorPickerProps {
  value: string;
  lang: Lang;
  onChange: (id: string) => void;
}

export const AuthorPicker = ({ value, lang, onChange }: AuthorPickerProps) => {
  const [openState, setOpenState] = useState(false);
  const [authors, setAuthors] = useState<Author[] | null>(getCachedAuthors());

  useEffect(() => {
    if (!getCachedAuthors()) {
      loadAuthorsList()
        .then(setAuthors)
        .catch(() => {});
    }
  }, []);

  const resolved = authors?.find((a) => a.id === value) ?? null;

  return (
    <div>
      <div className="flex items-center gap-3 rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-2">
        {resolved ? (
          <>
            <AssetThumb path={resolved.avatar} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{resolved.name[lang]}</p>
              {resolved.bio[lang] && <p className="truncate text-xs text-zinc-500">{resolved.bio[lang]}</p>}
            </div>
          </>
        ) : (
          <div className="min-w-0 flex-1">
            {value ? (
              <p className="truncate text-sm font-medium text-red-400">Unknown author: {value}</p>
            ) : (
              <p className="text-sm text-zinc-500">(no author selected)</p>
            )}
          </div>
        )}
        <Button variant="default" onClick={() => setOpenState(true)}>
          Change
        </Button>
      </div>
      {openState && (
        <AuthorPickerModal
          lang={lang}
          onClose={() => setOpenState(false)}
          onSelect={(id) => {
            onChange(id);
            setOpenState(false);
          }}
        />
      )}
    </div>
  );
};
