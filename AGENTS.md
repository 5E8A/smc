# AGENTS.md

## Project

Static blog/wiki SPA for the SMC (Seba Modding Community) Minecraft modpack site.
npm workspaces monorepo: `@web` (React 19 + TypeScript 6 + Vite 8 (Rolldown) + Tailwind 4 + TanStack Router), `@cms` (local-only content editor), `@shared` (`@smc/shared` helpers).
Single hoisted `node_modules` + root `package-lock.json`. Deployed to GitHub Pages under `/smc` via artifacts.

## Workspace layout

- `@web/` - the site (`src/`, `public/`, `vite.config.ts`, `tsconfig.json`, package `@smc/web`; no own `package-lock` - root lockfile only).
- `@cms/` - standalone CMS sub-app (package `@smc/cms`), edits `@web/src/content/…` and `@web/public/assets/…` via API middleware; exports `@smc/cms/server/store` + `@smc/cms/server/util` (used by `@scripts/check-content.mjs`). CMS details: `@cms/AGENTS.md` - read it when working on the CMS.
- `@shared/` - package `@smc/shared` (hue/icons/months/slug helpers, `.ts` sources exported directly).
- `@scripts/` - repo-root tooling (`check-content`, `generate-blurhash`, `sync-mods`, `sync-icons`, `screenshot/`). Node >= 22.7 (native TS stripping for `@smc/cms` imports). Pipeline details: `@scripts/AGENTS.md` - read it when working on those scripts.
- Root `package.json` (`@smc`, private) is a delegator: `npm run dev`, `web:*`, `cms:*` wrappers; real per-workspace scripts live in each package. Workspace selectors use package names (`npm -w @smc/web …`).

## Commands

- `npm install` / `npm run web:install` / `npm run cms:install` - install all workspaces into the single root `node_modules` (no per-package installs).
- `npm run dev` / `build` / `preview` / `start` - site (delegate to `@smc/web`). `check-content` gate runs inside the build.
- `npm run web:ci` - `npm ci -w @smc/web` + lint + check-content + vite build.
- `npm run cms` - local-only CMS at `127.0.0.1:4000` (details: `@cms/AGENTS.md`); `cms:ffmpeg` verifies ffmpeg for video uploads.
- `npm run lint` / `lint:fix` - oxlint over all workspaces + `@scripts/`, type-aware; also enforces the Conventions below.
- `npm run generate-lqip` / `sync-mods` / `sync-icons` - content/asset pipelines (details: `@scripts/AGENTS.md`).
- `npm run analyze` - bundle size visualizer (writes `@web/dist/stats.html`).
- `npm run screenshot` - Playwright cross-browser screenshot suite (details: `@scripts/AGENTS.md`).
- `npm run format` / `format:check` - Prettier over the whole repo (root config).

## Committing

- Never commit without explicit user approval - always ask permission first.
- Commit only after the user confirms the change works and there are no regressions.
- Commits: small, logical, one concern each.

## Architecture / oddities

- **Routing**: file-based TanStack Router. Route files in `@web/src/routes/`, lazy views as `.lazy.tsx` siblings. `@web/src/routeTree.gen.ts` is auto-generated - commit it, don't edit it. After adding/renaming routes, run a build to regenerate; if `tsc` fails on a stale gen file, run `npx vite build` once.
- **Base path `/smc`** everywhere (vite `base` + router `basepath`). Typed links use `to="/post/$slug"` + `params`. `@web/dist/404.html` (spaFallback404 plugin in `@web/vite.config.ts`) makes GH Pages deep links work.
- **Tailwind v4 is CSS-first**: theme tokens live in `@web/src/index.css` `@theme` (kebab-case only), custom utilities via `@utility`. No `tailwind.config` file.
- **i18n is custom, no library**: strings in `@web/src/utils/translations.ts` (`en`/`pl`); language comes from the `/:lang` URL param (`@web/src/context/LanguageContext.tsx`), which syncs `<html lang>`, `document.title` and the meta description.
- **Images**: route every `<img>` through `SmartImage` (lazy + blurhash placeholder from `@web/src/data/blurhash.json`, rendered by `BlurhashCanvas` - no placeholder image files). Content assets live in `@web/public/assets/content/{posts,banners,avatars}` (committed source of truth); `assets/static` is site-owned chrome. Animated assets are listed in `@web/src/data/media.json`; under `prefers-reduced-motion` they render their `.static.webp` poster and only play via hover/play button (`playbackGate.tsx`). `SmartImage` renders `.webm` as `<video>`, webp as `<img>`.
- **Content CMS**: metadata in `@web/src/content/{en,pl}/{posts,wiki}.json` (build-time inlined into route chunks), bodies as sibling `<slug>.md` (loaded via `import.meta.glob`; sync access via `@web/src/data/posts.ts` / `wiki.ts`). `coverImage`/`avatar` paths point into `@web/public/assets/content/`. Content edits require a rebuild.
- **Markdown icons**: `:NameIcon:` markers → `<icon>` via `@smc/shared/markdown`; the web map (`icon-map.generated.ts`) contains exactly the icons referenced by content - never hand-edit it, run `npm run sync-icons`. Valid names come from `@shared/icon-catalog.ts`; `check-content` fails the build on unmapped/stale entries.
- **API**: only `@web/src/services/api.ts` (lint-enforced) - typed `fetch` wrapper for Modrinth/Discord stat reads (10s abort timeout). Nothing else.
- **Bundling**: `manualChunks` (react/router/icons) + lazy routes + `preload="intent"` on nav links. New pages must be lazy route files, never heavy imports into the eager entry.

## Conventions (lint-enforced, see `.oxlintrc.json`)

- Named React imports only (`import { useState } from "react"`) - and never `React.FC`; plain `const Cmp = ({ ... }: Props) => ...`. (`React.FC` is not machine-checkable.)
- `@smc/shared` subpath imports only (e.g. `@smc/shared/hue`), never bare or deep.
- `fetch` only inside `@web/src/services/api.ts`.
- No client persistence or cookies in `@web`: no `localStorage`, `window.localStorage`, `document.cookie`.
- jsx-a11y rules on all `.tsx`.
- Shared logic goes into `@shared/` (`@smc/shared`) - never duplicate helpers between `@web` and `@cms` (not machine-checkable).
- **Do NOT bump TypeScript past 6.x** - `typescript-eslint` peer range is `<6.1.0`; TS 7 breaks linting (not machine-checkable).

## Hard constraints

- **No backward compatibility. Ever.** Modern evergreen browsers only - no legacy fallbacks, no polyfills, no old-browser support, no graceful degradation for unsupported features. This is a static blog.
- **Strictly static**: no backend, no SSR, no forms, no cookies, no analytics, no user accounts, no data saved anywhere - zero client-side persistence (lint-enforced).
