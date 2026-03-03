---
name: Organizer
description: Multi-destination file organization system. USE WHEN organize files, sort downloads, sync to drive, add to obsidian, create notion page, github issue, OR file management.
---

# Organizer - Multi-Destination File Organization

**Routes files to the right destination with the right format.**

---

## Tools

| Tool | Purpose | Command |
|------|---------|---------|
| **Operator.ts** | Spawn an Operator agent for admin/logistics | `bun run $PAI_DIR/skills/Organizer/Tools/Operator.ts --task "<task>"` |

---

## Operator Agent

**Traits:** `business, pragmatic, systematic`

For complex admin, logistics, or operational tasks:
- Process administrative tasks
- Track deadlines and filings
- Coordinate hiring processes
- Handle legal paperwork
- Manage finances and budget

---

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **FileSort** | "organize files", "sort downloads", "clean desktop" | `Workflows/FileSort.md` |
| **DriveSync** | "sync to drive", "upload to drive", "google drive" | `Workflows/DriveSync.md` |
| **ObsidianCapture** | "add to obsidian", "obsidian note", "vault" | `Workflows/ObsidianCapture.md` |
| **NotionSync** | "notion page", "add to notion", "sync notion" | `Workflows/NotionSync.md` |
| **GitHubIssue** | "github issue", "create issue", "add comment", "sync notion to github" | `Workflows/GitHubIssue.md` |

---

## Examples

**Example 1: Organize downloads**
```
User: "organize my downloads folder"
-> Invokes FileSort workflow
```

**Example 2: Add note to Obsidian**
```
User: "add this to my obsidian vault"
-> Invokes ObsidianCapture workflow
```

**Example 3: Create GitHub issue**
```
User: "create an issue for this bug"
-> Invokes GitHubIssue workflow
```

**Example 4: Sync Notion todos to GitHub**
```
User: "sync my notion todos to github issues"
-> Invokes GitHubIssue workflow (Sync Notion → GitHub)
-> Compares Notion tasks with GitHub issues
-> Creates/updates issues as needed
```
