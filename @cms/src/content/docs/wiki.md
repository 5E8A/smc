# Wiki

The Wiki tab manages wiki documentation pages, long-form reference content (in-depth guides, tutorials) that render with a table of contents on the site. It works almost identically to the Posts tab, same language toggle, same entry list pattern, same markdown editor with live preview.

## Sidebar

The sidebar works the same as Posts:

- **Language toggle** (EN/PL) at the top
- **Entry list** with title, slug, and missing-language indicators
- **Create, duplicate, delete** actions on hover

Select an entry to open the wiki editor.

## Wiki Editor

The editor form uses the same fields as the post editor:

| Field           | Description                                                        |
| --------------- | ------------------------------------------------------------------ |
| **Slug**        | URL-safe identifier (auto-generated, editable)                     |
| **Title**       | Page title                                                         |
| **Category**    | Wiki category for site organization                                |
| **Date**        | Publication date (format: YYYY-MM-DD)                              |
| **Cover image** | Optional, open ImagePicker to select from the media library        |
| **Summary**     | Short description for meta tags and previews (multiline text area) |
| **Author**      | Select from existing author profiles via the author picker         |

The markdown editor panel is identical to the Posts tab, split pane with raw markdown on the left and live preview on the right, plus the same toolbar for inserting icons, media, and carousels.

## Translation Counterpart

When a wiki page exists in one language but not the other, a **warning banner** appears above the editor with a **Create {LANG} translation** button. Clicking it clones the current entry into the other language with a fresh date, so you can immediately start translating without recreating metadata from scratch.

## Saving

Saving follows the same pattern as Posts:

1. Metadata writes to `@web/src/content/{lang}/wiki.json`
2. Body writes to `@web/src/content/{lang}/wiki/{slug}.md`
3. `sync-icons` auto-runs after save

## File Mapping

| What                                    | Where                                    |
| --------------------------------------- | ---------------------------------------- |
| Wiki metadata (all pages, one language) | `@web/src/content/{lang}/wiki.json`      |
| Wiki body (one page)                    | `@web/src/content/{lang}/wiki/{slug}.md` |
