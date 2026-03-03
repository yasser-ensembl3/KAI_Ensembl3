# ObsidianCapture Workflow

Add content to Obsidian vault organized with PARA methodology.

---

## Trigger Phrases

- "add to obsidian"
- "save to vault"
- "obsidian note"
- "capture this to obsidian"
- "add to my knowledge base"

---

## Vault Location

```
~/Desktop/Shared Vault/
├── 1-Projects/    # Active projects with deadlines
├── 2-Areas/       # Ongoing responsibilities
├── 3-Resources/   # Reference materials, knowledge
├── 4-Archives/    # Completed/inactive items
└── Quotes/        # (existing)
```

---

## Tool Commands

**Location:** `~/.claude/skills/Organizer/Tools/ObsidianCapture.ts`

### Create a new note

```bash
bun run ~/.claude/skills/Organizer/Tools/ObsidianCapture.ts add \
  --title "Note Title" \
  --category 1-Projects \
  --content "Content here" \
  --subfolder "Optional Subfolder"
```

### Copy existing file to vault

```bash
bun run ~/.claude/skills/Organizer/Tools/ObsidianCapture.ts copy \
  --source /path/to/file.md \
  --category 3-Resources \
  --subfolder "Prompts"
```

### List notes in category

```bash
bun run ~/.claude/skills/Organizer/Tools/ObsidianCapture.ts list --category 1-Projects
```

### Show full structure

```bash
bun run ~/.claude/skills/Organizer/Tools/ObsidianCapture.ts structure
```

---

## Steps

### 1. Identify Content Type

Determine what the user wants to save:
- New note (text content)
- Existing file (copy to vault)
- Multiple files (batch copy)

### 2. Classify with PARA

| Content Type | Category | Subfolder Examples |
|--------------|----------|-------------------|
| Active project notes | 1-Projects | `Website-Redesign/`, `Q1-Launch/` |
| Prompts, instructions | 2-Areas | `AI-Prompts/`, `Workflows/` |
| Reference docs, guides | 3-Resources | `Documentation/`, `Templates/` |
| Old/completed items | 4-Archives | `2025/`, `Old-Projects/` |

### 3. Ask for Confirmation

If category unclear, ask user:
- "Where should I save this? (1-Projects, 2-Areas, 3-Resources, 4-Archives)"
- "Want to create a subfolder for this?"

### 4. Execute

- Create note with frontmatter (title, date, category)
- Or copy file to appropriate location
- Handle duplicates (auto-rename with suffix)

### 5. Confirm

Report:
- File path created
- Category and subfolder used

---

## Content Formatting

Notes are created with YAML frontmatter:

```markdown
---
title: "Note Title"
created: 2026-01-19T10:00:00.000Z
category: 1-Projects
subfolder: Website-Redesign
---

Content here...
```

---

## Examples

**Example 1: Save a prompt**
```
User: "save this prompt to obsidian"
→ Ask: "What category? I suggest 2-Areas/AI-Prompts"
→ User: "yes"
→ Create: ~/Desktop/Shared Vault/2-Areas/AI-Prompts/prompt-name.md
→ Confirm: "✅ Saved to 2-Areas/AI-Prompts/"
```

**Example 2: Copy documentation**
```
User: "add this guide to my knowledge base"
→ Classify: Documentation → 3-Resources
→ Ask: "Save to 3-Resources/Documentation?"
→ User: "yes"
→ Copy file
→ Confirm: "✅ Copied to 3-Resources/Documentation/"
```

**Example 3: Project notes**
```
User: "create a note for the Tao project meeting"
→ Classify: Active project → 1-Projects
→ Create: 1-Projects/Tao/Meeting-Notes-2026-01-19.md
→ Confirm: "✅ Note created in 1-Projects/Tao/"
```

**Example 4: Batch import**
```
User: "add all my prompts from Downloads to obsidian"
→ Scan Downloads for .md files
→ Classify each
→ Show overview: "Found 5 prompts, adding to 2-Areas/AI-Prompts/"
→ User approves
→ Copy all
→ Report: "✅ 5 files added"
```

---

## Subfolder Conventions

| Category | Common Subfolders |
|----------|-------------------|
| 1-Projects | Project names: `Tao/`, `Website/`, `Q1-Launch/` |
| 2-Areas | Responsibility areas: `AI-Prompts/`, `Finance/`, `Health/` |
| 3-Resources | Topics: `Documentation/`, `Templates/`, `Guides/` |
| 4-Archives | Years or old projects: `2025/`, `Old-Tao/` |

---

## Integration Notes

- Files are **copied**, not moved (originals preserved)
- Duplicates are auto-renamed with `-1`, `-2` suffix
- Frontmatter added for Obsidian metadata/search
- Works with any file type, but `.md` recommended for Obsidian
