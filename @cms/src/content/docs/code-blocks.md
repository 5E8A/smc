# Code Blocks

Fenced code blocks get syntax highlighting, a language label in the top-left corner, and a copy button in the top-right. The language identifier after the opening triple backticks decides both the highlighting and the label.

## Inline Code

Use backticks for inline code references:

```
Run `npm run cms` to start the editor.
```

Run `npm run cms` to start the editor.

## Standard Code Blocks

Open a fenced block with three backticks followed by the language identifier, and close it with three backticks:

````markdown
```json
{
  "slug": "my-post",
  "title": "My Post"
}
```
````

```json
{
  "slug": "my-post",
  "title": "My Post"
}
```

## Language Examples

The identifier controls the highlighting and the label shown on the block. Omit it entirely for plain text.

### JSON

```json
{
  "slug": "my-post",
  "title": "My Post",
  "category": "News",
  "tags": ["release", "announcement"]
}
```

### Bash / Shell

```bash
npm run cms
npm run sync-mods
git add .
git commit -m "Update the mod list"
```

### Java

```java
public static void main(String[] args) {
    System.out.println("Welcome to the SMC!");
}
```

### TypeScript

```typescript
interface WikiDoc {
  slug: string;
  title: string;
  content: string;
}

const doc: WikiDoc = { slug: "ender-io", title: "Ender IO", content: "..." };
```

### Python

```python
mods = ["Sodium", "Iris", "JEI"]
for mod in mods:
    print(f"Loaded {mod}")
```

### YAML

```yaml
modpack:
  name: SMC
  version: 1.0.0
  loader: neoforge
```

### CSS

```css
.card {
  border-radius: 0.75rem;
  transition: color 0.2s ease;
}

.card:hover {
  color: #4ade80;
}
```

### TOML

```toml
[mod]
id = "sodium"
version = "0.6.0"
loader = "fabric"
```

### Markdown

Nest a fenced block inside documentation by wrapping it in four backticks:

````markdown
```json
{ "hello": "world" }
```
````

### Plain text

Without a language identifier the block renders as plain, unhighlighted monospace text:

```
No highlighting, no label-specific colors - just monospace text.
```

## Diff Trick

The `diff` language colors added lines green and removed lines red - perfect for changelogs, upgrade notes, and "what changed" sections:

````markdown
```diff
+ Added all-in-one-super-mega-quality-of-life-mod
- Removed mod-that-closes-the-game-when-you-open-it
```
````

```diff
+ Added all-in-one-super-mega-quality-of-life-mod
- Removed mod-that-closes-the-game-when-you-open-it
```

Use `diff` whenever readers should instantly see what to add (+) and what to remove (-).
