# AGENTS.md

## Project

Static blog/wiki SPA for the SMC (Seba Modding Community) Minecraft modpack site.
npm workspaces monorepo: `@web` (React 19 + TypeScript 6 + Vite 8 (Rolldown) + Tailwind 4 + TanStack Router), `@cms` (local-only content editor), `@shared` (`@smc/shared` helpers).
Single hoisted `node_modules` + root `package-lock.json`. Deployed to GitHub Pages under `/smc` via artifacts.

## Workspace layout

- `@web/` - the site (`src/`, `public/`, `vite.config.ts`, `tsconfig.json`, package `@smc/web`; no own `package-lock` - root lockfile only).
- `@cms/` - standalone CMS sub-app (package `@smc/cms`), edits `@web/src/content/…` and `@web/public/assets/…` via API middleware; exports `@smc/cms/server/store` + `@smc/cms/server/util` (used by `@scripts/check-content.mjs`).
- `@shared/` - package `@smc/shared` (hue/icons/months/slug helpers, `.ts` sources exported directly). Import as `@smc/shared/<name>`, never relative paths.
- `@scripts/` - repo-root tooling (`check-content`, `generate-blurhash`, `sync-mods`, `sync-icons`, `screenshot/`). Runs with Node >= 22.7 (native TS stripping for `@smc/cms` imports).
- Root `package.json` (`@smc`, private) is a delegator: `npm run dev`, `web:*`, `cms:*` wrappers; real per-workspace scripts live in each package. Workspace selectors use package names (`npm -w @smc/web …`).

## Commands

- `npm install` / `npm run web:install` / `npm run cms:install` - install all workspaces into the single root `node_modules` (no per-package installs).
- `npm run dev` / `build` / `preview` / `start` - site (delegate to `@smc/web`). `check-content` gate runs inside the build.
- `npm run web:ci` - `npm ci -w @smc/web` + lint + check-content + vite build.
- `npm run cms` - local-only CMS (`@cms/`) at `127.0.0.1:4000`: edits metadata in `@web/src/content/{en,pl}/{posts,wiki}.json` and article bodies as `@web/src/content/{en,pl}/{posts,wiki}/<slug>.md`, plus `authors.json`, via API middleware, converts uploads on the fly into `@web/public/assets/content/<bucket>/` (quality + max-width adjustable per upload; static images stay **webp** via sharp; the upload modal previews each staged file and lets you pick the output per animated item - **gif / animated-webp** default to lightweight **animated webp** (great for short loops) but can be switched to **VP9 `.webm`**, while **video (mp4, mov, webm, mkv, m4v) and apng are always `.webm`**; every animated upload gets a `<name>.static.webp` first-frame poster; video capped at 60s and re-timed to 24fps; size caps: **25 MB images / 128 MB video+apng**, enforced server- and client-side with clean 413 messages) and auto-regenerates blurhashes afterwards. Uploads run up to 3 in parallel, each tracked by its own banner; **all media feedback renders as Banners stacked under the media toolbar (via `useMediaLibrary` state) - never render feedback anywhere else**. The media grid shows static frames (`<name>.static.webp` via `ImageInfo.staticUrl`) and only swaps to the animated webm (via `<video>`) while hovered - never render raw animated URLs in list/grid contexts (performance: dozens of concurrent decoders). The markdown editor has a searchable Insert-icon picker over the full Phosphor set (fuzzy name/tag/category search via `@smc/shared/icon-search`) and both saving and picking auto-run `sync-icons` server-side (SSE into the runner console). The Mods board edits `@scripts/mod-list.json` (drag cards between the 4 category columns, add via Modrinth slug/URL with live search) and can run `sync-mods` from the UI.
- `npm run cms:ffmpeg` - verifies an ffmpeg for CMS video uploads (`SMC_FFMPEG_PATH` env → `.cache/ffmpeg/` → PATH → optional `ffmpeg-static` download); copies the ffmpeg-static binary into `.cache/ffmpeg/` and prints PATH instructions when nothing system-wide exists.
- `npm run lint` - lints `@web`, `@cms`, `@shared` workspaces + root `@scripts/` (oxlint, type-aware). `lint:fix` likewise.
- `npm run generate-lqip` - rescans `@web/public/assets` and regenerates `@web/src/data/blurhash.json` (blurhash placeholders; transparent images skipped) plus `@web/src/data/media.json` (`{ animated: [...], videos: [...] }` - animated webp + VP9 webm lists; blurhash for webm is read from its `.static.webp` poster; warns when an animated asset is missing its `.static.webp` sibling). Runs automatically after CMS uploads.
- `npm run sync-mods` - one-shot mod-icon pipeline: fetches Modrinth metadata + icons for `@scripts/mod-list.json` (single source of truth: `[{ key, slugs[] }]`), caches raw downloads in `.cache/mod-icons/` (gitignored), verifies every icon decodes, reruns failed slugs (`--retries=N`, default 3), warns on permanent problems (project gone / no icon - hue-tinted cube tile baked into the sprite), then regenerates `@web/public/assets/mod-sprites/` (`{key}.webp` + `{key}.placeholder.webp`, 9-col grids) and `@web/src/data/mods.ts` (no per-mod icon files - everything renders from the sprite sheets; `mod-icons/` is removed), and chains blurhash regen (`--no-blurhash` to skip). Exit 1 only if fetches survive retries - CMS-update-flow friendly.
- `npm run sync-icons` - Phosphor icon pipeline: regenerates `@shared/icon-catalog.ts` (full metadata: names/tags/categories from `@phosphor-icons/core`, version-stamped), `@cms/src/components/icon-map.generated.tsx` (ALL icons - local CMS tool, size irrelevant) and `@web/src/components/icon-map.generated.ts` (**only icons referenced by content markdown** - keeps the bundle lean; prunes unused entries automatically). The CMS runs it automatically after every entry save and icon insert (streams into the runner console, source "icons"); use manually after hand-editing content JSON or `.md` files or bumping `@phosphor-icons/*` (bump core + react together). Cross-checks every name against the installed react package's exports. Exit 1 on unknown placeholders in content.
- `npm run analyze` - bundle size visualizer (writes `@web/dist/stats.html`).
- `npm run screenshot` - Playwright cross-browser screenshot suite (`@scripts/screenshot/`). Full-page + fold captures per route × viewport × browser; output in `screenshots/` (gitignored). Flags: `--browsers=`, `--viewports=`, `--only=`, `--no-fold`, `--menu-open` (extra `-menu` variant with the mobile hamburger open on viewports <768px), `--lang=pl`, `--prod`, `--reuse`, `--skip-existing`, `--list`, `--out=`, `--concurrency=`. Spawns its own server on port 3100 with `VITE_SCREENSHOT=true`; `--reuse` verifies an existing server on 3000 really is in screenshot mode before reusing. Dynamic routes (posts/wiki) auto-discovered from `@web/src/content/`. `npm run screenshot:install` - installs Playwright browsers (chromium, firefox, webkit).
- `npm run format` / `format:check` - Prettier over the whole repo (root config).

## Committing

- Never commit without explicit user approval - always ask permission first.
- Commit only after the user confirms the change works and there are no regressions.
- Commits: small, logical, one concern each.

## Architecture / oddities

- **Routing**: file-based TanStack Router. Route files in `@web/src/routes/`, lazy views as `.lazy.tsx` siblings (views load on demand). `@web/src/routeTree.gen.ts` is auto-generated by the vite plugin - commit it, don't edit it (also in .prettierignore/oxlint ignores). After adding/renaming routes, run a build to regenerate; if `tsc` fails on a stale gen file, run `npx vite build` once.
- **Base path `/smc`** everywhere (vite `base` + router `basepath`). Typed links use `to="/post/$slug"` + `params`. `@web/dist/404.html` (emitted by the spaFallback404 plugin in `@web/vite.config.ts`) makes GH Pages deep links work.
- **Tailwind v4 is CSS-first**: theme tokens live in `@web/src/index.css` `@theme` (kebab-case only - `mc-text-muted`, not `mc-textMuted`), custom utilities via `@utility` (e.g. `cover-zoom`). No `tailwind.config` file.
- **i18n is custom, no library**: strings in `@web/src/utils/translations.ts` (`en`/`pl`); `useLanguage` hook from `@web/src/context/useLanguage.ts`. `LanguageProvider` syncs `<html lang>`, `document.title` and the meta description.
- **Images**: route every `<img>` through `SmartImage` (lazy loading + blurhash placeholder from `@web/src/data/blurhash.json`, rendered by `BlurhashCanvas` - no placeholder image files). All CMS content assets live in `@web/public/assets/content/{posts,banners,avatars}` and are the committed source of truth; there is no `originals/` dir. Upload via the CMS (on-the-fly webp conversion); regenerate blurhashes with `npm run generate-lqip`. `@web/public/assets/static` is site-owned chrome (background, tiles, branding `smc.webp`/`smc2.png`) edited directly. Animated assets are listed in `@web/src/data/media.json` - animated webp in `animated`, VP9 `.webm` in `videos`; under `prefers-reduced-motion` they render their `.static.webp` first-frame poster and only play via hover or the play button (`@web/src/components/playbackGate.tsx`). `SmartImage` renders `.webm` assets as a native `<video>` (poster + blurhash behind); webp stay `<img>`.
- **Content CMS**: posts/wiki metadata in `@web/src/content/{en,pl}/{posts,wiki}.json` (imported at build time, JSON inlined into route chunks), article bodies as `@web/src/content/{en,pl}/{posts,wiki}/<slug>.md` (loaded via `import.meta.glob` in route loaders). Synchronous access via `@web/src/data/posts.ts` / `@web/src/data/wiki.ts`. `coverImage`/`avatar` paths in JSON point into `@web/public/assets/content/`. Content edits require a rebuild.
- **Markdown icons**: `:NameIcon:` markers → `<icon>` element via `@smc/shared/markdown` transforms, rendered by per-app wrappers over generated component maps. The web map (`icon-map.generated.ts`) contains exactly the icons referenced by content - never hand-edit it; run `npm run sync-icons`. Valid names come from `@shared/icon-catalog.ts` (generated from `@phosphor-icons/core`, which is version-paired with `@phosphor-icons/react`); `check-content` fails the build on unmapped/stale entries.
- **API**: only `@web/src/services/api.ts` - a typed `fetch` wrapper for Modrinth/Discord stat reads (with a 10s abort timeout). Nothing else.
- **Bundling**: `manualChunks` (react/router/icons) + lazy routes + `preload="intent"` on nav links. Keep it that way - new pages must be lazy route files, never heavy imports into the eager entry.

## Conventions

- **Named React imports only** - never `import React from "react"`, never `React.FC`; plain `const Cmp = ({ ... }: Props) => ...`.
- oxlint flat config at root (`.oxlintrc.json`); `@scripts/` gets node globals via override there.
- **Do NOT bump TypeScript past 6.x** - `typescript-eslint` peer range is `<6.1.0`; TS 7 breaks linting.
- Shared logic goes into `@shared/` (`@smc/shared`) - never duplicate helpers between `@web` and `@cms`.

## Hard constraints

- **No backward compatibility. Ever.** Modern evergreen browsers only - no legacy fallbacks, no polyfills, no old-browser support, no graceful degradation for unsupported features. This is a static blog.
- **Strictly static**: no backend, no SSR, no forms, no cookies, no analytics, no user accounts, no data saved anywhere. `localStorage` is used for **one thing only** (the language preference) - do not add any other persistence.
