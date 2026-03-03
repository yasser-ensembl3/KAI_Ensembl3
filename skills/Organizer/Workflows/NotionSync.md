# NotionSync Workflow

**Sync content with Notion - create pages, search, and manage databases.**

---

## Trigger Phrases

- "add to notion"
- "create notion page"
- "search notion"
- "notion sync"
- "save to notion"
- "review todos", "check progress", "notion tasks"

---

## Tool Location

```bash
bun run ~/.claude/skills/Organizer/Tools/NotionSync.ts <command>
```

---

## Commands

### Test Connection

```bash
bun run NotionSync.ts test
```

### List Databases

```bash
bun run NotionSync.ts list-databases
```

### List Recent Pages

```bash
bun run NotionSync.ts list-pages --limit 10
```

### Search Notion

```bash
bun run NotionSync.ts search --query "search term"
```

### Get Page Details

```bash
bun run NotionSync.ts get-page <page-id>
```

### Create Page in Database

```bash
bun run NotionSync.ts create-page \
  --database <database-id> \
  --title "Page Title" \
  --content "Page content here"
```

### Create Standalone Page

```bash
bun run NotionSync.ts create-standalone \
  --title "Page Title" \
  --content "Content" \
  --parent <parent-page-id>  # optional
```

### Review To-Dos on a Page

```bash
bun run NotionSync.ts review-todos --page "Page Name"
```

Shows:
- Progress bar with completion percentage
- List of completed tasks (✅)
- List of remaining tasks (⏳)
- Next task to focus on

### List Sections in a Page

View all sections (headings) and their Task Progress toggles:

```bash
bun run NotionSync.ts list-sections --page "Page Name"
```

Output shows:
- Section headings with IDs
- Which sections have Task Progress toggles
- Page URL

### Initialize Task Progress (Full Structure)

**⚠️ Only run when explicitly requested by the user.**

Creates a Task Progress toggle with the standard structure:

```bash
bun run NotionSync.ts init-task-progress \
  --page "Page Name" \
  --section "Section Name" \
  -r "Workflow: path/to/workflow.md" \
  -r "Tool: path/to/tool.py" \
  -o "Overview description of what this does." \
  --trigger "trigger phrase 1" \
  --trigger "trigger phrase 2"
```

**Standard Task Progress Structure:**
```
▸ Task Progress
  Ressources
  Workflow: ~/.claude/skills/...
  Tool: ~/.claude/skills/...

  Overview
  Description of what was accomplished...

  1. Section Title
  • Bullet point
  • Bullet point

  Trigger Phrases:
  • "phrase 1", "phrase 2"
```

**Advanced: Using JSON:**
```bash
bun run NotionSync.ts init-task-progress \
  --page "Page Name" \
  --section "Section" \
  --json '{"resources":[{"label":"Doc","value":"path"}],"overview":"Description","triggers":["phrase"]}'
```

### Update Task Progress (Incremental)

**⚠️ Only run when explicitly requested by the user.**

Adds dated updates to an existing Task Progress toggle:

```bash
bun run NotionSync.ts update-progress \
  --page "Page Name" \
  --section "Section Name" \
  -u "First update" \
  -u "Second update"
```

**How it works:**
1. Searches for the page by name
2. Finds the heading that matches the section (e.g., "0. TAO Minivault")
3. Locates or creates "Task Progress" toggle under that section
4. Appends a dated update with bullet points

**Example:**
```bash
bun run NotionSync.ts update-progress \
  --page "Yasser - January 2026" \
  --section "TAO Minivault" \
  -u "Dashboard migrated to Nextra theme" \
  -u "All data validated ✓"
```

Result in Notion:
```
▸ Task Progress
  ...existing content...

  Update (Jan 21)
  • Dashboard migrated to Nextra theme
  • All data validated ✓
```

---

## Available Databases

| Database | ID | Use Case |
|----------|-----|----------|
| **DataVault** | `2ee58fe7-31b1-81c4-90f7-dc7b3cfba202` | General data storage |
| **To Do** | `18c58fe7-31b1-8092-9813-f5618e0e77ed` | Tasks and todos |
| **Voice memo transcript** | `29c58fe7-31b1-809d-b04c-df8d31c63707` | Voice transcriptions |
| **Delegation Station** | `18858fe7-31b1-80be-bbfd-c29083578bb4` | Delegated tasks |
| **People Blueprints** | `19d58fe7-31b1-80db-b730-dab1c4f2b732` | Contact profiles |
| **Emails** | `19e58fe7-31b1-8137-a010-e36b7d7bd56c` | Email archive |
| **Journal de Décisions** | `22658fe7-31b1-805e-bc65-c59b1a23f003` | Decision log |
| **Base de Recherches** | `22658fe7-31b1-80c7-aa8d-d7c2f272a62e` | Research data |

---

## Steps

### 1. Identify Content Type

Determine what user wants to save:
- Quick note → Standalone page or DataVault
- Task → To Do database
- Research → Base de Recherches
- Decision → Journal de Décisions

### 2. Choose Destination

Ask user if unclear:
- "Which database should I use?"
- Present relevant options based on content type

### 3. Execute

```bash
# Example: Add a research note
bun run NotionSync.ts create-page \
  --database "22658fe7-31b1-80c7-aa8d-d7c2f272a62e" \
  --title "AI Agent Research" \
  --content "Key findings..."
```

### 4. Confirm

Report:
- Page created with URL
- Database used

---

## Examples

**Example 1: Quick note to Notion**
```
User: "save this to notion: Meeting notes from today"
→ Create standalone page or add to DataVault
→ Return: "✅ Created in Notion: [URL]"
```

**Example 2: Add a task**
```
User: "add to my notion todos: Review PR by Friday"
→ Create page in To Do database
→ Return: "✅ Task added to To Do"
```

**Example 3: Search Notion**
```
User: "search notion for investment"
→ Run: bun run NotionSync.ts search --query "investment"
→ Return: List of matching pages/databases
```

**Example 4: Research note**
```
User: "add this research to notion"
→ Ask: "Add to Base de Recherches?"
→ Create page with content
→ Return: "✅ Research saved"
```

**Example 5: Review to-dos**
```
User: "montre-moi l'avancement de Sprint Week 3"
→ Run: bun run NotionSync.ts review-todos --page "Sprint Week 3"
→ Return:
  Progress: [████████░░░░░░░░░░░░] 40%
  Total: 10 | ✅ 4 done | ⏳ 6 remaining

  ✅ COMPLETED:
     ✓ Setup project structure
     ✓ Create database schema
     ...

  ⏳ REMAINING:
     ○ Implement auth flow
     ○ Write tests
     ...
```

**Example 6: List page sections**
```
User: "show me the sections in Yasser January 2026"
→ Run: bun run NotionSync.ts list-sections --page "Yasser January"
→ Return:
  ### 0. TAO Minivault
     └─ ✅ Task Progress
  ### 1. Media Minivault
     └─ ✅ Task Progress
  ...
```

**Example 7: Initialize Task Progress (manual only)**
```
User: "create task progress for PARA System section with DriveSync details"
→ Run: bun run NotionSync.ts init-task-progress \
       --page "Yasser - January 2026" \
       --section "PARA System" \
       -r "Workflow: ~/.claude/skills/Organizer/Workflows/DriveSync.md" \
       -r "Tool: ~/.claude/skills/Organizer/Tools/drive_para_organizer.py" \
       -o "DriveSync organizes Google Drive using PARA methodology." \
       --trigger "organize my drive" --trigger "sync my drive"
→ Return: "✅ INITIALIZED: Section PARA System with Ressources, Overview, Trigger phrases"
```

**Example 8: Update task progress (manual only)**
```
User: "update TAO Minivault - Nextra migration done, everything validated"
→ Run: bun run NotionSync.ts update-progress \
       --page "Yasser - January 2026" \
       --section "TAO Minivault" \
       -u "Nextra migration completed" \
       -u "All data validated ✓"
→ Return: "✅ Updated: Yasser - January 2026 (Section: TAO Minivault)"
```

Note: Always write updates in English, even if user requests in another language.

---

## Configuration

**Token Location:** `~/.claude/skills/Organizer/Tools/.env`

```env
NOTION_TOKEN=ntn_xxxxx
```

**Integration:** Obsidian_Vault bot

---

## Notes

- **ALWAYS write in English when adding content to Notion** (no exceptions)
- Pages are created with basic paragraph content
- For complex formatting, create page then edit in Notion
- Databases must be shared with the integration to be accessible
- Search covers both pages and databases
