# Posts

The Posts tab is where you create and manage blog posts. Posts are bilingual; each post can have an EN and PL version, controlled via the language toggle in the sidebar.

## Language Toggle

At the top of the sidebar, two buttons let you switch between **EN** (English) and **PL** (Polish). The currently active language is highlighted. All edits apply to the selected language.

Posts without a counterpart in the other language are marked with a badge like "no PL" or "no EN" in the entry list, and a warning banner will prompt you to create a translation.

## Entry List

The sidebar shows all posts for the current language. Each entry displays:

- **Title** (primary text)
- **Slug, date, and missing-language badge** (secondary text)
- **Dirty indicator** (amber dot), shown when the entry has unsaved changes

### Entry Actions

| Action        | How                                                                               |
| ------------- | --------------------------------------------------------------------------------- |
| **Select**    | Click an entry to open it in the editor                                           |
| **Create**    | Click the `+` button in the sidebar header                                        |
| **Duplicate** | Hover an entry and click the duplicate icon (copies metadata, generates new slug) |
| **Delete**    | Hover an entry and click the trash icon                                           |

## Metadata Form

When an entry is selected, the left side of the main area shows the metadata form with these fields:

| Field           | Description                                                              |
| --------------- | ------------------------------------------------------------------------ |
| **Slug**        | URL-safe identifier (auto-generated from title, editable)                |
| **Title**       | Post title                                                               |
| **Summary**     | Short summary shown in post previews and meta tags (multiline text area) |
| **Date**        | Publication date (format: YYYY-MM-DD)                                    |
| **Author**      | Select from existing author profiles via the author picker               |
| **Cover image** | Open the ImagePicker to select from the media library                    |
| **Category**    | Content category for site organization                                   |

## Markdown Editor

Below the metadata form is the markdown editor. It is a split-pane view with:

- **Left panel**: Raw markdown textarea for writing content
- **Right panel**: Live preview rendered via MarkdownPreview, showing exactly how the content will appear on the site

The preview syncs with the textarea as you type, keeping the scroll position aligned via caret-anchored scroll sync.

### Toolbar

Above the textarea, a toolbar provides quick-insert buttons:

| Button       | Action                                                                                                                                        |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Icon**     | Opens a searchable icon picker over the full Phosphor icon set (fuzzy name/tag/category search). Inserts `:IconName:` syntax                  |
| **Media**    | Opens the ImagePicker to select media files. Inserts standard markdown image syntax                                                           |
| **Carousel** | Wraps selected text/images in `:carouselStart:` / `:carouselEnd:` blocks; with no selection, opens the multi-image picker to build a carousel |
| **Editor**   | Scrolls to the bottom of the content editor                                                                                                   |

## Saving

Click the **Save** button or press `Ctrl+S`. On save:

1. Metadata writes to `@web/src/content/{lang}/posts.json`
2. Body writes to `@web/src/content/{lang}/posts/{slug}.md`
3. `sync-icons` runs automatically to update the icon map (output streams to the runner console)

If the slug changes, the old `.md` file is renamed and the old slug is removed from the JSON.

## Validation

Before saving, the CMS validates the entry for common issues:

- Missing required fields (slug, title, date)
- Invalid slug format
- Duplicate slugs within the same language
- Missing counterpart in the other language (warning, not error)

Validation issues appear as a banner above the main content area. Errors block saving; warnings are informational.

## File Mapping

| What                                    | Where                                     |
| --------------------------------------- | ----------------------------------------- |
| Post metadata (all posts, one language) | `@web/src/content/{lang}/posts.json`      |
| Post body (one post)                    | `@web/src/content/{lang}/posts/{slug}.md` |

Changes only take effect on the live site after a rebuild. The CMS edits source files directly. There is no database.
