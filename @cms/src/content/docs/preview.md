# Preview

The Preview tab renders a live preview of the site in responsive device frames. It embeds the Vite dev server to show exactly how your content looks on different screen sizes and orientations.

## Device Presets

Select a device preset from the dropdown to see the site rendered at that device's viewport size:

| Group                | Devices included                                                          |
| -------------------- | ------------------------------------------------------------------------- |
| **iOS**              | iPhone 17 Pro, iPhone 17 Pro Max, iPhone Air, iPhone 16                   |
| **iPad**             | iPad Pro 13" M4, iPad Air 11"                                             |
| **Android**          | Galaxy S25 Ultra, Galaxy S25, Pixel 10 Pro, OnePlus 13                    |
| **Fold & Tablet**    | Galaxy Z Fold 6, Galaxy Tab S10                                           |
| **Laptop & Desktop** | MacBook Pro 14", MacBook Air 13", Desktop 1080p, Desktop 1440p, Desktop 4K |
| **Legacy**           | iPhone SE 2022, Galaxy S9, Moto G Power, iPad 6th Gen, Laptop 768p        |
| **Custom**           | Enter your own width and height values                                    |

## Device Frames

Each device preset renders the site inside a styled device frame, a visual bezel that simulates the actual device. The frame scales to fit the available space while maintaining the correct aspect ratio.

## Controls

Each device frame has controls below it:

| Control    | Action                                                      |
| ---------- | ----------------------------------------------------------- |
| **Zoom**   | Zoom in/out to inspect details or see the full device frame |
| **Rotate** | Switch between portrait and landscape orientation           |
| **Reload** | Reload the iframe for that specific device                  |

## Toolbar

The toolbar above the device grid provides:

| Control                 | Action                                                                         |
| ----------------------- | ------------------------------------------------------------------------------ |
| **Reload all**          | Reload all device iframes at once                                              |
| **Home**                | Navigate all frames back to the default URL                                    |
| **URL bar**             | Type a URL or path to navigate all frames to a specific page (press Enter)     |
| **Device group filter** | Multi-select dropdown to show/hide device groups (iOS, Android, etc.)           |
| **Loaded counter**      | Shows how many device frames have finished loading (e.g. "5/12 loaded")        |

## How It Works

The preview tab embeds an iframe pointing to the Vite dev server at `http://127.0.0.1:3000`. This means:

- **The dev server must be running** for the preview to work. Start it with `npm run dev` in a separate terminal
- Changes saved in the CMS are reflected in the preview after the dev server's hot reload picks them up
- The preview shows the site exactly as visitors will see it, same styles, same layouts, same content

## Entry Context

When you switch to the Preview tab from a content tab (Posts or Wiki), the preview automatically navigates to the path of the currently selected entry. For example:

- Switching from a post with slug `ender-io-guide` in EN → Preview loads `/en/post/ender-io-guide`
- Switching from a wiki page → Preview loads the corresponding wiki path

When you switch back to the content tab, the entry context is preserved so you don't lose your place.

## Troubleshooting

| Issue                                | Solution                                                                                                                             |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Blank preview / connection error** | Make sure `npm run dev` is running. The server status indicator in the header (second dot) shows whether the dev server is reachable |
| **Stale content**                    | The dev server hot-reloads on file changes. If content looks outdated, check that your changes were saved                            |
| **Wrong page showing**               | The preview navigates based on the selected entry. Select the entry you want to preview, then switch to the Preview tab              |
