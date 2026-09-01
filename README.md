# <a href=https://5e8a.github.io/smc/en>SMC - Seba Modding Community Website</a>

![pages](https://github.com/5e8a/smc/actions/workflows/deploy.yml/badge.svg)

The official blog and documentation hub for the **Fabric Boosted** Minecraft modpack, created by 5E8A.

The website serves as a blog for news, updates, and a wiki for optimization guides, all designed with a modern, Minecraft-inspired aesthetic.

## 🚀 Fabric Boosted Modpack Overview

Fabric Boosted is an ultimate optimization modpack focused on maximizing frame rates and achieving smooth, low-latency gameplay on a wide range of hardware.

### Key Features of the Modpack

- **Fabric Core**: Built on the lightweight Fabric loader, ensuring lightning-fast startup times and high mod compatibility.
- **Sodium Powered**: Replaces the default rendering engine to deliver consistent high FPS (144+ FPS) on modern hardware.
- **Memory Efficient**: Utilizes advanced Garbage Collection (GC) tuning, allowing users to play comfortably with recommended RAM allocations between 4GB and 6GB.

---

## 💻 Technical Details

This project is a modern Single-Page Application (SPA) built with a focus on fast loading and a polished user experience.

### Tech Stack

- **Frontend**: React (v19.x) with TypeScript (v6.x).
- **Build Tool**: Vite (v8.x).
- **Styling**: Tailwind CSS (v4.x) with a custom, high-contrast, Minecraft-themed color palette and custom button styles defined in `@web/src/index.css`, processed at build time via the `@tailwindcss/vite` plugin.
- **Routing**: TanStack Router (file-based, `basepath: "/smc"`) for client-side navigation (e.g., `/archive`, `/post/:slug`, `/wiki`).

### Monorepo

npm workspaces with a single hoisted `node_modules`:

- `@web` (`@smc/web`) - the site: `src/`, `public/`, `vite.config.ts`.
- `@cms` (`@smc/cms`) - local-only content editor at `127.0.0.1:4000`; edits `@web/src/content/…` and `@web/public/assets/…` via API middleware.
- `@shared` (`@smc/shared`) - shared helpers (`icons`, `months`, `slug`), imported as `@smc/shared/<name>`.
- `@scripts/` - repo-root tooling (content validation, blurhash/sprite generation, Playwright screenshot suite).

### Architecture & Data Flow

1.  **Content Management**: The blog posts and wiki documentation are stored locally as JSON files (`@web/src/content/{lang}/{posts,wiki}.json`, plus `authors.json`) and read by client-side utilities (`@web/src/data/posts.ts`, `@web/src/data/wiki.ts`). This acts as a flat-file CMS, edited via the `@cms` app.
2.  **External API Integration**: Dynamic data like total downloads, latest version, and active Discord members are fetched from the Modrinth API and Discord API using a lightweight native `fetch` wrapper in `@web/src/services/api.ts`. The Modrinth Project ID for "Fabric Boosted" is `dOLVvHgi`.
3.  **Internationalization (i18n)**: The site supports multiple languages ("en" and "pl") managed via a React Context (`@web/src/context/LanguageContext.tsx`) and translations defined in `@web/src/utils/translations.ts`. The preferred language is derived from the URL parameter (e.g., `/en/...`, `/pl/...`).
4.  **Content Rendering**: Text content supports rich text features, specifically converting Markdown-style links (`[text](url)`) into styled HTML anchor tags using the `parseRichText` utility.

---

## 🛠️ Getting Started

To set up and run the project locally, you need Node.js installed.

### Prerequisites

- Node.js

### 1. Install Dependencies

Use npm to install all required packages (one lockfile, one `node_modules`):

```bash
npm install          # installs all workspaces
npm run web:install  # same, scoped to the web workspace
```

### 2. Run the Development Server

Start the development server with hot module replacement (HMR) powered by Vite. The server runs on port 3000 by default and uses the base path /smc.

```bash
npm run dev
```

### 3. Build for Production

This runs lint, the content gate, and builds the prerendered site into `@web/.output/public`.

```bash
npm run build
```

The content editor (`@cms`) runs separately:

```bash
npm run cms   # 127.0.0.1:4000
```

### Linting & Formatting

The project uses oxlint (type-aware) across all workspaces plus Prettier for consistent formatting.

```bash
npm run lint       # check for lint errors
npm run lint:fix   # auto-fix lint errors
npm run format     # format all files with Prettier
```

### Local task board

`board.html` at the repo root is a zero-dependency task board (Backlog / In Progress / Done) for tracking small chores, open it directly in a browser. Cards persist in the browser's `localStorage`; use Export/Import JSON for backups. It is a local dev tool: not deployed, not part of the build.

## 🚀 Deployment

The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) for continuous deployment to GitHub Pages:

- Checking out the code and setting up Node.js.
- Installing dependencies (`npm ci`).
- Building the project (`npm run build`).
- Uploading `@web/.output/public` as the artifact.

Since the Vite config sets the base: "/smc", the built application is designed to run correctly under a subdirectory like `yourusername.github.io/smc/`.
