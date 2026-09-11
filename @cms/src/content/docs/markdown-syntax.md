# Markdown Syntax

The CMS uses an extended Markdown syntax built on GitHub Flavored Markdown (GFM) with custom additions for icons, carousels, and image captions. This page documents all supported syntax.

## Standard Markdown

All standard GFM features work:

- **Bold**: `**text**`
- _Italic_: `*text*`
- ~~Strikethrough~~: `~~text~~`
- [Links](https://example.com): `[text](url)`
- Ordered lists, unordered lists, task lists
- Blockquotes
- Horizontal rules

## Images

### Basic Image

```
![Alt text](/assets/content/banners/wrench.webp)
```

![Alt text](/assets/content/banners/wrench.webp)

Images are rendered with lazy loading and rounded corners. The path should be relative to the site root.

### Image with Caption

Add a title attribute to display a caption below the image:

```
![Alt text](/assets/content/banners/wrench.webp "Attribution / caption")
```

The title renders below the image, useful for attributions and explanations.

![Alt text](/assets/content/banners/wrench.webp "Attribution / caption")

## Icons

Wrap an icon name with colons on each side to insert an inline Phosphor icon. The name format is PascalCase ending with "Icon":

- `:SwordIcon:` renders as :SwordIcon:
- `:GearIcon:` renders as :GearIcon:
- `:BookIcon:` renders as :BookIcon:

### Using the Icon Picker

You don't need to memorize icon names. In the markdown editor, click the **Insert Icon** toolbar button to open a searchable icon picker with:

- **Fuzzy name search**, type part of an icon name
- **Tag filtering**, browse by category tags
- **Category browsing**, navigate by icon family

The picker inserts the icon syntax at your cursor position.

### Common Icons

| Rendered         | Syntax             |
| ---------------- | ------------------ |
| :SwordIcon:      | `:SwordIcon:`      |
| :GearIcon:       | `:GearIcon:`       |
| :BookIcon:       | `:BookIcon:`       |
| :WarningIcon:    | `:WarningIcon:`    |
| :CheckIcon:      | `:CheckIcon:`      |
| :ArrowRightIcon: | `:ArrowRightIcon:` |

## Carousels

Carousels display multiple images in a swipeable slideshow. Use `:carouselStart:` and `:carouselEnd:` markers to wrap a list of standard markdown images:

- `:carouselStart:` begins the carousel block
- `:carouselEnd:` ends the carousel block
- Every line between them must be an `![alt](path)` image reference

Example from real content:

- `## :StarIcon: Quality of Life Mods` renders as a heading with an icon
- `:carouselStart:` begins the carousel block
- `![alt](/assets/content/image.webp)` each image on its own line
- `:carouselEnd:` ends the carousel block

### Carousel Tips

- Use the **Carousel** toolbar button to open a multi-image picker, no syntax to memorize
- If you select text first, the button wraps it in carousel markers instead
- Use 2-6 images per carousel for the best experience
- All images should have similar dimensions for consistent display
- Add titles to each image for accessibility and context
- Paths should start with `/assets/content/`

## Tables

Standard GFM tables are supported with category header support:

```markdown
| Mod               | Version | Loader |
| ----------------- | ------- | ------ |
| **Forge Mods**    |         |        |
| Ender IO          | 6.2.0   | Forge  |
| Thermal Expansion | 5.8.0   | Forge  |
| **Fabric Mods**   |         |        |
| Sodium            | 0.6.0   | Fabric |
| Iris              | 1.8.0   | Fabric |
```

| Mod               | Version | Loader |
| ----------------- | ------- | ------ |
| **Forge Mods**    |         |        |
| Ender IO          | 6.2.0   | Forge  |
| Thermal Expansion | 5.8.0   | Forge  |
| **Fabric Mods**   |         |        |
| Sodium            | 0.6.0   | Fabric |
| Iris              | 1.8.0   | Fabric |

When a table row has **only bold text in the first cell** and all other cells are empty, it renders as a full-width category header spanning all columns.

## Code

Fenced code blocks, inline code, syntax highlighting, and the diff trick moved to the dedicated **Code Blocks** page in the Reference section, which shows an example of every supported language.

## Task Lists

```markdown
- [x] Install the modpack
- [x] Configure memory allocation
- [ ] Join the Discord server
- [ ] Read the getting started guide
```

- [x] Install the modpack
- [x] Configure memory allocation
- [ ] Join the Discord server
- [ ] Read the getting started guide

## Headings

Headings use standard `#` syntax. The CMS automatically demotes `# H1` headings to `## H2`. Use `##` as your top-level heading in content.

## Links

### Internal Links

Links to other pages on the site:

```
[Read the wiki](/en/wiki/ender-io)
```

### External Links

External links open in a new tab automatically, with an arrow icon indicator:

```
[Visit Modrinth](https://modrinth.com)
```
