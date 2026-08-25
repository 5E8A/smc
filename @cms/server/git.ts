import { spawn, type ChildProcess } from "child_process";
import type { ServerResponse } from "http";
import { REPO_ROOT, sendJson } from "./util.ts";

export interface GitChange {
  path: string;
  x: string;
  y: string;
}

export interface GitStatus {
  branch: string;
  upstream: string | null;
  ahead: number;
  behind: number;
  changes: GitChange[];
  lastCommit: { hash: string; subject: string; date: string } | null;
}

let running = false;
let currentChild: ChildProcess | null = null;

const GIT_ENV = { ...process.env, GIT_TERMINAL_PROMPT: "0", GIT_ASKPASS: "echo" };

interface GitResult {
  code: number;
  out: string;
  err: string;
}

function runGit(args: string[]): Promise<GitResult> {
  return new Promise((resolve) => {
    const child = spawn("git", args, { cwd: REPO_ROOT, windowsHide: true, env: GIT_ENV });
    let out = "";
    let err = "";
    child.stdout.on("data", (b: Buffer) => (out += b.toString("utf8")));
    child.stderr.on("data", (b: Buffer) => (err += b.toString("utf8")));
    child.on("error", (e) => resolve({ code: -1, out, err: e.message }));
    child.on("close", (code) => resolve({ code: code ?? -1, out, err }));
  });
}

function parsePorcelain(out: string): Omit<GitStatus, "lastCommit"> {
  const lines = out.split(/\r?\n/).filter((l) => l.length > 0);
  let branch = "unknown";
  let upstream: string | null = null;
  let ahead = 0;
  let behind = 0;
  const changes: GitChange[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (i === 0 && line.startsWith("## ")) {
      const rest = line.slice(3);
      const [names, metaBracket] = rest.split(" [");
      const parts = names.split("...");
      branch = parts[0] ?? branch;
      upstream = parts.length === 2 ? parts[1] : null;
      const meta = metaBracket?.replace(/\]$/, "");
      if (meta) {
        if (/ahead/.test(meta)) ahead = Number(/ahead (\d+)/.exec(meta)?.[1]) || 0;
        if (/behind/.test(meta)) behind = Number(/behind (\d+)/.exec(meta)?.[1]) || 0;
      }
      continue;
    }
    const x = line[0] ?? " ";
    const y = line[1] ?? " ";
    let path = line.slice(3);
    if ((x === "R" || x === "C") && path.includes(" -> ")) {
      path = path.slice(path.indexOf(" -> ") + 4);
    }
    if (path) changes.push({ path, x, y });
  }
  return { branch, upstream, ahead, behind, changes };
}

export async function readGitStatus(): Promise<GitStatus> {
  await runGit(["fetch", "origin", "--quiet"]);
  const statusResult = await runGit(["status", "--porcelain=v1", "-b"]);
  const logResult = await runGit(["log", "-1", "--format=%h%x1f%s%x1f%ci"]);
  const state = parsePorcelain(statusResult.out);

  let lastCommit: GitStatus["lastCommit"] = null;
  if (logResult.code === 0 && logResult.out.trim()) {
    const [hash, subject, date] = logResult.out.trim().split("\x1f");
    if (hash && subject) lastCommit = { hash, subject, date: date ?? "" };
  }
  return { ...state, lastCommit };
}

function openSse(res: ServerResponse): void {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-store",
    Connection: "keep-alive",
  });
}

function send(res: ServerResponse, event: string, data: string): void {
  if (!res.writableEnded && !res.destroyed) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function runStreamStep(res: ServerResponse, args: string[]): Promise<number> {
  send(res, "log", `> git ${args.join(" ")}`);
  return new Promise((resolve, reject) => {
    const child = spawn("git", args, { cwd: REPO_ROOT, windowsHide: true, env: GIT_ENV });
    currentChild = child;
    let buf = "";
    const onData = (b: Buffer) => {
      const text = buf + b.toString("utf8");
      const lines = text.split(/\r?\n/);
      buf = lines.pop() ?? "";
      for (const line of lines) if (line.trim()) send(res, "log", line);
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.on("error", reject);
    child.on("close", (code) => {
      if (currentChild === child) currentChild = null;
      send(res, "log", `[exit ${code ?? 1}]`);
      resolve(code ?? 1);
    });
  });
}

export function streamGitDeploy(res: ServerResponse, message: string, paths: string[]): void {
  if (running) {
    sendJson(res, 409, { error: "a git operation is already running" });
    return;
  }
  running = true;
  openSse(res);

  const stop = () => {
    if (currentChild && !currentChild.killed) currentChild.kill();
    currentChild = null;
    running = false;
  };

  res.on("close", stop);

  void (async () => {
    let status = "ok";
    try {
      const steps: [string, string[]][] = [
        ["add", ["add", "--", ...paths]],
        ["commit", ["commit", "-m", message]],
        ["push branch", ["push", "origin", "HEAD"]],
        ["push main", ["push", "origin", "HEAD:main"]],
      ];
      for (const [stage, args] of steps) {
        const code = await runStreamStep(res, args);
        if (code !== 0) {
          status = stage === "commit" && code === 1 ? "nothing to commit" : `failed at stage: ${stage}`;
          break;
        }
      }
    } catch (err) {
      send(res, "log", `Failed to start git: ${(err as Error).message}`);
      status = "failed to start git";
    } finally {
      stop();
      send(res, "done", status);
      res.end();
    }
  })();
}

export function streamGitPull(res: ServerResponse): void {
  if (running) {
    sendJson(res, 409, { error: "a git operation is already running" });
    return;
  }
  running = true;
  openSse(res);

  const stop = () => {
    if (currentChild && !currentChild.killed) currentChild.kill();
    currentChild = null;
    running = false;
  };

  res.on("close", stop);

  void (async () => {
    let status = "ok";
    try {
      const code = await runStreamStep(res, ["merge", "--ff-only", "@{u}"]);
      if (code !== 0) status = `pull failed (exit ${code})`;
    } catch (err) {
      send(res, "log", `Failed to start git: ${(err as Error).message}`);
      status = "failed to start git";
    } finally {
      stop();
      send(res, "done", status);
      res.end();
    }
  })();
}
