# DriveSync Workflow

Organize Google Drive using the PARA methodology (Projects, Areas, Resources, Archives).

**Two modes:**
- **Own files**: Move files from root to PARA folders
- **Shared files**: Create shortcuts to shared files in PARA folders

---

## Trigger Phrases

- "sync my drive"
- "organize google drive"
- "organise mon drive"
- "PARA organization"
- "clean up drive"
- "organize shared files"
- "create shortcuts for shared files"

---

## Prerequisites

- Python venv with dependencies installed
- Google OAuth credentials configured (`credentials.json`, `token.json`)

**First-time setup:**
```bash
cd ~/.claude/skills/Organizer/Tools
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## Steps

### 1. Export Drive Contents

Scan Google Drive root and generate enriched metadata file.

```bash
cd ~/.claude/skills/Organizer/Tools
source venv/bin/activate
python3 drive_para_organizer.py export
```

**Output:** `files_to_classify.json`

### 2. Classify Items (Semi-Auto)

Read the exported file and classify each item into PARA categories:

| Category | Description | Examples |
|----------|-------------|----------|
| **1-Projects** | Active work with deadlines | Q3 Analysis, Website Redesign |
| **2-Areas** | Ongoing responsibilities | Finance, Health, Admin |
| **3-Resources** | Reference materials | Books, Templates, Docs |
| **4-Archives** | Inactive/completed items | Old projects, Outdated docs |

**Classification Rules:**
- Starred files → likely active (Projects/Areas)
- Old + Inactive + Not viewed → Archives
- Financial content (invoices, statements) → Areas
- Learning materials (books, guides) → Resources
- Related loose files → Group into new folder

**Generate `classification.json`:**
```json
{
  "classifications": [
    {"id": "...", "name": "...", "type": "folder", "category": "1-Projects", "reason": "..."},
    {"group": "New Folder Name", "category": "2-Areas", "files": ["id1", "id2"], "reason": "..."}
  ]
}
```

### 3. Show Overview for Approval

Present a summary table to user:

```
PARA Classification Overview
============================

1-Projects (3 items):
  📁 Q4 Planning
  📁 Website Redesign
  📄 Project Brief.pdf

2-Areas (5 items):
  📁 Finance
  📁 Admin
  ...

3-Resources (12 items):
  ...

4-Archives (8 items):
  ...

Total: 28 items to organize
```

**Ask user:** "This is the proposed organization. Proceed? (yes/no/adjust)"

### 4. Execute Import

After user approval:

```bash
cd ~/.claude/skills/Organizer/Tools
source venv/bin/activate
python3 drive_para_organizer.py import
```

### 5. Report Results

Show:
- Number of items moved per category
- Any groups created
- Errors encountered

---

## PARA Categories Reference

| Folder | When to Use |
|--------|-------------|
| **1-Projects** | Has a deadline, active work, clear deliverable |
| **2-Areas** | No deadline, ongoing responsibility (finance, health, career) |
| **3-Resources** | Reference only, learning material, templates |
| **4-Archives** | Completed, inactive >1 year, outdated |

---

## Examples

**Example 1: Full sync**
```
User: "organize my google drive"
→ Export Drive contents
→ Classify 45 items into PARA
→ Show overview: "12 Projects, 8 Areas, 15 Resources, 10 Archives"
→ User approves
→ Execute import
→ Report: "45 items organized successfully"
```

**Example 2: User adjustment**
```
User: "sync my drive"
→ Export and classify
→ Show overview
→ User: "Move 'Tax 2025' from Resources to Areas"
→ Adjust classification.json
→ User approves
→ Execute import
```

---

## Files

| File | Location | Purpose |
|------|----------|---------|
| `drive_para_organizer.py` | `Tools/` | Main script |
| `requirements.txt` | `Tools/` | Python dependencies |
| `credentials.json` | `Tools/` | Google OAuth credentials |
| `token.json` | `Tools/` | OAuth token (auto-generated) |
| `files_to_classify.json` | `Tools/` | Export output (generated) |
| `classification.json` | `Tools/` | Classification input (generated) |
| `move_history.json` | `Tools/` | Move log for restore |
| `shared_files_organizer.py` | `Tools/` | Shared files shortcuts |
| `shared_files_to_classify.json` | `Tools/` | Shared files export |
| `shared_classification.json` | `Tools/` | Shared files classification |

---

## Mode: Shared Files (Shortcuts)

Create shortcuts to "Shared with me" files in your PARA structure.

### Steps for Shared Files

#### 1. List Shared Files

```bash
cd ~/.claude/skills/Organizer/Tools
source venv/bin/activate
python3 shared_files_organizer.py list 10
```

#### 2. Export for Classification

```bash
python3 shared_files_organizer.py export 50
```

**Output:** `shared_files_to_classify.json`

#### 3. Classify (Semi-Auto)

Read the export and classify each shared file:

```json
{
  "classifications": [
    {"id": "...", "name": "Present Agent", "type": "folder", "category": "1-Projects", "reason": "Active collaboration"},
    {"id": "...", "name": "API E-commerce", "type": "file", "category": "3-Resources", "reason": "Reference doc"}
  ]
}
```

Save as `shared_classification.json`

#### 4. Show Overview for Approval

Present summary to user and ask for confirmation.

#### 5. Create Shortcuts

```bash
python3 shared_files_organizer.py import
```

**Result:** Shortcuts created in PARA folders pointing to original shared files.

---

## Examples (Shared Files)

**Example: Organize shared files**
```
User: "organize my shared files"
→ List shared files (20 items)
→ Classify into PARA
→ Show overview: "5 Projects, 3 Areas, 10 Resources, 2 Archives"
→ User approves
→ Create 20 shortcuts
→ Report: "20 shortcuts created successfully"
```
