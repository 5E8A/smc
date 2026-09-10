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
- **Hover to animate**, Hovering over a file swaps to its animated `.webm` version (if available)
- **Video files**, Show a poster image; play on hover or via a play button

This approach keeps the grid performant even with dozens of animated files, avoiding concurrent video decoders.

### Context Menu

Right-click or hover over a thumbnail to access:

| Action      | Description                                                 |
| ----------- | ----------------------------------------------------------- |
| **Rename**  | Change the file name                                        |
| **Replace** | Upload a new file to replace this one (keeps the same path) |
| **Delete**  | Remove the file from the media library                      |

## Toolbar Actions

The media toolbar above the grid provides:

| Button                  | Action                                                                                              |
| ----------------------- | --------------------------------------------------------------------------------------------------- |
| **Regenerate blurhash** | Re-scans all images and regenerates blurhash placeholder data (streams progress to runner console)  |
| **Prune unused media**  | Opens a dialog that scans content files for referenced assets and lets you delete unreferenced ones |

### Prune Unused Media

The prune dialog:

1. Scans all post/wiki markdown files and metadata for image references
2. Compares against files in the media library
3. Lists unreferenced files that can be safely deleted
4. Select files and confirm to remove them

This helps keep the media library clean by removing leftover files from deleted posts or replaced images.

## File Storage

All uploaded assets are stored in `@web/public/assets/content/`. These are committed source-of-truth files that the live site references directly.
