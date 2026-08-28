# @scripts - repo-root tooling

Runs with Node >= 22.7 (native TS stripping for `@smc/cms` imports). Invoked via root/workspace npm scripts.

## generate-lqip (`npm run generate-lqip`)

Rescans `@web/public/assets` and regenerates:

- `@web/src/data/blurhash.json` - blurhash placeholders (transparent images skipped).
- `@web/src/data/media.json` - `{ animated: [...], videos: [...] }` (animated webp + VP9 webm lists); blurhash for webm is read from its `.static.webp` poster; warns when an animated asset is missing its `.static.webp` sibling.

Triggered manually: `npm run generate-lqip` or the **Regenerate blurhash** button in the CMS media library (after CMS uploads the library flags blurhash stale and prompts for it).

## sync-mods (`npm run sync-mods`)

One-shot mod-icon pipeline:

- Fetches Modrinth metadata + icons for `@scripts/mod-list.json` (single source of truth: `[{ key, slugs[] }]`), caches raw downloads in `.cache/mod-icons/` (gitignored).
- Verifies every icon decodes, reruns failed slugs (`--retries=N`, default 3), warns on permanent problems (project gone / no icon - hue-tinted cube tile baked into the sprite).
- Regenerates `@web/public/assets/mod-sprites/` (`{key}.webp` + `{key}.placeholder.webp`, 9-col grids) and `@web/src/data/mods.ts` (no per-mod icon files - everything renders from the sprite sheets; `mod-icons/` is removed).
- Chains blurhash regen (`--no-blurhash` to skip). Exit 1 only if fetches survive retries - CMS-update-flow friendly.

## sync-icons (`npm run sync-icons`)

Phosphor icon pipeline:

- Regenerates `@shared/icon-catalog.ts` (full metadata: names/tags/categories from `@phosphor-icons/core`, version-stamped), `@cms/src/components/icon-map.generated.tsx` (ALL icons - local CMS tool, size irrelevant) and `@web/src/components/icon-map.generated.ts` (**only icons referenced by content markdown** - keeps the bundle lean; prunes unused entries automatically).
- The CMS runs it automatically after every entry save and icon insert (streams into the runner console, source "icons"); use manually after hand-editing content JSON or `.md` files or bumping `@phosphor-icons/*` (bump core + react together).
- Cross-checks every name against the installed react package's exports. Exit 1 on unknown placeholders in content.

## screenshot (`npm run screenshot`)

Playwright cross-browser screenshot suite (`@scripts/screenshot/`):

- Full-page + fold captures per route × viewport × browser; output in `screenshots/` (gitignored).
- Flags: `--browsers=`, `--viewports=`, `--only=`, `--no-fold`, `--menu-open` (extra `-menu` variant with the mobile hamburger open on viewports <768px), `--lang=pl`, `--prod`, `--reuse`, `--skip-existing`, `--list`, `--out=`, `--concurrency=`.
- Spawns its own server on port 3100 with `VITE_SCREENSHOT=true`; `--reuse` verifies an existing server on 3000 really is in screenshot mode before reusing.
- Dynamic routes (posts/wiki) auto-discovered from `@web/src/content/`.
- `npm run screenshot:install` installs Playwright browsers (chromium, firefox, webkit).
