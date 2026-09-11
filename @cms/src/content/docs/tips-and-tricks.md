# Tips & Tricks

A collection of shortcuts, hidden features, and workflow advice for getting the most out of the CMS.

## Keyboard Shortcuts

| Shortcut | Action               | Context                    |
| -------- | -------------------- | -------------------------- |
| `Ctrl+B` | Toggle sidebar       | Posts, Wiki, Authors tabs  |
| `Ctrl+S` | Save current changes | Posts, Wiki, Authors, Mods tabs |

## Dirty Tab Indicator

When a tab has unsaved changes, its button text turns **amber** in the header. This makes it easy to see at a glance which tabs have pending edits. The indicator persists until you save or navigate away.

## Runner Console

The runner console starts collapsed at the bottom of the screen. It shows output from background tasks, automatically expands when a task starts, and can be collapsed/expanded by clicking its header.

### What Streams into the Console

| Task                    | Source     | When                                                        |
| ----------------------- | ---------- | ----------------------------------------------------------- |
| **Icon sync**           | `icons`    | After saving a post or wiki entry with `:IconName:` markers |
| **Mod sync**            | `mods`     | When you run sync-mods from the Mods tab                    |
| **Blurhash generation** | `blurhash` | When you click "Regenerate blurhash" in Assets              |
| **Media uploads**       | `media`    | During file uploads in the Assets tab                       |
| **Validation**          | `validate` | When the CMS validates content before saving                |

The console uses colored source labels so you can tell which task is producing output.

## Server Status Dots

Two small dots in the header indicate server health:

| Dot                   | Meaning                                        |
| --------------------- | ---------------------------------------------- |
| **First dot (green)** | CMS server is reachable at `127.0.0.1:4000`    |
| **Second dot (lit)**  | Vite dev server is running at `127.0.0.1:3000` |

If the CMS server goes offline, an **Offline banner** appears at the top of the page with a retry button. The banner auto-dismisses when the server becomes reachable again.

## Validation Issue Banners

When validation issues exist, a banner appears above the main content area showing:

- Each issue with its entry index, field name, and error message
- A note that issues auto-dismiss when fixed
- Errors (red) block saving; warnings (amber) are informational

The banner is dismissable but will reappear if issues persist when you try to save.

## Workflow Tips

### Start with the Dev Server

Always run `npm run dev` in a separate terminal before using the CMS. This enables:

- Live preview in the Preview tab
- Hot reload so saved changes appear immediately

### Use the Language Toggle Intentionally

When creating a new post or wiki page, start in one language (e.g., EN), create the entry and fill in the metadata, then switch to PL and create the counterpart. The CMS warns you about missing counterparts.

### Check Content Before Deploying

The typical cycle is:

1. **Edit** content in Posts/Wiki
2. **Save** (`Ctrl+S`)
3. **Preview** the changes in the Preview tab
4. **Verify** everything looks correct
5. **Deploy** via the Deploy tab

### Use the Icon Picker

Don't try to memorize icon names. The Insert Icon button in the markdown editor toolbar opens a searchable picker covering the full Phosphor icon set. Search by name, tag, or browse by category.

### Keep the Media Library Clean

Periodically use the **Prune unused media** tool in the Assets tab to remove files that are no longer referenced by any content. This keeps the repository size manageable.

### Batch Convert Before Uploading

If you have many images to add, consider using the Converter tab first to batch-convert them to WebP. Then upload the converted files through the Assets tab. This avoids waiting for individual upload-time conversions.

### Monitor the Runner Console

Keep an eye on the runner console during saves and uploads. It shows real-time progress for background tasks and any errors that occur. A task that hangs or fails will be visible in the console output.
