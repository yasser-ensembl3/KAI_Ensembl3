# GitHubIssue Workflow

**Manage GitHub issues and comments from the command line.**

---

## Trigger Phrases

- "create github issue"
- "github issue"
- "add comment to issue"
- "list issues"
- "close issue"

---

## Prerequisites

1. **GitHub CLI installed:**
   ```bash
   brew install gh
   ```

2. **Authenticated:**
   ```bash
   gh auth login
   ```

---

## Tool Location

```bash
bun run ~/.claude/skills/Organizer/Tools/GitHubIssue.ts <command>
```

---

## Commands

### List Issues

```bash
bun run GitHubIssue.ts list --repo owner/repo
bun run GitHubIssue.ts list --repo owner/repo --state closed --limit 20
```

### Create Issue

```bash
bun run GitHubIssue.ts create \
  --repo owner/repo \
  --title "Bug: Something is broken" \
  --body "Description of the issue"
```

### Add Comment

```bash
bun run GitHubIssue.ts comment \
  --repo owner/repo \
  --issue 123 \
  --body "Thanks for reporting!"
```

### View Issue Details

```bash
bun run GitHubIssue.ts view --repo owner/repo --issue 123
```

### Close Issue

```bash
bun run GitHubIssue.ts close --repo owner/repo --issue 123
bun run GitHubIssue.ts close --repo owner/repo --issue 123 --reason completed
```

### Search Issues

```bash
bun run GitHubIssue.ts search --repo owner/repo --query "bug"
```

---

## Options

| Option | Short | Description |
|--------|-------|-------------|
| `--repo` | `-r` | Repository (owner/repo) - required |
| `--title` | `-t` | Issue title (for create) |
| `--body` | `-b` | Issue or comment body |
| `--issue` | `-i` | Issue number |
| `--state` | `-s` | Filter: open, closed, all |
| `--labels` | `-l` | Comma-separated labels |
| `--query` | `-q` | Search query |
| `--limit` | | Max results (default: 10) |
| `--reason` | | Close reason: completed, not_planned |

---

## Steps

### 1. Identify Action

| User wants to... | Command |
|------------------|---------|
| See open issues | `list` |
| Report a bug | `create` |
| Reply to an issue | `comment` |
| Check issue status | `view` |
| Resolve an issue | `close` |
| Find specific issues | `search` |

### 2. Get Repository

If not specified, ask:
- "Which repository? (format: owner/repo)"

### 3. Execute

Run the appropriate command with parameters.

### 4. Confirm

Report the result:
- Issue URL for create
- Success message for comment/close
- Issue details for view

---

## Examples

**Example 1: Create a bug report**
```
User: "Create an issue for the login bug"
→ Ask for repo if needed
→ Run: create --repo user/repo --title "Login bug" --body "..."
→ Return: "✅ Issue created: https://github.com/..."
```

**Example 2: Check open issues**
```
User: "What are the open issues on my repo?"
→ Run: list --repo user/repo
→ Return: List of issues with numbers and titles
```

**Example 3: Comment on issue**
```
User: "Add a comment to issue 42 saying it's fixed"
→ Run: comment --repo user/repo --issue 42 --body "This is now fixed"
→ Return: "✅ Comment added"
```

**Example 4: Close resolved issue**
```
User: "Close issue 42, it's completed"
→ Run: close --repo user/repo --issue 42 --reason completed
→ Return: "✅ Issue #42 closed"
```

---

## Sync Notion → GitHub (Manual)

**Trigger:** "sync notion todos to github", "update github issues from notion"

**⚠️ Only run when explicitly requested by the user.**

Synchronize tasks from a Notion page to GitHub issues:
1. Compare Notion tasks with existing GitHub issues
2. Add comments to existing issues with progress updates
3. Create new issues for tasks that don't have one
4. Close/consolidate duplicate issues

### Process

```
1. Read Notion page content (NotionSync)
2. List existing GitHub issues (GitHubIssue list)
3. Compare and identify:
   - Issues to update (add comment)
   - Issues to create (new tasks)
   - Issues to consolidate (duplicates)
4. Execute updates with user approval
5. Report changes
```

### Example

```
User: "sync my January todos to GitHub"
→ Read Notion page "Yasser - January 2026"
→ List issues on GuillaumeRacine/ensemble_prototypes
→ Compare 12 Notion tasks with 9 GitHub issues
→ Report: "3 issues to update, 4 to create, 2 to consolidate"
→ User approves
→ Execute sync
→ Return: "✅ Synced: 4 created, 3 updated, 2 closed as duplicates"
```

### Comment Format for Updates

```markdown
## Status Update (Jan 21, 2026)

**Status: ✅ Complete** (or 🔄 In Progress / 🚫 Blocked / ❌ Not Started)

### What was delivered:
- Feature 1
- Feature 2

### Resources:
- Dashboard: https://...
- GitHub: https://...

---
*Synced from Notion: Page Name*
```

---

## Notes

- Requires `gh` CLI to be installed and authenticated
- Works with any repository you have access to
- For private repos, ensure proper permissions
- Labels must exist in the repository before using them
- **Always write issue content in English**
