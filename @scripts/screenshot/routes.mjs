import fs from "fs";
import path from "path";
import { root } from "./config.mjs";

export const STATIC_ROUTES = ["/", "/archive", "/wiki", "/about", "/credits"];

const readContent = (lang, kind) => {
  const file = path.join(root, "src", "content", lang, `${kind}.json`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
};

export const getDynamicRoutes = (lang) => {
  const posts = readContent(lang, "posts");
  const wiki = readContent(lang, "wiki");
  return [
    ...posts.map((post) => `/post/${encodeURIComponent(post.slug)}`),
    ...wiki.map((doc) => `/wiki/${encodeURIComponent(doc.slug)}`),
  ];
};

export const getAllRoutes = (lang) => [...STATIC_ROUTES, ...getDynamicRoutes(lang)];

export const routeToFilename = (route) => {
  const clean = decodeURIComponent(route)
    .replace(/^\//, "")
    .replace(/\//g, "-")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return clean || "index";
};
