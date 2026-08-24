// Build-time content gate: runs the exact same validation the CMS enforces
// (cms/server/store.ts) over src/content, so bad data fails the build instead
// of crashing the deployed SPA (an unknown author id throws at module init).
import path from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

let store;
try {
  store = await import("../cms/server/store.ts");
} catch (err) {
  console.error("check-content: could not load cms/server/store.ts");
  console.error("(requires Node >= 22.7 for built-in TypeScript stripping)");
  throw err;
}
const { validateContent } = store;
const { KINDS, LANGS } = await import("../cms/server/util.ts");

let errors = 0;
let warnings = 0;
const fail = (label, issues) => {
  for (const issue of issues) {
    if (issue.severity === "error") errors += 1;
    else warnings += 1;
    const line = `[${label}] [${issue.entry >= 0 ? issue.entry : "—"}] ${issue.field}: ${issue.message}`;
    if (issue.severity === "error") console.error(`error   ${line}`);
    else console.warn(`warn    ${line}`);
  }
};

for (const kind of KINDS) {
  for (const lang of LANGS) {
    const label = `${lang}/${kind}`;
    let data;
    try {
      data = JSON.parse(readFileSync(path.join(root, "src", "content", lang, `${kind}.json`), "utf8"));
    } catch (err) {
      console.error(`error   ${label}: cannot parse JSON — ${err.message}`);
      errors += 1;
      continue;
    }
    fail(label, await validateContent(kind, lang, data));
  }
}

try {
  const authors = JSON.parse(readFileSync(path.join(root, "src", "content", "authors.json"), "utf8"));
  if (!Array.isArray(authors)) throw new Error("authors.json root must be an array");
  const seen = new Map();
  authors.forEach((a, i) => {
    const id = a?.id;
    if (typeof id !== "string" || !id.trim()) {
      console.error(`error   authors [${i}]: missing or empty id`);
      errors += 1;
      return;
    }
    if (seen.has(id)) {
      console.error(`error   authors [${i}]: duplicate id "${id}" (also on entry ${seen.get(id)})`);
      errors += 1;
      return;
    }
    seen.set(id, i);
    for (const field of ["name", "bio"]) {
      const loc = a?.[field];
      for (const lang of LANGS) {
        if (typeof loc?.[lang] !== "string") {
          console.error(`error   authors [${i}] (${id}): ${field}.${lang} must be a string`);
          errors += 1;
        }
      }
    }
    if (typeof a?.avatar !== "string") {
      console.error(`error   authors [${i}] (${id}): avatar must be a string`);
      errors += 1;
    }
  });
} catch (err) {
  if (err instanceof SyntaxError || err.message.includes("root")) {
    console.error(`error   authors: ${err.message}`);
    errors += 1;
  } else {
    throw err;
  }
}

console.log(
  errors === 0 && warnings === 0
    ? `check-content: ok (${KINDS.length * LANGS.length} files + authors)`
    : `check-content: ${errors} error(s), ${warnings} warning(s)`
);
process.exit(errors === 0 ? 0 : 1);
