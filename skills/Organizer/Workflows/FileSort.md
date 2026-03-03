# FileSort Workflow

Organize files from Downloads, Desktop, Documents into a structured week/day hierarchy.

---

## Trigger Phrases

- "organize my files"
- "sort my downloads"
- "clean my desktop"
- "classe les documents de cette semaine"
- "organize files from last week"

---

## Steps

### 1. Interpret Time Expression

Convert user's natural language to concrete dates:

| User says | From | To |
|-----------|------|-----|
| "cette semaine" | Monday of current week | Sunday of current week |
| "semaine dernière" | Monday of last week | Sunday of last week |
| "les 7 derniers jours" | Today - 7 days | Today |
| "depuis lundi" | Last Monday | Today |
| "janvier" | 2026-01-01 | 2026-01-31 |

**Week = Monday to Sunday (ISO standard)**

### 2. Determine Source Directories

Default sources if not specified:
- `~/Downloads`
- `~/Desktop`

User can specify: "organize only my downloads" → `~/Downloads` only

### 3. Confirm with User (Optional)

For large operations, preview first:
```bash
bun run ~/.claude/skills/Organizer/Tools/FileSort.ts \
  --from <FROM_DATE> \
  --to <TO_DATE> \
  --sources ~/Downloads,~/Desktop \
  --dest ~/Documents \
  --dry-run
```

### 4. Execute

```bash
bun run ~/.claude/skills/Organizer/Tools/FileSort.ts \
  --from <FROM_DATE> \
  --to <TO_DATE> \
  --sources ~/Downloads,~/Desktop \
  --dest ~/Documents
```

### 5. Report Results

Tell user:
- How many files were moved
- Where they were organized (which weeks/days)
- Any errors encountered

---

## Output Structure

```
~/Documents/
├── 2026-W03/
│   ├── 2026-01-13/
│   │   ├── document.pdf
│   │   └── image.png
│   ├── 2026-01-14/
│   │   └── notes.txt
│   └── 2026-01-15/
│       └── video.mp4
└── 2026-W04/
    └── 2026-01-20/
        └── report.docx
```

---

## Examples

**Example 1: Cette semaine**
```
User: "organise mes fichiers de cette semaine"
→ Calculate: from=2026-01-13 to=2026-01-19
→ Execute FileSort.ts with these dates
→ Report: "12 fichiers organisés dans Documents/2026-W03/"
```

**Example 2: Semaine dernière + cette semaine**
```
User: "classe les documents de la semaine dernière et cette semaine"
→ Calculate: from=2026-01-06 to=2026-01-19
→ Execute FileSort.ts
→ Report results
```

**Example 3: Dry run**
```
User: "montre moi ce qui serait organisé ce mois-ci"
→ Execute with --dry-run
→ Show preview without moving
```
