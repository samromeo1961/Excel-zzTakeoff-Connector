# Git Workflow Guide - Working Across Multiple Computers

This guide helps you synchronize your work when developing on multiple computers using VSCode and Git.

## Quick Start - Getting Changes on a New Computer

### Using VSCode GUI (Easiest)

1. **Open Project in VSCode**
   ```bash
   cd /path/to/Excel-zzTakeoff-Connector
   code .
   ```

2. **Open Source Control Panel**
   - Click Source Control icon in left sidebar (or press `Ctrl+Shift+G`)

3. **Fetch Latest Changes**
   - Click the `...` menu at top of Source Control panel
   - Select **Pull, Push** → **Fetch**

4. **Switch to Your Branch**
   - Click the **branch name** in bottom-left corner
   - Select your feature branch from the dropdown
   - Example: `claude/excel-sheet-name-picker-011CUyUQurfWx1dLWREzrK1v`

5. **Done!** VSCode automatically pulls the latest changes

### Using VSCode Terminal (More Control)

Press `` Ctrl+` `` to open terminal, then:

```bash
# 1. Fetch all branches from GitHub
git fetch origin

# 2. Switch to your feature branch
git checkout claude/excel-sheet-name-picker-011CUyUQurfWx1dLWREzrK1v

# 3. Pull latest changes
git pull origin claude/excel-sheet-name-picker-011CUyUQurfWx1dLWREzrK1v

# 4. Verify you got the changes
git log --oneline -5
git status
```

---

## Daily Workflow

### Starting Your Work Session (Any Computer)

**Option A - VSCode GUI:**
1. Open Source Control (`Ctrl+Shift+G`)
2. Click sync icon (↻) in bottom-left corner
3. Start coding!

**Option B - Terminal:**
```bash
# Make sure you're on the right branch and have latest code
git checkout claude/excel-sheet-name-picker-011CUyUQurfWx1dLWREzrK1v
git pull origin claude/excel-sheet-name-picker-011CUyUQurfWx1dLWREzrK1v
```

### Ending Your Work Session (Any Computer)

**Option A - VSCode GUI:**
1. Open Source Control (`Ctrl+Shift+G`)
2. Review your changes in the list
3. Click `+` next to changed files to stage them
4. Type a commit message in the text box
5. Click the ✓ checkmark to commit (or press `Ctrl+Enter`)
6. Click the `...` menu → **Push** (or click sync icon)

**Option B - Terminal:**
```bash
# 1. Stage your changes
git add .

# 2. Commit with a descriptive message
git commit -m "feat: Add user authentication to login page"

# 3. Push to GitHub
git push origin claude/excel-sheet-name-picker-011CUyUQurfWx1dLWREzrK1v
```

---

## VSCode Visual Indicators

Learn to read these helpful hints:

### Bottom-Left Corner
- `main` - Current branch name
- `main ↑2` - You have 2 commits to PUSH
- `main ↓3` - You have 3 commits to PULL
- `main ↑2↓3` - 2 to push, 3 to pull
- Click branch name to **switch branches**
- Click sync icon (↻) to **sync (pull + push)**

### Source Control Panel
- **Blue dot** on icon = Changes available to pull
- **Number badge** = Files with uncommitted changes
- **M** = Modified file
- **U** = Untracked (new) file
- **D** = Deleted file

---

## Common Situations & Solutions

### Situation 1: "I made changes on Computer A, how do I get them on Computer B?"

**Computer A (after making changes):**
```bash
git add .
git commit -m "Your description"
git push
```

**Computer B (to get those changes):**
```bash
git pull
```

### Situation 2: "I forgot what branch I'm on"

**Check current branch:**
```bash
git branch --show-current
```

Or just look at **bottom-left corner** of VSCode!

### Situation 3: "Error: Your local changes would be overwritten"

**If you want to KEEP your local changes:**
```bash
# Save changes temporarily
git stash

# Get remote changes
git pull

# Re-apply your changes
git stash pop
```

**If you want to DISCARD your local changes:**
```bash
# Discard all local changes (CAREFUL!)
git reset --hard

# Then pull
git pull
```

### Situation 4: "I have conflicts after pulling"

VSCode makes this easy:

1. Files with conflicts show in Source Control panel with a `!` icon
2. Open the conflicting file
3. Look for conflict markers:
   ```
   <<<<<<< HEAD (Your changes)
   Your code here
   =======
   Their code here
   >>>>>>> origin/branch (Remote changes)
   ```
4. VSCode shows buttons above the conflict:
   - **Accept Current Change** - Keep your version
   - **Accept Incoming Change** - Use remote version
   - **Accept Both Changes** - Keep both
   - **Compare Changes** - See side-by-side
5. Click your choice, save the file
6. Commit the resolution:
   ```bash
   git add .
   git commit -m "Resolved merge conflict"
   git push
   ```

### Situation 5: "I can't see my branch in the dropdown"

```bash
# Fetch all branches from GitHub
git fetch origin

# Now check VSCode dropdown - should appear!
```

---

## Recommended VSCode Settings

Press `Ctrl+,` to open Settings, then enable:

1. **Auto-Fetch**
   - Search: `git autofetch`
   - Enable: `Git: Autofetch`
   - Set `Git: Autofetch Period` to `60` (checks every minute)

2. **Auto-Save**
   - Search: `auto save`
   - Set `Files: Auto Save` to `afterDelay`
   - Prevents losing work!

3. **Git Decorations**
   - Search: `git decorations`
   - Enable `Git: Decorations Enabled`
   - Shows modified files in file explorer

---

## Useful VSCode Shortcuts

| Action | Shortcut | Alternative |
|--------|----------|-------------|
| Open Source Control | `Ctrl+Shift+G` | Click icon in sidebar |
| Open Terminal | `` Ctrl+` `` | Terminal → New Terminal |
| Commit | `Ctrl+Enter` | Click ✓ in Source Control |
| Command Palette | `Ctrl+Shift+P` | View → Command Palette |
| Switch Branch | Click branch name | Command Palette → "Git: Checkout to..." |
| View Git History | Install "Git Graph" extension | Click "Git Graph" in status bar |

---

## Git Commands Reference

### Checking Status
```bash
git status                    # What's changed?
git log --oneline -10         # Last 10 commits
git branch -a                 # List all branches
git diff                      # See unstaged changes
```

### Making Changes
```bash
git add .                     # Stage all changes
git add file.js               # Stage specific file
git commit -m "message"       # Commit with message
git push                      # Push to GitHub
```

### Getting Changes
```bash
git fetch origin              # Download branch info
git pull                      # Fetch + merge current branch
git pull origin branch-name   # Pull specific branch
```

### Branch Management
```bash
git branch                         # List local branches
git checkout branch-name           # Switch to branch
git checkout -b new-branch         # Create and switch to new branch
git branch -d branch-name          # Delete branch (safe)
git branch -D branch-name          # Force delete branch
```

### Undoing Things
```bash
git restore file.js           # Discard changes to file
git restore --staged file.js  # Unstage file
git reset HEAD~1              # Undo last commit (keep changes)
git reset --hard HEAD~1       # Undo last commit (discard changes)
git stash                     # Temporarily save changes
git stash pop                 # Restore stashed changes
```

---

## Best Practices

### ✅ DO

- **Pull before starting work** - Always sync first
- **Commit often** - Small, logical commits
- **Write descriptive commit messages** - "Fix login bug" not "updates"
- **Push at end of session** - Don't leave unpushed commits
- **Pull before pushing** - Avoid conflicts
- **Use branches** - Never work directly on `main`

### ❌ DON'T

- **Don't force push** (`git push -f`) unless you know what you're doing
- **Don't commit sensitive data** (.env files, passwords, API keys)
- **Don't commit generated files** (node_modules, dist, build folders)
- **Don't make huge commits** - Hard to review and revert
- **Don't skip commit messages** - Future you will be confused

---

## Commit Message Format

Follow this format for clear history:

```
type: Brief description (50 chars or less)

More detailed explanation if needed (wrap at 72 chars).
Explain WHAT changed and WHY, not HOW (code shows how).

- Bullet points for multiple changes
- Reference issues: Fixes #123
```

**Common types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code formatting (no logic change)
- `refactor:` - Code restructuring (no feature change)
- `test:` - Adding tests
- `chore:` - Maintenance (deps, config)

**Examples:**
```bash
git commit -m "feat: Add user profile picture upload"
git commit -m "fix: Prevent crash when email is empty"
git commit -m "docs: Update installation instructions"
git commit -m "refactor: Extract validation logic to separate file"
```

---

## Troubleshooting

### "Permission denied (publickey)"

**Problem:** Can't push/pull from GitHub

**Solution:** Set up SSH key or use HTTPS with personal access token

```bash
# Check current remote URL
git remote -v

# Switch to HTTPS (easier)
git remote set-url origin https://github.com/username/repo.git
```

### "Detached HEAD state"

**Problem:** Not on a branch

**Solution:**
```bash
# Create a branch from current state
git checkout -b recovery-branch

# Or go back to your branch
git checkout claude/excel-sheet-name-picker-011CUyUQurfWx1dLWREzrK1v
```

### "fatal: refusing to merge unrelated histories"

**Problem:** Trying to merge projects with different histories

**Solution:**
```bash
git pull origin branch-name --allow-unrelated-histories
```

---

## Getting Help

### In VSCode
- Press `F1` or `Ctrl+Shift+P`
- Type "Git: " to see all Git commands
- Hover over icons for tooltips

### In Terminal
```bash
git help                 # List common commands
git help <command>       # Detailed help for a command
git <command> --help     # Same as above
```

### Online Resources
- [Git Documentation](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)
- [VSCode Git Documentation](https://code.visualstudio.com/docs/editor/versioncontrol)

---

## Current Project Branch

For the sheet picker feature, you're working on:

```
claude/excel-sheet-name-picker-011CUyUQurfWx1dLWREzrK1v
```

**Recent commits on this branch:**
- `ff32c11` - fix: Improve sheet picker UX - dark theme and reopen behavior
- `f7ccc72` - feat: Add sheet picker modal for multi-sheet Excel files

**To get these changes:**
```bash
git fetch origin
git checkout claude/excel-sheet-name-picker-011CUyUQurfWx1dLWREzrK1v
git pull
```

---

## Quick Cheat Sheet

**Print this out and keep next to your computer!**

```bash
# START OF DAY
git pull                                    # Get latest changes

# DURING WORK
git status                                  # Check what changed
git add .                                   # Stage all changes
git commit -m "description"                 # Save changes locally

# END OF DAY
git push                                    # Upload to GitHub

# WHEN STUCK
git status                                  # Where am I?
git log --oneline -5                        # Recent commits
git branch --show-current                   # Which branch?

# OH NO! FIX IT!
git restore file.js                         # Undo file changes
git stash                                   # Save changes temporarily
git reset --hard HEAD                       # Nuclear option - reset everything
```

---

**Last Updated:** 2025-11-10
**Branch:** `claude/excel-sheet-name-picker-011CUyUQurfWx1dLWREzrK1v`

**Remember:** Git is your friend! Don't be afraid to experiment - you can almost always undo things. When in doubt, `git status` is your best friend.
