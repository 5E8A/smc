import path from "path";
import { spawn } from "child_process";
import { REPO_ROOT, readJson, writeJsonAtomic } from "./util.ts";

export const MOD_LIST_FILE = path.join(REPO_ROOT, "@scripts", "mod-list.json");

export interface ModListColumn {
  key: string;
  slugs: string[];
}

export interface Issue {
  entry: number;
  field: string;
  message: string;
  severity: "error" | "warning";
}

interface ValidationResult {
  issues: Issue[];
}

function validateModList(data: unknown): ValidationResult {
  const issues: Issue[] = [];
  if (!Array.isArray(data)) {
    return { issues: [{ entry: -1, field: "data", message: "mod list must be an array", severity: "error" }] };
  }

  const seenKeys = new Set<string>();
  const seenSlugs = new Map<string, string>();
  const columns = data as ModListColumn[];

  columns.forEach((col, i) => {
    if (!col || typeof col.key !== "string" || col.key.trim() === "") {
      issues.push({ entry: i, field: "key", message: "column key must be a non-empty string", severity: "error" });
      return;
    }
    if (seenKeys.has(col.key)) {
      issues.push({ entry: i, field: "key", message: `duplicate column key "${col.key}"`, severity: "error" });
    }
    seenKeys.add(col.key);

    if (!Array.isArray(col.slugs)) {
      issues.push({ entry: i, field: "slugs", message: 'slugs must be an array of strings ("[a-z0-9-]")', severity: "error" });
      return;
    }
    col.slugs.forEach((slug, j) => {
      if (typeof slug !== "string" || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
        issues.push({ entry: i, field: "slugs", message: `slugs[${j}] must be a non-empty lowercase slug`, severity: "error" });
        return;
      }
      const prev = seenSlugs.get(slug);
      if (prev != null) {
        issues.push({ entry: i, field: "slugs", message: `slug "${slug}" already in column "${prev}" - it will repeat`, severity: "warning" });
      }
      seenSlugs.set(slug, col.key);
    });
  });

  return { issues };
}

export async function loadModList(): Promise<ModListColumn[]> {
  return (await readJson(MOD_LIST_FILE)) as ModListColumn[];
}

export async function saveModList(data: unknown): Promise<ValidationResult & { data?: ModListColumn[] }> {
  const { issues } = validateModList(data);
  const hasErrors = issues.some((i) => i.severity === "error");
  if (hasErrors) return { issues };
  const columns = data as ModListColumn[];
  await writeJsonAtomic(MOD_LIST_FILE, columns);
  return { issues, data: columns };
}

let running = false;

export function runSyncMods(res: import("http").ServerResponse): void {
  if (running) {
    res.writeHead(409, { "Content-Type": "text/plain" });
    res.end("sync-mods already running");
    return;
  }
  running = true;

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-store",
    Connection: "keep-alive",
  });

  const send = (event: string, data: string) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const child = spawn(process.execPath, ["@scripts/sync-mods.mjs"], {
    cwd: REPO_ROOT,
    windowsHide: true,
  });

  const onLine = (buf: Buffer) => send("log", buf.toString("utf8"));
  child.stdout.on("data", onLine);
  child.stderr.on("data", onLine);

  child.on("error", (err) => {
    send("log", `Failed to start: ${err.message}`);
    send("done", "error");
    running = false;
    res.end();
  });

  child.on("close", (code) => {
    send("done", code === 0 ? "ok" : `exit ${code}`);
    running = false;
    res.end();
  });

  res.on("close", () => {
    if (!child.killed) child.kill();
    running = false;
  });
}
