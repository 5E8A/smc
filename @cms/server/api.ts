import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "http";
import path from "path";
import { BodyTooLargeError, isKind, isLang, readRawBody, sendJson } from "./util.ts";
import { loadAuthors, loadContent, saveAuthors, saveContent, validateContent } from "./store.ts";
import {
  createDir,
  deleteDir,
  deleteImage,
  findRefs,
  formatMb,
  listDirs,
  listImages,
  renameDir,
  renameImage,
  replaceImage,
  runLqip,
  saveUpload,
  serveAsset,
  uploadLimitFor,
} from "./media.ts";
import { clampMaxWidth, clampQuality } from "./media.ts";
import { buildZip, convertBatch, MAX_CONVERT_BODY, parseMultipart, streamConvertedZip } from "./convert.ts";
import { loadModList, saveModList, runSyncMods } from "./mods.ts";
import { runIconsSync } from "./icons.ts";
import { readGitStatus, streamGitDeploy, streamGitPull } from "./git.ts";

const MAX_JSON_BODY = 5 * 1024 * 1024;

export const CMS_PORT = 4000;

const ALLOWED_HOSTS = new Set([`127.0.0.1:${CMS_PORT}`, `localhost:${CMS_PORT}`]);
const ALLOWED_ORIGINS = new Set([`http://127.0.0.1:${CMS_PORT}`, `http://localhost:${CMS_PORT}`]);
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

async function route(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (!ALLOWED_HOSTS.has((req.headers.host ?? "").toLowerCase())) {
    return void sendJson(res, 403, { error: "forbidden host" });
  }
  const url = new URL(req.url ?? "/", "http://localhost");
  const method = req.method ?? "GET";
  if (MUTATING_METHODS.has(method)) {
    const origin = req.headers.origin;
    if (origin !== undefined && !ALLOWED_ORIGINS.has(origin)) {
      return void sendJson(res, 403, { error: "cross-origin request rejected" });
    }
  }
  const kind = url.searchParams.get("kind");
  const lang = url.searchParams.get("lang");

  switch (url.pathname) {
    case "/content": {
      if (!isKind(kind)) return void sendJson(res, 400, { error: "kind must be posts or wiki" });
      if (!isLang(lang)) return void sendJson(res, 400, { error: "lang must be en or pl" });

      if (method === "GET") {
        const data = await loadContent(kind, lang);
        return void sendJson(res, 200, { data });
      }

      if (method === "PUT") {
        let parsed: unknown;
        try {
          const body = await readRawBody(req, MAX_JSON_BODY);
          parsed = JSON.parse(body.toString("utf8"));
        } catch (err) {
          return void sendJson(res, 400, { error: `Invalid JSON body: ${(err as Error).message}` });
        }
        const { issues } = await saveContent(kind, lang, parsed);
        const hasErrors = issues.some((i) => i.severity === "error");
        return void sendJson(res, hasErrors ? 400 : 200, { ok: !hasErrors, issues });
      }

      res.writeHead(405);
      return void res.end();
    }

    case "/images": {
      if (method === "GET") return void sendJson(res, 200, { images: listImages(), dirs: listDirs() });

      if (method === "PUT") {
        const dir = url.searchParams.get("dir") ?? "";
        const name = url.searchParams.get("name") ?? "";
        const quality = Number(url.searchParams.get("quality") ?? NaN);
        const maxWidth = Number(url.searchParams.get("maxWidth") ?? NaN);
        const formatParam = url.searchParams.get("format");
        const format = formatParam === "webm" || formatParam === "webp" ? (formatParam as "webm" | "webp") : undefined;
        const streamProgress = url.searchParams.get("progress") === "1";
        if (!name) return void sendJson(res, 400, { error: "name is required" });
        const limit = uploadLimitFor(path.extname(name).toLowerCase());
        const declaredLength = Number(req.headers["content-length"] ?? 0);
        if (Number.isFinite(declaredLength) && declaredLength > limit) {
          return void sendJson(res, 413, {
            error: `${name} is ${formatMb(declaredLength)} - the upload limit is ${formatMb(limit)}`,
          });
        }
        try {
          const body = await readRawBody(req, limit);
          const encodeOpts = {
            quality: Number.isFinite(quality) ? quality : undefined,
            maxWidth: Number.isFinite(maxWidth) ? maxWidth : undefined,
            ...(format ? { format } : {}),
          };
          if (streamProgress) {
            res.writeHead(200, {
              "Content-Type": "application/x-ndjson",
              "Cache-Control": "no-store",
            });
            const send = (line: unknown): void => {
              res.write(JSON.stringify(line) + "\n");
            };
            try {
              const result = await saveUpload(dir, name, body, {
                ...encodeOpts,
                onProgress: (event) => send({ file: name, ...event }),
              });
              send({ result });
            } catch (err) {
              send({ error: (err as Error).message });
            }
            res.end();
            return;
          }
          const result = await saveUpload(dir, name, body, encodeOpts);
          return void sendJson(res, 200, result);
        } catch (err) {
          if (err instanceof BodyTooLargeError) {
            return void sendJson(res, 413, {
              error: `${name} is over the upload limit of ${formatMb(err.limit)}`,
            });
          }
          return void sendJson(res, 400, { error: (err as Error).message });
        }
      }

      res.writeHead(405);
      return void res.end();
    }

    case "/dirs": {
      if (method !== "POST") {
        res.writeHead(405);
        return void res.end();
      }
      let parsed: { action?: string; path?: string; newName?: string };
      try {
        const body = await readRawBody(req, MAX_JSON_BODY);
        parsed = JSON.parse(body.toString("utf8"));
      } catch (err) {
        return void sendJson(res, 400, { error: `Invalid JSON body: ${(err as Error).message}` });
      }
      const target = parsed.path ?? "";
      try {
        if (parsed.action === "create") {
          await createDir(target);
          return void sendJson(res, 200, { ok: true });
        }
        if (parsed.action === "rename") {
          if (!parsed.newName) return void sendJson(res, 400, { error: "newName is required" });
          const rewritten = await renameDir(target, parsed.newName);
          return void sendJson(res, 200, { ok: true, rewritten });
        }
        if (parsed.action === "delete") {
          const result = await deleteDir(target);
          if (result.blocked) {
            return void sendJson(res, 409, {
              error: "Folder contains images still referenced by existing content.",
              usages: result.usages,
            });
          }
          return void sendJson(res, 200, { ok: true });
        }
        return void sendJson(res, 400, { error: "action must be create, rename or delete" });
      } catch (err) {
        return void sendJson(res, 400, { error: (err as Error).message });
      }
    }

    case "/image": {
      if (method === "PATCH") {
        const p = url.searchParams.get("path") ?? "";
        const name = url.searchParams.get("name") ?? "";
        try {
          const rewritten = await renameImage(p, name);
          return void sendJson(res, 200, { ok: true, rewritten });
        } catch (err) {
          return void sendJson(res, 400, { error: (err as Error).message });
        }
      }
      if (method !== "DELETE") {
        res.writeHead(405);
        return void res.end();
      }
      const p = url.searchParams.get("path") ?? "";
      try {
        const result = await deleteImage(p);
        if (result.blocked) {
          return void sendJson(res, 409, {
            error: "Image is still referenced by existing content.",
            usages: result.usages,
          });
        }
        return void sendJson(res, 200, { ok: true });
      } catch (err) {
        return void sendJson(res, 400, { error: (err as Error).message });
      }
    }

    case "/image/replace": {
      if (method !== "PUT") {
        res.writeHead(405);
        return void res.end();
      }
      const p = url.searchParams.get("path") ?? "";
      const name = url.searchParams.get("name") ?? "";
      const quality = Number(url.searchParams.get("quality") ?? NaN);
      const maxWidth = Number(url.searchParams.get("maxWidth") ?? NaN);
      const formatParam = url.searchParams.get("format");
      const format = formatParam === "webm" || formatParam === "webp" ? (formatParam as "webm" | "webp") : undefined;
      const streamProgress = url.searchParams.get("progress") === "1";
      if (!name) return void sendJson(res, 400, { error: "name is required" });
      const limit = uploadLimitFor(path.extname(name).toLowerCase());
      const declaredLength = Number(req.headers["content-length"] ?? 0);
      if (Number.isFinite(declaredLength) && declaredLength > limit) {
        return void sendJson(res, 413, {
          error: `${name} is ${formatMb(declaredLength)} - the upload limit is ${formatMb(limit)}`,
        });
      }
      try {
        const body = await readRawBody(req, limit);
        const encodeOpts = {
          quality: Number.isFinite(quality) ? quality : undefined,
          maxWidth: Number.isFinite(maxWidth) ? maxWidth : undefined,
          ...(format ? { format } : {}),
        };
        if (streamProgress) {
          res.writeHead(200, {
            "Content-Type": "application/x-ndjson",
            "Cache-Control": "no-store",
          });
          const send = (line: unknown): void => {
            res.write(JSON.stringify(line) + "\n");
          };
          try {
            const result = await replaceImage(p, name, body, {
              ...encodeOpts,
              onProgress: (event) => send({ file: name, ...event }),
            });
            send({ result });
          } catch (err) {
            send({ error: (err as Error).message });
          }
          res.end();
          return;
        }
        const result = await replaceImage(p, name, body, encodeOpts);
        return void sendJson(res, 200, result);
      } catch (err) {
        if (err instanceof BodyTooLargeError) {
          return void sendJson(res, 413, {
            error: `${name} is over the upload limit of ${formatMb(err.limit)}`,
          });
        }
        return void sendJson(res, 400, { error: (err as Error).message });
      }
    }

    case "/refs": {
      if (method !== "GET") {
        res.writeHead(405);
        return void res.end();
      }
      const paths = (url.searchParams.get("paths") ?? "").split(",").filter((s) => s.length > 0);
      return void sendJson(res, 200, { usages: findRefs(paths) });
    }

    case "/authors": {
      if (method === "GET") {
        const data = await loadAuthors();
        return void sendJson(res, 200, { data });
      }

      if (method === "PUT") {
        let parsed: unknown;
        try {
          const body = await readRawBody(req, MAX_JSON_BODY);
          parsed = JSON.parse(body.toString("utf8"));
        } catch (err) {
          return void sendJson(res, 400, { error: `Invalid JSON body: ${(err as Error).message}` });
        }
        const result = await saveAuthors(parsed);
        if (result.blocked) {
          return void sendJson(res, 409, {
            error: "Author still referenced by existing content - reassign those entries first.",
            usages: result.usages,
          });
        }
        const hasErrors = result.issues.some((i) => i.severity === "error");
        return void sendJson(res, hasErrors ? 400 : 200, {
          ok: !hasErrors,
          issues: result.issues,
          ...(result.data ? { data: result.data } : {}),
        });
      }

      res.writeHead(405);
      return void res.end();
    }

    case "/validate": {
      if (method !== "POST") {
        res.writeHead(405);
        return void res.end();
      }
      let parsed: { kind?: string; lang?: string; data?: unknown };
      try {
        const body = await readRawBody(req, MAX_JSON_BODY);
        parsed = JSON.parse(body.toString("utf8"));
      } catch (err) {
        return void sendJson(res, 400, { error: `Invalid JSON body: ${(err as Error).message}` });
      }
      const kind = parsed.kind ?? null;
      const lang = parsed.lang ?? null;
      if (!isKind(kind)) return void sendJson(res, 400, { error: "kind must be posts or wiki" });
      if (!isLang(lang)) return void sendJson(res, 400, { error: "lang must be en or pl" });
      const issues = await validateContent(kind, lang, parsed.data);
      return void sendJson(res, 200, { issues });
    }

    case "/convert": {
      if (method !== "POST") {
        res.writeHead(405);
        return void res.end();
      }
      const streamProgress = url.searchParams.get("progress") === "1";
      try {
        const body = await readRawBody(req, MAX_CONVERT_BODY);
        const { fields, files } = parseMultipart(body, req.headers["content-type"]);
        if (files.length === 0) return void sendJson(res, 400, { error: "no files in request" });
        const convertOpts = {
          quality: clampQuality(Number(fields.quality) || 80),
          resize: fields.resize === "1",
          maxWidth: clampMaxWidth(Number(fields.maxWidth) || 1600),
        };
        if (streamProgress) {
          res.writeHead(200, {
            "Content-Type": "application/x-ndjson",
            "Cache-Control": "no-store",
          });
          const send = (line: unknown): void => {
            res.write(JSON.stringify(line) + "\n");
          };
          try {
            const result = await convertBatch(files, {
              ...convertOpts,
              onProgress: (event) => send(event),
            });
            if (result.converted.length === 0) {
              send({
                error: `All ${result.errors.length} file(s) failed to convert`,
                details: result.errors,
              });
              res.end();
              return;
            }
            send({ summary: { converted: result.converted.length, errors: result.errors.length } });
            send({ zip: true });
            const zipfile = buildZip(result);
            zipfile.outputStream.on("error", () => res.destroy());
            zipfile.outputStream.pipe(res);
            return;
          } catch (err) {
            send({ error: (err as Error).message });
            res.end();
            return;
          }
        }
        const result = await convertBatch(files, convertOpts);
        if (result.converted.length === 0) {
          return void sendJson(res, 400, {
            error: `All ${result.errors.length} file(s) failed to convert`,
            details: result.errors,
          });
        }
        streamConvertedZip(res, result);
      } catch (err) {
        if (err instanceof BodyTooLargeError) {
          return void sendJson(res, 413, { error: `Batch exceeds the ${formatMb(err.limit)} total size limit` });
        }
        return void sendJson(res, 400, { error: (err as Error).message });
      }
      return;
    }

    case "/asset": {
      if (method !== "GET") {
        res.writeHead(405);
        return void res.end();
      }
      const p = url.searchParams.get("path") ?? "";
      if (!serveAsset(p, res)) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("not found");
      }
      return;
    }

    case "/lqip": {
      if (method !== "POST") {
        res.writeHead(405);
        return void res.end();
      }
      runLqip(res);
      return;
    }

    case "/mods": {
      if (method === "GET") {
        const data = await loadModList();
        return void sendJson(res, 200, { data });
      }

      if (method === "PUT") {
        let parsed: unknown;
        try {
          const body = await readRawBody(req, MAX_JSON_BODY);
          parsed = JSON.parse(body.toString("utf8"));
        } catch (err) {
          return void sendJson(res, 400, { error: `Invalid JSON body: ${(err as Error).message}` });
        }
        const result = await saveModList(parsed);
        const hasErrors = result.issues.some((i) => i.severity === "error");
        return void sendJson(res, hasErrors ? 400 : 200, {
          ok: !hasErrors,
          issues: result.issues,
          ...(result.data ? { data: result.data } : {}),
        });
      }

      res.writeHead(405);
      return void res.end();
    }

    case "/mods/sync": {
      if (method !== "POST") {
        res.writeHead(405);
        return void res.end();
      }
      runSyncMods(res);
      return;
    }

    case "/icons/sync": {
      if (method !== "POST") {
        res.writeHead(405);
        return void res.end();
      }
      runIconsSync(res, { force: url.searchParams.get("force") === "1" });
      return;
    }

    case "/git/status": {
      if (method !== "GET") {
        res.writeHead(405);
        return void res.end();
      }
      const data = await readGitStatus();
      return void sendJson(res, 200, { data });
    }

    case "/git/deploy": {
      if (method !== "POST") {
        res.writeHead(405);
        return void res.end();
      }
      let parsed: { message?: unknown; paths?: unknown };
      try {
        const body = await readRawBody(req, MAX_JSON_BODY);
        parsed = JSON.parse(body.toString("utf8"));
      } catch (err) {
        return void sendJson(res, 400, { error: `Invalid JSON body: ${(err as Error).message}` });
      }
      const message = typeof parsed.message === "string" ? parsed.message.trim() : "";
      if (!message) return void sendJson(res, 400, { error: "commit message is required" });
      const paths = Array.isArray(parsed.paths)
        ? parsed.paths.filter((p): p is string => typeof p === "string" && p.length > 0)
        : [];
      if (paths.length === 0) return void sendJson(res, 400, { error: "select at least one changed file" });
      streamGitDeploy(res, message, paths);
      return;
    }

    case "/git/pull": {
      if (method !== "POST") {
        res.writeHead(405);
        return void res.end();
      }
      streamGitPull(res);
      return;
    }

    default:
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "unknown api route" }));
  }
}

export function cmsApi(): Plugin {
  return {
    name: "cms-api",
    configureServer(server) {
      server.middlewares.use("/api", (req, res) => {
        route(req, res).catch((err) => {
          console.error("[cms-api]", err);
          if (!res.headersSent) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "internal server error" }));
          } else {
            res.end();
          }
        });
      });
    },
  };
}
