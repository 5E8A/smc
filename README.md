# <a href=https://5e8a.github.io/smc/en>SMC - Seba Modding Community Website</a>

![pages](https://github.com/5e8a/smc/actions/workflows/deploy.yml/badge.svg)

The official blog and wiki for **Fabric Boosted**, an optimization-focused Minecraft modpack by 5E8A. Statically prerendered and deployed to GitHub Pages under `/smc`, in English and Polish.

## 🚀 Tech Stack

- **React 19** + **TypeScript 6**
- **Vite 8** with **TanStack Start** (prerendered SSG) + **Nitro**
- **TanStack Router** (file-based, `basepath: "/smc"`)
- **Tailwind CSS 4** (CSS-first, theme in `@web/src/index.css`)
- npm workspaces with a single hoisted `node_modules`

## 💻 Monorepo

- `@web` (`@smc/web`) - the site
- `@cms` (`@smc/cms`) - local-only content editor, runs at `127.0.0.1:4000`
- `@shared` (`@smc/shared`) - shared helpers, imported as `@smc/shared/<name>`
- `@scripts/` - repo-root tooling (content validation, blurhash/icon sync)

### How It Works

- **Content**: flat-file CMS - metadata in `@web/src/content/{en,pl}/{posts,wiki}.json`, bodies as sibling `<slug>.md` files. Edited via the `@cms` app; content edits require a rebuild.
- **Live stats**: Modrinth/Discord data fetched through the typed wrapper in `@web/src/services/api.ts`.
- **i18n**: language comes from the `/:lang` URL param (`/en/...`, `/pl/...`), managed by `@web/src/context/LanguageContext.tsx`.
- **Pipelines**: `npm run check-content` validates content on build; `npm run sync-icons` regenerates the icon map from content.

## 🛠️ Getting Started

Requires Node.js. Install all workspaces (one lockfile, one `node_modules`):

```bash
npm install
```

Development server (port 3000, base path `/smc`):

```bash
npm run dev
```

Content editor (local only):

```bash
npm run cms   # 127.0.0.1:4000
```

Production build (lint + content gate + build → `@web/.output/public`):

```bash
npm run build
```

Serve the built site with the node server:

```bash
npm run start
```

### Lint & Format

```bash
npm run lint       # oxlint across all workspaces
npm run lint:fix   # auto-fix lint errors
npm run format     # Prettier over the whole repo
```

## 🚀 Deployment

GitHub Actions (`.github/workflows/deploy.yml`) deploys on push to `main`: install → lint → content check → build → upload `@web/.output/public` to GitHub Pages. The base path is set to `/smc`, so the site runs under a subdirectory.
