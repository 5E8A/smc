# Converter

The Converter tab provides batch format conversion for media files. It is an offline tool, unlike the Assets tab which converts files during upload. The Converter is for bulk-processing files you already have on disk.

## When to Use the Converter

- Converting a large batch of images to WebP before uploading them
- Converting video files to WebM format
- Re-encoding animated GIFs as lightweight animated WebP or WebM
- Any scenario where you need to convert multiple files at once without uploading them to the CMS

## How It Works

### 1. Drop Files or Folders

Drag files or entire folders onto the Converter view. The converter accepts the same input formats as the Assets upload:

- **Images**: PNG, JPEG, BMP, TIFF, AVIF, GIF, animated WebP
- **Video**: MP4, MOV, WebM, MKV, M4V
- **APNG**: Animated PNG files

### 2. Select Output Format

Choose your target output format:

| Input               | Output Options          |
| ------------------- | ----------------------- |
| Static images       | WebP                    |
| GIF / Animated WebP | WebP (animated) or WebM |
| Video / APNG        | WebM                    |

### 3. Convert

Click the convert button to start processing. Each file shows its own progress indicator. Files are processed sequentially with status updates.

### 4. Download

Once conversion is complete, click **Download ZIP** to get all converted files in a single zip archive. The archive preserves the original file names with new extensions.

## Converter vs. Assets Upload

| Feature                 | Converter Tab           | Assets Tab Upload                           |
| ----------------------- | ----------------------- | ------------------------------------------- |
| **Input method**        | Drag files/folders      | Drag or file picker                         |
| **Output destination**  | ZIP download            | Directly into `@web/public/assets/content/` |
| **Parallel processing** | No (sequential)         | Yes (up to 3 concurrent uploads)            |
| **Use case**            | Offline bulk conversion | Uploading content for the site              |
| **Poster generation**   | No                      | Yes (auto-generates `.static.webp`)         |

The Converter is a standalone utility, converted files are not automatically added to the media library. Download the ZIP and manually place files where needed, or upload them through the Assets tab for automatic placement.
