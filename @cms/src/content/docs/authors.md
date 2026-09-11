# Authors

The Authors tab manages author profiles. Authors are shared across all languages. When you create an author, they appear as a selectable option in both the EN and PL post and wiki editors.

## Author List

The sidebar shows all author profiles. Each entry displays:

- **Name** (primary text, English name, or "(unnamed)" if blank)
- **ID** (secondary text, the unique identifier)

### Author Actions

| Action     | How                                        |
| ---------- | ------------------------------------------ |
| **Select** | Click an author to edit their profile      |
| **Create** | Click the `+` button in the sidebar header |
| **Delete** | Hover an author and click the trash icon   |

## Author Profile Form

When an author is selected, the main area shows the profile form:

| Field             | Description                                                     |
| ----------------- | --------------------------------------------------------------- |
| **ID**            | Unique identifier (used internally to link posts to authors)    |
| **Avatar**        | Open the ImagePicker to select an avatar from the media library |
| **Name (EN)**     | Author name in English                                          |
| **Name (PL)**     | Author name in Polish                                           |
| **Bio (EN)**      | Short biography in English                                      |
| **Bio (PL)**      | Short biography in Polish                                       |
| **Social Links**  | Optional links to Twitter/X, YouTube, GitHub, and Discord. Each has a URL field and an optional Display Name label |

Authors have bilingual names and bios because they appear on the site in both languages. Fill in both language versions for the best experience.

## How Authors Are Used

When editing a post (in either Posts or Wiki tabs), the **Author** field presents a dropdown of all existing authors. Selecting an author links their profile to the post. On the live site, the author's name and avatar appear with the post.

## Saving

Click **Save** or press `Ctrl+S` to persist changes. Author data writes to:

| What                | Where                           |
| ------------------- | ------------------------------- |
| All author profiles | `@web/src/content/authors.json` |

Authors.json is a single file containing all authors. There is no per-language split because authors themselves are bilingual.
