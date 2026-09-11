# Assets

The Assets tab is the full media library. It provides folder navigation, file upload with automatic format conversion, a thumbnail grid, and media management tools.

## Folder Navigation

The left side of the Assets view shows a folder tree rooted at `@web/public/assets/content/`. Folders include:

| Folder     | Contents                                    |
| ---------- | ------------------------------------------- |
| `posts/`   | Post cover images and inline content images |
| `banners/` | Site banner images                          |
| `avatars/` | Author avatar images                        |
| `static/`  | Site-owned chrome (logos, UI elements)      |

Click a folder to view its contents in the image grid.

### Folder Management

Hover over a folder in the tree to reveal management buttons:

| Action             | How                                                                         |
| ------------------ | --------------------------------------------------------------------------- |
| **New subfolder**  | Click the `+` icon to create a subfolder inside the selected folder         |
| **Rename folder**  | Click the pencil icon and enter a new name (path references in content update automatically) |
| **Delete folder**  | Click the trash icon; if the folder contains images still referenced by content, deletion is blocked and a usage report is shown |

A **New folder** button also appears at the bottom of the folder tree for creating top-level folders.

## Uploading Files

### Drag and Drop

Drag files from your file manager directly onto the Assets view. Files are automatically placed in the currently selected folder.

### Upload Button

Click the upload button to open a file picker. You can select multiple files at once.

### Upload Rules

| Rule                 | Detail                              |
| -------------------- | ----------------------------------- |
| **Parallel uploads** | Up to 3 files upload simultaneously |
| **Image size cap**   | 25 MB maximum per image             |
| **Video size cap**   | 128 MB maximum per video/APNG       |

### Upload Settings

Before confirming the upload, the modal shows adjustable settings for each batch:

- **Quality** - WebP/WebM encoding quality (1-100, default 80). Lower values produce smaller files with slightly less detail.
- **Max width** - Maximum pixel width for resized images. Images wider than this are scaled down proportionally.

For animated files (GIF, animated WebP, video, APNG), you can also toggle the output format between **animated WebP** (lighter, good for short loops) and **WebM** (better for longer animations).

## Format Conversion

When you upload a file, the CMS automatically converts it to the optimal web format:

| Input Format                               | Output Format                           | Notes                                                                  |
| ------------------------------------------ | --------------------------------------- | ---------------------------------------------------------------------- |
| Static images (PNG, JPEG, BMP, TIFF, AVIF) | **WebP**                                | Quality and max-width adjustable per upload                            |
| **GIF**                                    | **Animated WebP** (default) or **WebM** | Toggle in the upload preview. Animated WebP is lighter for short loops |
| **Animated WebP**                          | **Animated WebP** (default) or **WebM** | Same toggle as GIF                                                     |
| **Video** (MP4, MOV, WebM, MKV, M4V)       | **WebM**                                | Always WebM                                                            |
| **APNG**                                   | **WebM**                                | Always WebM                                                            |

Additional conversion rules:

- Every animated upload gets a `<name>.static.webp` poster image (first frame)
- Video is capped at **60 seconds** and re-timed to **24 fps**
- Poster generation happens automatically for all animated formats

## Image Grid

The main area shows thumbnails of all files in the selected folder:

- **Static thumbnails**, All images display as static `.webp` frames for performance
- **Hover preview**, Hovering opens a floating preview card showing the full image; animated files play their `.webm` in the preview
- **Video files**, Show a poster image in the grid; play in the hover preview or via a play button

This approach keeps the grid performant even with dozens of animated files, avoiding concurrent video decoders.

### Context Menu

Right-click or hover over a thumbnail to access:

| Action        | Description                                                                       |
| ------------- | --------------------------------------------------------------------------------- |
| **Copy path** | Copy the base-agnostic content path (e.g. `/assets/content/posts/image.webp`) to the clipboard, the path format used in markdown and JSON |
| **Rename**    | Change the file name                                                              |
| **Replace**   | Upload a new file to replace this one (keeps the same path)                       |
| **Delete**    | Remove the file from the media library                                            |

> **Warning:** If the file is referenced in any post, wiki page, or author profile, the deletion will be blocked and a usage report will show exactly where it's still referenced. Remove the references first, then delete.

## Toolbar Actions

The media toolbar above the grid provides:

- **Search bar** - Filter images by path. Type part of a file or folder name to narrow the grid.
- **Image count** - Shows the number of visible images after filtering.

| Button                  | Action                                                                                              |
| ----------------------- | --------------------------------------------------------------------------------------------------- |
| **Regenerate blurhash** | Re-scans all images and regenerates blurhash placeholder data (streams progress to runner console)  |
| **Prune unused media**  | Opens a dialog that scans content files for referenced assets and lets you delete unreferenced ones |

### Prune Unused Media

The prune dialog:

1. Scans all post/wiki markdown files and metadata for image references
2. Compares against files in the media library
3. Lists unreferenced files and empty folders that can be safely deleted
4. Select files and confirm to remove them

This helps keep the media library clean by removing leftover files from deleted posts or replaced images.

## File Storage

All uploaded assets are stored in `@web/public/assets/content/`. These are committed source-of-truth files that the live site references directly.
