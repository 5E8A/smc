import { useRef, useState, type DragEvent } from "react";
import {
  CircleNotchIcon,
  DownloadSimpleIcon,
  FolderOpenIcon,
  TrashIcon,
  UploadSimpleIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { convertImages, downloadBlob } from "../api";
import { Button } from "./fields";

interface StagedFile {
  file: File;
  relPath: string;
}

interface Discovered {
  staged: StagedFile[];
  skipped: number;
}

const SUPPORTED_EXTS = [".png", ".jpg", ".jpeg", ".webp"];

const isSupportedName = (name: string): boolean => {
  const dot = name.lastIndexOf(".");
  return dot >= 0 && SUPPORTED_EXTS.includes(name.slice(dot).toLowerCase());
};

const pushStaged = (acc: StagedFile[], skipped: { n: number }, file: File, relPath: string): void => {
  if (!isSupportedName(relPath)) {
    skipped.n += 1;
    return;
  }
  acc.push({ file, relPath });
};

const readEntryFile = (entry: FileSystemFileEntry): Promise<File> =>
  new Promise((resolve, reject) => entry.file(resolve, reject));

const readAllDirEntries = (reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> =>
  new Promise((resolve, reject) => {
    const all: FileSystemEntry[] = [];
    const step = (): void =>
      reader.readEntries((batch) => {
        if (batch.length === 0) {
          resolve(all);
          return;
        }
        all.push(...batch);
        step();
      }, reject);
    step();
  });

const collectFromEntry = async (
  entry: FileSystemEntry,
  prefix: string,
  acc: StagedFile[],
  skipped: { n: number }
): Promise<void> => {
  if (entry.isFile) {
    const file = await readEntryFile(entry as FileSystemFileEntry);
    pushStaged(acc, skipped, file, prefix + file.name);
    return;
  }
  if (entry.isDirectory) {
    const dir = entry as FileSystemDirectoryEntry;
    const children = await readAllDirEntries(dir.createReader());
    for (const child of children) await collectFromEntry(child, `${prefix}${entry.name}/`, acc, skipped);
  }
};

const mergeDiscovered = (prev: StagedFile[], next: Discovered): StagedFile[] => {
  const map = new Map(prev.map((s) => [s.relPath, s]));
  for (const s of next.staged) map.set(s.relPath, s);
  return [...map.values()].sort((a, b) => a.relPath.localeCompare(b.relPath));
};

const formatSize = (bytes: number): string =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export const ConverterView = () => {
  const [items, setItems] = useState<StagedFile[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [quality, setQuality] = useState(80);
  const [resize, setResize] = useState(false);
  const [maxWidth, setMaxWidth] = useState(1600);
  const [converting, setConverting] = useState(false);
  const [result, setResult] = useState<{ converted: number; errors: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);
  const dirInputRef = useRef<HTMLInputElement | null>(null);
  const filesInputRef = useRef<HTMLInputElement | null>(null);

  const addFiles = (discovered: Discovered) => {
    setItems((prev) => mergeDiscovered(prev, discovered));
    setSkipped((n) => n + discovered.skipped);
    setResult(null);
  };

  const addFromList = (files: File[]): void => {
    const staged: StagedFile[] = [];
    const skip = { n: 0 };
    for (const f of files) pushStaged(staged, skip, f, f.webkitRelativePath || f.name);
    addFiles({ staged, skipped: skip.n });
  };

  const onDrop = async (e: DragEvent): Promise<void> => {
    e.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    const entries: FileSystemEntry[] = [];
    const looseFiles: File[] = [];
    for (const item of Array.from(e.dataTransfer.items)) {
      const entry = item.webkitGetAsEntry?.();
      if (entry) {
        entries.push(entry);
        continue;
      }
      const f = item.getAsFile?.();
      if (f) looseFiles.push(f);
    }
    if (entries.length === 0 && looseFiles.length === 0) {
      addFromList(Array.from(e.dataTransfer.files));
      return;
    }
    const staged: StagedFile[] = [];
    const skip = { n: 0 };
    for (const entry of entries) await collectFromEntry(entry, "", staged, skip);
    for (const f of looseFiles) pushStaged(staged, skip, f, f.name);
    addFiles({ staged, skipped: skip.n });
  };

  const runConvert = async (): Promise<void> => {
    if (!items.length || converting) return;
    setConverting(true);
    setError(null);
    setResult(null);
    try {
      const outcome = await convertImages(items, { quality, resize, maxWidth });
      downloadBlob(outcome.blob, "webp-converter.zip");
      setResult({ converted: outcome.converted, errors: outcome.errors });
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
    } finally {
      setConverting(false);
    }
  };

  const totalBytes = items.reduce((sum, s) => sum + s.file.size, 0);

  return (
    <div
      className="relative space-y-4"
      onDragEnter={(e) => {
        e.preventDefault();
        if (![...e.dataTransfer.types].includes("Files")) return;
        dragDepth.current += 1;
        setDragging(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        dragDepth.current -= 1;
        if (dragDepth.current <= 0) {
          dragDepth.current = 0;
          setDragging(false);
        }
      }}
      onDrop={(e) => void onDrop(e)}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="mr-auto text-sm font-bold text-white">
          Converter
          <span className="ml-2 text-xs font-normal text-zinc-500">
            drop folders or pick them — everything is re-encoded to webp into a downloadable zip, nothing touches
            public/assets
          </span>
        </h2>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="default" onClick={() => dirInputRef.current?.click()}>
          <FolderOpenIcon size={15} /> Choose folder…
        </Button>
        <Button variant="default" onClick={() => filesInputRef.current?.click()}>
          <UploadSimpleIcon size={15} /> Choose files…
        </Button>
        {items.length > 0 && (
          <Button variant="ghost" onClick={() => setItems([])}>
            <TrashIcon size={14} /> Clear list
          </Button>
        )}

        <span className="ml-auto flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-1 text-xs text-zinc-400">
            q
            <input
              type="number"
              min={1}
              max={100}
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-12 rounded bg-zinc-900 px-1 py-0.5 text-xs text-zinc-200 outline-none focus:border-green-500 border border-zinc-700"
            />
          </label>
          <label className="inline-flex cursor-pointer items-center gap-1 text-xs text-zinc-400">
            <input
              type="checkbox"
              checked={resize}
              onChange={(e) => setResize(e.target.checked)}
              className="accent-green-500"
            />
            resize
          </label>
          <input
            type="number"
            min={64}
            max={4096}
            step={64}
            value={maxWidth}
            disabled={!resize}
            onChange={(e) => setMaxWidth(Number(e.target.value))}
            title="max width (opt-in)"
            className={`w-16 rounded bg-zinc-900 px-1 py-0.5 text-xs outline-none border border-zinc-700 ${
              resize ? "text-zinc-200 focus:border-green-500" : "text-zinc-600 opacity-50"
            }`}
          />
          <Button variant="primary" onClick={() => void runConvert()} disabled={!items.length || converting}>
            {converting ? <CircleNotchIcon size={15} className="animate-spin" /> : <DownloadSimpleIcon size={15} />}
            {converting ? "Converting…" : `Convert ${items.length || ""} & download zip`}
          </Button>
        </span>
      </div>

      <div className="min-h-[320px] rounded-xl border-2 border-dashed border-zinc-800 p-2">
        {items.length === 0 ? (
          <div className="flex h-[300px] flex-col items-center justify-center gap-2 text-center">
            <UploadSimpleIcon size={34} className="text-zinc-600" />
            <p className="text-sm font-medium text-zinc-400">No files staged</p>
            <p className="text-xs text-zinc-600">
              Drop folders here — nested sub-folders are discovered automatically. png / jpg / webp only.
            </p>
          </div>
        ) : (
          <div className="max-h-[420px] overflow-y-auto font-mono text-[11px]">
            {items.map((s) => (
              <div key={s.relPath} className="flex items-baseline gap-3 px-1 py-0.5 hover:bg-zinc-900/60">
                <span className="truncate text-zinc-300" title={s.relPath}>
                  {s.relPath}
                </span>
                <span className="ml-auto shrink-0 text-zinc-600">{formatSize(s.file.size)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        {items.length > 0 && (
          <span className="text-zinc-500">
            {items.length} file{items.length === 1 ? "" : "s"} · {formatSize(totalBytes)} staged
          </span>
        )}
        {skipped > 0 && (
          <span className="text-amber-400">
            {skipped} unsupported file{skipped === 1 ? "" : "s"} skipped
          </span>
        )}
        {result && (
          <span className="text-green-400">
            Downloaded webp-converter.zip — {result.converted} converted
            {result.errors > 0 ? `, ${result.errors} failed (see CONVERSION-ERRORS.txt)` : ""}
          </span>
        )}
        {error && (
          <span className="flex items-center gap-1.5 text-red-400">
            <WarningCircleIcon size={13} /> {error}
          </span>
        )}
      </div>

      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-green-500 bg-green-950/80 backdrop-blur-sm">
          <UploadSimpleIcon size={42} className="text-green-400" />
          <p className="text-lg font-bold text-green-300">Drop folders or files to stage</p>
        </div>
      )}

      <input
        ref={dirInputRef}
        type="file"
        multiple
        className="hidden"
        {...{ webkitdirectory: "", directory: "" }}
        onChange={(e) => {
          addFromList([...(e.target.files ?? [])]);
          e.target.value = "";
        }}
      />
      <input
        ref={filesInputRef}
        type="file"
        multiple
        accept=".png,.jpg,.jpeg,.webp"
        className="hidden"
        onChange={(e) => {
          addFromList([...(e.target.files ?? [])]);
          e.target.value = "";
        }}
      />
    </div>
  );
};
