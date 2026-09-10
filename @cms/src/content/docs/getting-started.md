# Getting Started

The SMC CMS is a local-only content editor for managing the Seba Modding Community website. It edits content files in place and provides a visual interface for posts, wiki docs, mods, authors, media, and deployment, all without a remote backend.

## Launching the CMS

Run the CMS from the project root:

```bash
npm run cms
```

The server starts at `http://127.0.0.1:4000`. Open this URL in your browser.

### Prerequisites

- **Node.js >= 22.7**, required to run the CMS server
- **ffmpeg** (optional), needed for video uploads. Run `npm run cms:ffmpeg` to verify or set up ffmpeg. Without it, image uploads still work but video files will fail

## Layout

The CMS is organized into three main areas:

| Area          | Description                                                                     |
| ------------- | ------------------------------------------------------------------------------- |
| **Header**    | Tab navigation bar with the SMC logo, tab buttons, and server status indicators |
| **Sidebar**   | Entry list and controls (visible on Posts, Wiki, and Authors tabs)              |
| **Main area** | The active tab's content, editors, boards, browsers, or documentation           |

At the bottom of the screen is the **Runner console**, which shows output from background tasks like icon syncing, mod syncing, and media processing.

## Tabs

The header contains these tabs:

| Tab           | Purpose                                                        |
| ------------- | -------------------------------------------------------------- |
| **Posts**     | Create and edit blog posts (EN/PL)                             |
| **Wiki**      | Create and edit wiki documentation (EN/PL)                     |
| **Mods**      | Manage the mod list board (drag-and-drop between categories)   |
| **Authors**   | Manage author profiles (shared across languages)               |
| **Assets**    | Browse and upload media files (images, video, GIFs)            |
| **Converter** | Batch convert media files to webp/webm                         |
| **Deploy**    | View git status, stage files, commit, and push to GitHub Pages |
| **Preview**   | Live device preview of the site                                |
| **Docs**      | This documentation                                             |

## Posts vs Wiki

The two content tabs serve different purposes:

- **Posts** are short announcements, such as release notes, goals, milestones and similar news. The three most recent posts are featured on the @web home page.
- **Wiki** pages are long-form reference content, such as in-depth guides and tutorials. On @web, wiki pages render a full table of contents (`WikiTOC`) in a right-hand sidebar (with a drawer on mobile).

|                     | Posts                     | Wiki                      |
| ------------------- | ------------------------- | ------------------------- |
| **Categories**      | Blog post categories      | Wiki categories           |
| **URL pattern**     | `/smc/{lang}/post/{slug}` | `/smc/{lang}/wiki/{slug}` |
| **JSON store**      | `posts.json`              | `wiki.json`               |
| **Markdown folder** | `posts/{slug}.md`         | `wiki/{slug}.md`          |

## Basic Workflow

The typical content workflow is:

1. **Edit**, Select a tab (Posts or Wiki), pick a language (EN/PL), choose an entry from the sidebar or create a new one
2. **Save**, Press `Ctrl+S` or click the save button. The CMS auto-syncs icons after saving posts/wiki
3. **Check preview**, Switch to the Preview tab (or open the site at `http://127.0.0.1:3000` if the dev server is running) to verify your changes look correct
4. **Deploy**, Switch to the Deploy tab, review changed files, write a commit message, and click Deploy to push to GitHub Pages

## Server Status Indicators

In the header, two small dots indicate server health:

- **Green dot**, CMS server is reachable
- **Second dot (when lit)**, Vite dev server is running on port 3000

If the CMS becomes unreachable, an offline banner will appear at the top of the page with a retry button.

## Keyboard Shortcuts

| Shortcut | Action                    |
| -------- | ------------------------- |
| `Ctrl+B` | Toggle sidebar visibility |
| `Ctrl+S` | Save current changes      |

Tabs with unsaved changes show amber-colored text in the header as a dirty indicator.
