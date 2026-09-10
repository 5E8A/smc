# Preview

The Preview tab renders a live preview of the site in responsive device frames. It embeds the Vite dev server to show exactly how your content looks on different screen sizes and orientations.

## Device Presets

Select a device preset from the dropdown to see the site rendered at that device's viewport size:

| Preset      | Description                            |
| ----------- | -------------------------------------- |
| **iOS**     | iPhone viewport                        |
| **Android** | Android phone viewport                 |
| **iPad**    | Tablet viewport in portrait/landscape  |
| **Laptop**  | Laptop screen viewport                 |
| **Desktop** | Full desktop viewport                  |
| **Custom**  | Enter your own width and height values |

## Device Frames

Each device preset renders the site inside a styled device frame, a visual bezel that simulates the actual device. The frame scales to fit the available space while maintaining the correct aspect ratio.

## Controls

| Control    | Action                                                      |
| ---------- | ----------------------------------------------------------- |
| **Zoom**   | Zoom in/out to inspect details or see the full device frame |
| **Rotate** | Switch between portrait and landscape orientation           |

## How It Works

The preview tab embeds an iframe pointing to the Vite dev server at `http://127.0.0.1:3000`. This means:

- **The dev server must be running** for the preview to work. Start it with `npm run dev` in a separate terminal
- Changes saved in the CMS are reflected in the preview after the dev server's hot reload picks them up
- The preview shows the site exactly as visitors will see it, same styles, same layouts, same content

## Entry Context

When you switch to the Preview tab from a content tab (Posts or Wiki), the preview automatically navigates to the path of the currently selected entry. For example:

- Switching from a post with slug `ender-io-guide` in EN → Preview loads `/smc/en/post/ender-io-guide`
- Switching from a wiki page → Preview loads the corresponding wiki path

When you switch back to the content tab, the entry context is preserved so you don't lose your place.

## Troubleshooting

| Issue                                | Solution                                                                                                                             |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Blank preview / connection error** | Make sure `npm run dev` is running. The server status indicator in the header (second dot) shows whether the dev server is reachable |
| **Stale content**                    | The dev server hot-reloads on file changes. If content looks outdated, check that your changes were saved                            |
| **Wrong page showing**               | The preview navigates based on the selected entry. Select the entry you want to preview, then switch to the Preview tab              |
