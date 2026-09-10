# Deploy

The Deploy tab manages git operations for pushing content changes to GitHub Pages. It provides a simple interface for reviewing changes, staging files, writing commit messages, and deploying.

## Git Status

When you open the Deploy tab, it fetches the current git status and displays:

- **Branch**, The current git branch
- **Changed files**, A list of files with modifications, additions, or deletions
- **File status indicators**, Each file shows whether it is modified (M), added (A), deleted (D), or untracked (?)

## Staging Files

Check the checkbox next to each file you want to include in the commit. You can:

- Select individual files for granular commits
- Use the "select all" checkbox to stage everything at once
- Mix and match, stage some files and leave others for later

## Writing a Commit Message

The commit message input field lets you describe your changes. Write a clear, concise message that explains what changed and why.

## Deploy (Commit + Push)

Click the **Deploy** button to:

1. Stage all selected files (`git add`)
2. Create a commit with your message (`git commit`)
3. Push to the remote repository (`git push`)

The push triggers the GitHub Actions CI pipeline, which builds the site and deploys it to GitHub Pages via artifacts.

## Pull (Fetch)

Click the **Pull** button to fetch and fast-forward merge from the remote:

- This runs `git pull --ff-only`; it only applies if changes can be fast-forwarded
- If there are local changes that conflict, the pull will fail and you'll need to resolve conflicts manually
- Use pull to stay up to date with changes made by others (or from another machine)

## Deployment Pipeline

The deployment flow from the CMS to the live site:

1. **CMS**, Edit content and media
2. **Deploy tab**, Commit and push changes to the repository
3. **GitHub Actions**, CI pipeline builds the Vite site and produces artifacts
4. **GitHub Pages**, Serves the built artifacts at the public URL

## Best Practices

- **Commit logical units**, Each deploy should represent one cohesive change (e.g., "Add new wiki page for Ender IO" or "Update mod list with Create 6.0")
- **Review the file list**, Before deploying, check the changed files to make sure you're not accidentally including unintended changes
- **Pull before pushing**, If others might have pushed changes, pull first to avoid conflicts
- **Check preview first**, Verify your changes look correct in the Preview tab before deploying
