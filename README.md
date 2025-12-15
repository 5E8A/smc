# <a href=https://5e8a.github.io/smc/#>SMC - Seba Modding Community Website</a>

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

- **Frontend**: React (v19.x) with TypeScript (~5.8.2).
- **Build Tool**: Vite (v6.x).
- **Styling**: Tailwind CSS (v4.x) with a custom, high-contrast, Minecraft-themed color palette and custom button styles defined in `index.html`.
- **Routing**: `react-router-dom` (v7.x) using `HashRouter` for client-side navigation (e.g., `/archive`, `/post/:slug`, `/wiki`).

### Architecture & Data Flow

1.  **Content Management**: The blog posts and wiki documentation are stored locally as JSON files (`/public/content/{lang}/posts.json`, etc.) and fetched by client-side utilities (`data/posts.ts`, `data/wiki.ts`). This acts as a flat-file CMS.
2.  **External API Integration**: Dynamic data like total downloads, latest version, and active Discord members are fetched from the Modrinth API and Discord API using `axios` in `services/api.ts`. The Modrinth Project ID for "Fabric Boosted" is `dOLVvHgi`.
3.  **Internationalization (i18n)**: The site supports multiple languages ("en" and "pl") managed via a React Context (`LanguageContext.tsx`) and translations defined in `utils/translations.ts`. The preferred language is persisted using `localStorage`.
4.  **Content Rendering**: Text content supports rich text features, specifically converting Markdown-style links (`[text](url)`) into styled HTML anchor tags using the `parseRichText` utility.

---

## 🛠️ Getting Started

To set up and run the project locally, you need Node.js installed.

### Prerequisites

- Node.js

### 1. Install Dependencies

Use npm to install all required packages:

```bash
npm install
```

### 2. Run the Development Server

Start the development server with hot module replacement (HMR) powered by Vite. The server runs on port 3000 by default and uses the base path /smc.

```bash
npm run dev
```

### 3. Build for Production

This script first runs the TypeScript compiler for type checking (tsc) and then builds the production-ready static files into the ./dist directory.

```bash
npm run build
```

## 🚀 Deployment

### The project includes a GitHub Actions workflow (.github/workflows/deploy.yml) for continuous deployment to GitHub Pages.

- The deployment process involves:

- Checking out the code and setting up Node.js.

- Installing dependencies (npm ci).

- Building the project (npm run build).

- Uploading the generated ./dist folder as an artifact.

- Deploying the artifact to GitHub Pages.

- Since the Vite config sets the base: "/smc", the built application is designed to run correctly under a subdirectory like yourusername.github.io/smc/.
