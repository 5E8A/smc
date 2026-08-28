# @cms - local-only content editor

Details for `npm run cms` (runs at `127.0.0.1:4000`; edits `@web` content in place).

## What it edits

- Metadata: `@web/src/content/{en,pl}/{posts,wiki}.json`, plus `authors.json`, via API middleware.
- Article bodies: `@web/src/content/{en,pl}/{posts,wiki}/<slug>.md`.
- Uploads convert on the fly into `@web/public/assets/content/<bucket>/` and flag blurhash as stale — the operator then triggers **Regenerate blurhash** from the media toolbar (streams into the runner console).

## Upload conversion

- Static images stay **webp** via sharp (quality + max-width adjustable per upload).
- **gif / animated-webp** default to lightweight **animated webp** (great for short loops) but can be switched to **VP9 `.webm`** - the upload modal previews each staged file and lets you pick the output per animated item.
- **video (mp4, mov, webm, mkv, m4v) and apng are always `.webm`**.
- Every animated upload gets a `<name>.static.webp` first-frame poster.
- Video is capped at 60s and re-timed to 24fps.
- Size caps: **25 MB images / 128 MB video+apng**, enforced server- and client-side with clean 413 messages.
- Uploads run up to 3 in parallel, each tracked by its own banner.

## Media library rules

- **All media feedback renders as Banners stacked under the media toolbar (via `useMediaLibrary` state) - never render feedback anywhere else.**
- The media grid shows static frames (`<name>.static.webp` via `ImageInfo.staticUrl`) and only swaps to the animated webm (via `<video>`) while hovered - **never render raw animated URLs in list/grid contexts** (performance: dozens of concurrent decoders).

## Markdown editor

- Searchable Insert-icon picker over the full Phosphor set (fuzzy name/tag/category search via `@smc/shared/icon-search`).
- Saving and icon picking auto-run `sync-icons` server-side (SSE into the runner console, source "icons").

## Mods board

- Edits `@scripts/mod-list.json` (drag cards between the 4 category columns, add via Modrinth slug/URL with live search) and can run `sync-mods` from the UI.

## ffmpeg

- `npm run cms:ffmpeg` verifies an ffmpeg for CMS video uploads (`SMC_FFMPEG_PATH` env → `.cache/ffmpeg/` → PATH → optional `ffmpeg-static` download); copies the ffmpeg-static binary into `.cache/ffmpeg/` and prints PATH instructions when nothing system-wide exists.
