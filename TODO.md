# TODO — Bake site content into the build (stop runtime JSON fetching)

**Status:** Ready to implement. Researched by prior session; all questions answered.

## Context

The site (static SPA, GH Pages under `/smc`) currently fetches blog/wiki content at runtime via `fetch()` from `public/content/{en,pl}/{posts,wiki}.json` (4 files, 4.5–15KB each). This causes loading spinners, fetch races, and dead time. Content should instead be baked into the JS bundle at build time.

## Key finding

**No plugin needed.** Vite natively inlines JSON via `import x from "./x.json"`. Do not add a vite plugin or dependency.

## Implementation plan (in order)

1. **Move content out of `public/`**: `git mv public/content src/content` — importing from `public/` is discouraged (file gets duplicated into `dist/`). Image paths inside the JSON (`/smc/assets/...`) are absolute and unaffected.

2. **`tsconfig.json`**: add `"resolveJsonModule": true` — not enabled by default with `module: "ESNext"`.

3. **`src/data/posts.ts` + `src/data/wiki.ts`** — rewrite to synchronous modules:
   - `import enPosts from "../content/en/posts.json"` (both languages), type-assert with `as BlogPost[]` / `as WikiDoc[]` (JSON imports are untyped).
   - Pre-sort posts once at module scope (reuse existing `parseDate` logic — do NOT mutate the imported array).
   - Export `getPosts(language)`, `getRecentPosts(language, limit)`, `getPostBySlug(slug, language)`, `getWikiDocs(language)`, `getWikiDocBySlug(slug, language)`.

4. **Update the 5 consumers** — remove `useState`/`useEffect`/`SpinnerIcon` loading branches, read data synchronously:
   - `HomeView.tsx` (`fetchRecentPosts` → `getRecentPosts`)
   - `ArchiveView.tsx` (`fetchPosts` → `getPosts`)
   - `ArticleView.tsx` (`fetchPostBySlug` → `getPostBySlug`) — **keep the `<Navigate to="/" replace />` fallback** for unknown slugs
   - `WikiView.tsx` (`fetchWikiDocs` → `getWikiDocs`)
   - `WikiDocView.tsx` (`fetchWikiDocBySlug` → `getWikiDocBySlug`) — keep its `<Navigate to="/wiki" replace />` fallback
   - No `fetch()` calls may remain in the data layer.

5. **`AGENTS.md`**: update the "Content CMS" bullet — replace "client-fetched JSON" with: content lives in `src/content/{en,pl}/{posts,wiki}.json`, imported at build time, synchronous access via `src/data/posts.ts` / `src/data/wiki.ts`.

6. **Verify**:
   - `npm run lint`
   - `npm run build` (if `tsc` fails on stale `src/routeTree.gen.ts`, run `npx vite build` once first)
   - Confirm the JSON ends up in **lazy route chunks, not the eager entry** (AGENTS.md bundling rule) — `npm run analyze` writes `dist/stats.html`.

## Gotchas / constraints

- **Do NOT commit without explicit user approval** (AGENTS.md). Keep commits small: e.g. `refactor(content): bake posts and wiki json into build`.
- **Dirty working tree**: the 5 view files (plus `HomeView`, `index.css`, etc.) contain uncommitted WIP from earlier sessions. Commit the WIP first (with user sign-off) or apply carefully on top — do not sweep unrelated changes into the content-refactor commit.
- Content edits now require a rebuild before deploy — acceptable; deploys to GH Pages were always rebuilds.
- Size impact: ~39KB raw (~10KB gzip) total, spread across route chunks. Negligible.
- Loading spinners get deleted everywhere — confirmed OK with user.

# TODO 2: optimize css

# TODO 3: maybe optimize react by using preact with patches?
