import {
  readJson,
  writeJsonAtomic,
  CONTENT_DIR,
  contentPath,
  assetExists,
  KINDS,
  LANGS,
  type Kind,
  type Lang,
} from "./util.ts";
import path from "path";

export interface LocalizedText {
  en: string;
  pl: string;
}

export interface Author {
  id: string;
  avatar: string;
  name: LocalizedText;
  bio: LocalizedText;
}

const AUTHORS_PATH = path.join(CONTENT_DIR, "authors.json");

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  author: { name: string; avatar: string; bio: string };
  date: string;
  category: string;
  coverImage: string;
  summary: string;
  content: string;
}

export interface WikiDoc {
  id: string;
  slug: string;
  title: string;
  author: { name: string; avatar: string; bio: string };
  date: string;
  category: string;
  coverImage: string;
  summary: string;
  content: string;
}

export interface Issue {
  entry: number;
  field: string;
  message: string;
  severity: "error" | "warning";
}

export const EN_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const PL_MONTHS = ["Sty", "Lut", "Mar", "Kwi", "Maj", "Cze", "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru"];

const KNOWN_ICONS = [
  "ArrowsClockwiseIcon",
  "CpuIcon",
  "DeviceMobileIcon",
  "DownloadIcon",
  "FolderIcon",
  "GearIcon",
  "GlobeIcon",
  "HouseIcon",
  "ImageIcon",
  "KeyboardIcon",
  "NoteIcon",
  "PushPinIcon",
  "RocketIcon",
  "ScissorsIcon",
  "SparkleIcon",
  "StarIcon",
  "TelevisionIcon",
  "UsersIcon",
  "WarningIcon",
  "WrenchIcon",
];

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

const CAROUSEL_BLOCK = /:carouselStart:\s*\n([\s\S]*?)\n?\s*:carouselEnd:/gi;
const CAROUSEL_IMAGE_LINE = /^!\[[^\]]*\]\([^)\s]+\)$/;

function validateAuthorReference(index: number, value: unknown, knownAuthorIds: Set<string>, issues: Issue[]): void {
  if (!asString(value) || !value.trim()) {
    issues.push({
      entry: index,
      field: "author",
      message: "author must reference an author id from the registry",
      severity: "error",
    });
    return;
  }
  if (!knownAuthorIds.has(value)) {
    issues.push({
      entry: index,
      field: "author",
      message: `Unknown author id "${value}" — pick an author in the Authors tab`,
      severity: "error",
    });
  }
}

function validateAuthorFields(index: number, a: Record<string, unknown>, issues: Issue[]): void {
  checkAsset(index, "avatar", a.avatar, issues);
  for (const field of ["name", "bio"] as const) {
    const t = a[field];
    if (typeof t !== "object" || t === null) {
      issues.push({
        entry: index,
        field,
        message: `${field} must be an object with en and pl strings`,
        severity: "error",
      });
      continue;
    }
    const loc = t as Record<string, unknown>;
    for (const lang of ["en", "pl"] as const) {
      const v = loc[lang];
      if (!asString(v)) {
        issues.push({
          entry: index,
          field: `${field}.${lang}`,
          message: `${field}.${lang} must be a string`,
          severity: "error",
        });
      } else if (field === "name" && !v.trim()) {
        issues.push({ entry: index, field: `name.${lang}`, message: "Author name cannot be empty", severity: "error" });
      }
    }
  }
}

export function loadAuthors(): Promise<unknown> {
  return readJson(AUTHORS_PATH);
}

async function loadKnownAuthorIds(): Promise<Set<string>> {
  try {
    const data = await readJson(AUTHORS_PATH);
    if (!asArray(data)) return new Set();
    const ids = data.map((a) => (a as Author)?.id).filter((id): id is string => asString(id));
    return new Set(ids);
  } catch {
    return new Set();
  }
}

const generateAuthorId = (): string => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < 9; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `a-${s}`;
};

async function findAuthorUsages(ids: string[]): Promise<Record<string, string[]>> {
  const usages: Record<string, string[]> = {};
  for (const lang of LANGS) {
    for (const kind of KINDS) {
      try {
        const arr = await readJson(contentPath(kind, lang));
        if (!asArray(arr)) continue;
        arr.forEach((e, i) => {
          const id = (e as Record<string, unknown>)?.author;
          if (asString(id) && ids.includes(id)) {
            (usages[id] ??= []).push(`${lang}/${kind}[${i}]`);
          }
        });
      } catch {
        continue;
      }
    }
  }
  return usages;
}

export interface AuthorsSaveResult {
  issues: Issue[];
  blocked?: boolean;
  usages?: Record<string, string[]>;
  data?: Author[];
}

export async function saveAuthors(data: unknown): Promise<AuthorsSaveResult> {
  if (!asArray(data)) {
    return { issues: [{ entry: -1, field: "$", message: "Root must be an array", severity: "error" }] };
  }

  let currentIds: string[] = [];
  try {
    const current = await readJson(AUTHORS_PATH);
    if (asArray(current)) {
      currentIds = current.map((a) => (a as Author)?.id).filter((id): id is string => asString(id));
    }
  } catch {
    currentIds = [];
  }

  const items: Author[] = data.map((raw) => ({
    ...((typeof raw === "object" && raw !== null ? raw : {}) as Author),
  }));
  items.forEach((item) => {
    if (!asString(item.id) || !item.id.trim()) item.id = generateAuthorId();
  });

  const issues: Issue[] = [];
  const ids = new Map<string, number>();
  items.forEach((a, i) => {
    const prev = ids.get(a.id);
    if (prev !== undefined) {
      issues.push({
        entry: i,
        field: "id",
        message: `Duplicate author id "${a.id}" (also on entry ${prev})`,
        severity: "error",
      });
    } else {
      ids.set(a.id, i);
    }
    validateAuthorFields(i, a as unknown as Record<string, unknown>, issues);
  });

  if (issues.some((i) => i.severity === "error")) {
    return { issues };
  }

  const incomingIds = new Set(items.map((a) => a.id));
  const removed = currentIds.filter((id) => !incomingIds.has(id));
  if (removed.length > 0) {
    const usages = await findAuthorUsages(removed);
    if (Object.keys(usages).length > 0) {
      return { issues: [], blocked: true, usages };
    }
  }

  await writeJsonAtomic(AUTHORS_PATH, items);
  return { issues, data: items };
}

function validateMarkdownContent(index: number, content: unknown, issues: Issue[]): void {
  if (!asString(content) || !content.trim()) {
    issues.push({ entry: index, field: "content", message: "content (markdown) is required", severity: "error" });
    return;
  }

  const unknownIcons = new Set<string>();
  const iconRegex = /:([A-Z][A-Za-z]+Icon):/g;
  let m: RegExpExecArray | null;
  while ((m = iconRegex.exec(content)) !== null) {
    if (!KNOWN_ICONS.includes(m[1])) unknownIcons.add(m[1]);
  }
  if (unknownIcons.size > 0) {
    issues.push({
      entry: index,
      field: "content",
      message: `Unknown icon placeholders (not rendered by the site): ${[...unknownIcons].join(", ")}`,
      severity: "warning",
    });
  }

  const starts = (content.match(/:carouselStart:/gi) ?? []).length;
  const ends = (content.match(/:carouselEnd:/gi) ?? []).length;
  if (starts !== ends) {
    issues.push({
      entry: index,
      field: "content",
      message: "Unbalanced :carouselStart: / :carouselEnd: markers",
      severity: "error",
    });
    return;
  }
  if (starts > 0) {
    CAROUSEL_BLOCK.lastIndex = 0;
    let block: RegExpExecArray | null;
    while ((block = CAROUSEL_BLOCK.exec(content)) !== null) {
      const inner = block[1];
      const images = [...inner.matchAll(/!\[([^\]]*)\]\(([^)\s]+)\)/g)];
      if (images.length === 0) {
        issues.push({
          entry: index,
          field: "content",
          message: "Carousel block contains no images",
          severity: "error",
        });
      }
      const junkLines = inner
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && !CAROUSEL_IMAGE_LINE.test(l));
      if (junkLines.length > 0) {
        issues.push({
          entry: index,
          field: "content",
          message: `Carousel blocks may only contain image lines (![alt](src)); ignoring: ${junkLines[0].slice(0, 40)}`,
          severity: "warning",
        });
      }
    }
    const leftover = content.replace(CAROUSEL_BLOCK, "");
    if (/:carousel(Start|End):/i.test(leftover)) {
      issues.push({
        entry: index,
        field: "content",
        message: "Stray carousel marker outside a start/end pair",
        severity: "error",
      });
    }
  }

  validateMarkdownStructure(index, content, issues);
}

function validateMarkdownStructure(index: number, content: string, issues: Issue[]): void {
  const lines = content.split("\n");
  let prevDepth = 0;
  for (let i = 0; i < lines.length; i++) {
    const h = /^(#{1,6})(\s+.*)?$/.exec(lines[i].trim());
    if (!h) continue;
    const depth = h[1].length;
    if (!h[2] || !h[2].trim()) {
      issues.push({
        entry: index,
        field: `content (line ${i + 1})`,
        message: `Empty heading ("${h[1]}") — add text or remove the line`,
        severity: "error",
      });
      continue;
    }
    if (prevDepth > 0 && depth > prevDepth + 1) {
      issues.push({
        entry: index,
        field: `content (line ${i + 1})`,
        message: `Heading level jumps from H${prevDepth} to H${depth} (missing H${prevDepth + 1})`,
        severity: "warning",
      });
    }
    prevDepth = depth;
  }

  for (const img of content.matchAll(/!\[([^\]]*)\]\(([^)\s]+)\)/g)) {
    if (!assetExists(img[2])) {
      issues.push({
        entry: index,
        field: "content",
        message: `Image not found under public/assets: ${img[2]}`,
        severity: "error",
      });
    }
  }

  const allowedTags = new Set(["icon", "carousel"]);
  const rawTags = new Set<string>();
  for (const tag of content.matchAll(/<\/?([a-zA-Z][a-zA-Z0-9-]*)(?=[\s/>])/g)) {
    if (!allowedTags.has(tag[1].toLowerCase())) rawTags.add(tag[1]);
  }
  if (rawTags.size > 0) {
    issues.push({
      entry: index,
      field: "content",
      message: `Raw HTML tags are passed through unstyled/unsafe by the renderer: ${[...rawTags].join(", ")}`,
      severity: "warning",
    });
  }
}

const isValidIsoDate = (s: string): boolean => {
  const m = ISO_DATE.exec(s);
  if (!m) return false;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.getUTCFullYear() === Number(m[1]) && d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3]);
};

const monthsFor = (lang: Lang): string[] => (lang === "pl" ? PL_MONTHS : EN_MONTHS);

const isValidPostDate = (s: string, lang: Lang): boolean => {
  const m = /^(\d{1,2}) ([A-Za-z]+) (\d{4})$/.exec(s);
  if (!m) return false;
  const monthIndex = monthsFor(lang).findIndex((mo) => mo.toLowerCase() === m[2].toLowerCase());
  if (monthIndex < 0) return false;
  const day = Number(m[1]);
  return day >= 1 && day <= 31 && Number(m[3]) >= 1900;
};

const asString = (v: unknown): v is string => typeof v === "string";
const asArray = (v: unknown): v is unknown[] => Array.isArray(v);

function validateCommonFields(entry: Record<string, unknown>, index: number, issues: Issue[]): void {
  const slug = entry.slug;
  if (!asString(slug) || !slug.trim()) {
    issues.push({ entry: index, field: "slug", message: "Slug is required", severity: "error" });
  }
  if (!asString(entry.title) || !entry.title.trim()) {
    issues.push({ entry: index, field: "title", message: "Title is required", severity: "error" });
  }
  if (!asString(entry.category) || !entry.category.trim()) {
    issues.push({ entry: index, field: "category", message: "Category is required", severity: "error" });
  }
  if (!asString(entry.summary)) {
    issues.push({ entry: index, field: "summary", message: "Summary must be a string", severity: "error" });
  }
}

function checkAsset(
  index: number,
  field: string,
  value: unknown,
  issues: Issue[],
  severity: Issue["severity"] = "error"
): void {
  if (!asString(value)) {
    issues.push({ entry: index, field, message: `${field} must be a string path`, severity });
    return;
  }
  if (!value) return;
  if (!assetExists(value)) {
    issues.push({ entry: index, field, message: `Asset not found under public/assets: ${value}`, severity });
  }
}

export function loadContent(kind: Kind, lang: Lang): Promise<unknown> {
  return readJson(contentPath(kind, lang));
}

export async function saveContent(kind: Kind, lang: Lang, data: unknown): Promise<{ issues: Issue[] }> {
  const issues = await validateContent(kind, lang, data);
  const hasErrors = issues.some((i) => i.severity === "error");
  if (!hasErrors) {
    await writeJsonAtomic(contentPath(kind, lang), data);
  }
  return { issues };
}

export async function validateContent(kind: Kind, lang: Lang, data: unknown): Promise<Issue[]> {
  const knownAuthorIds = await loadKnownAuthorIds();
  const issues: Issue[] = [];
  if (!asArray(data)) {
    issues.push({ entry: -1, field: "$", message: "Root must be an array", severity: "error" });
    return issues;
  }
  if (kind === "posts") validatePosts(data, lang, knownAuthorIds, issues);
  else validateWiki(data, lang, knownAuthorIds, issues);

  const otherLang: Lang = lang === "en" ? "pl" : "en";
  let otherSlugs: Set<string> | null = null;
  try {
    const otherData = await readJson(contentPath(kind, otherLang));
    otherSlugs = asArray(otherData)
      ? new Set(otherData.map((e) => (e as Record<string, unknown>)?.slug).filter((s): s is string => asString(s)))
      : null;
  } catch {
    otherSlugs = null;
  }
  if (otherSlugs) {
    data.forEach((raw, i) => {
      const slug = (raw as Record<string, unknown>)?.slug;
      if (asString(slug) && slug.trim() && !otherSlugs!.has(slug)) {
        issues.push({
          entry: i,
          field: "slug",
          message: `No ${otherLang} counterpart with slug "${slug}" — this entry will be invisible in ${otherLang.toUpperCase()}`,
          severity: "warning",
        });
      }
    });
  }
  return issues;
}

function validatePosts(data: unknown[], lang: Lang, knownAuthorIds: Set<string>, issues: Issue[]): void {
  const slugs = new Map<string, number>();
  const ids = new Map<string, number>();

  data.forEach((raw, i) => {
    if (typeof raw !== "object" || raw === null) {
      issues.push({ entry: i, field: "$", message: "Entry must be an object", severity: "error" });
      return;
    }
    const entry = raw as Record<string, unknown>;
    validateCommonFields(entry, i, issues);

    if (asString(entry.id)) {
      if (!/^\d+$/.test(entry.id)) {
        issues.push({ entry: i, field: "id", message: "Post id must be numeric", severity: "error" });
      }
      const prev = ids.get(entry.id);
      if (prev !== undefined) {
        issues.push({
          entry: i,
          field: "id",
          message: `Duplicate id "${entry.id}" (also on entry ${prev})`,
          severity: "error",
        });
      } else {
        ids.set(entry.id, i);
      }
    } else {
      issues.push({ entry: i, field: "id", message: "id must be a string", severity: "error" });
    }

    if (asString(entry.slug) && entry.slug.trim()) {
      const key = entry.slug.trim().toLowerCase();
      const prev = slugs.get(key);
      if (prev !== undefined) {
        issues.push({
          entry: i,
          field: "slug",
          message: `Duplicate slug "${entry.slug}" (also on entry ${prev})`,
          severity: "error",
        });
      } else {
        slugs.set(key, i);
      }
    }

    if (!asString(entry.date) || !isValidPostDate(entry.date, lang)) {
      issues.push({
        entry: i,
        field: "date",
        message: `Date must match the site's ${lang === "pl" ? "Polish" : "English"} format, e.g. ${lang === "pl" ? "16 Gru 2025" : "16 Dec 2025"}`,
        severity: "error",
      });
    }

    validateAuthorReference(i, entry.author, knownAuthorIds, issues);

    checkAsset(i, "coverImage", entry.coverImage, issues);

    validateMarkdownContent(i, entry.content, issues);
  });
}

function validateWiki(data: unknown[], lang: Lang, knownAuthorIds: Set<string>, issues: Issue[]): void {
  const slugs = new Map<string, number>();
  const ids = new Map<string, number>();

  data.forEach((raw, i) => {
    if (typeof raw !== "object" || raw === null) {
      issues.push({ entry: i, field: "$", message: "Entry must be an object", severity: "error" });
      return;
    }
    const entry = raw as Record<string, unknown>;
    validateCommonFields(entry, i, issues);

    if (asString(entry.id)) {
      if (!new RegExp(`^wiki-${lang}-\\d+$`).test(entry.id)) {
        issues.push({ entry: i, field: "id", message: `Wiki id must match wiki-${lang}-<n>`, severity: "error" });
      }
      const prev = ids.get(entry.id);
      if (prev !== undefined) {
        issues.push({
          entry: i,
          field: "id",
          message: `Duplicate id "${entry.id}" (also on entry ${prev})`,
          severity: "error",
        });
      } else {
        ids.set(entry.id, i);
      }
    } else {
      issues.push({ entry: i, field: "id", message: "id must be a string", severity: "error" });
    }

    if (asString(entry.slug) && entry.slug.trim()) {
      const key = entry.slug.trim().toLowerCase();
      const prev = slugs.get(key);
      if (prev !== undefined) {
        issues.push({
          entry: i,
          field: "slug",
          message: `Duplicate slug "${entry.slug}" (also on entry ${prev})`,
          severity: "error",
        });
      } else {
        slugs.set(key, i);
      }
    }

    validateAuthorReference(i, entry.author, knownAuthorIds, issues);

    if (!asString(entry.date) || !isValidIsoDate(entry.date)) {
      issues.push({ entry: i, field: "date", message: "Date must be ISO format, e.g. 2025-12-16", severity: "error" });
    }

    checkAsset(i, "coverImage", entry.coverImage, issues);

    validateMarkdownContent(i, entry.content, issues);
  });
}
