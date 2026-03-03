---
name: Writing
description: Content creation, editing, and publishing. USE WHEN write, draft, content, article, blog, edit text, publish, OR creative writing.
---

# Writing - Content Creation Skill

**Auto-routes when user mentions writing, drafting, content creation, or editing.**

---

## Tools

| Tool | Purpose | Command |
|------|---------|---------|
| **Writer.ts** | Spawn a Writer agent | `bun run $PAI_DIR/skills/Writing/Tools/Writer.ts --task "<task>"` |

---

## Writer Agent

**Traits:** `creative, enthusiastic, synthesizing`

The Writer agent handles content creation:
- Write first drafts
- Edit and refine content
- Structure long-form content
- Suggest headlines and hooks
- Review content for clarity and impact

### Principles

- **Direct, not academic** - Clear and concise
- **Story-driven** - Personal perspective
- **No filler** - Every word counts
- **Ship > Perfect** - Don't over-polish

---

## Workflow Routing

| Workflow | Trigger | Action |
|----------|---------|--------|
| **Draft** | "write", "draft", "create content" | Spawn Writer agent |
| **Edit** | "edit", "refine", "improve text" | Spawn Writer with edit focus |
| **Review** | "review my writing" | Quality check with Bar Raiser |

---

## Examples

**Example 1: Write a blog post**
```
User: "Write a blog post about productivity"
-> Spawns Writer agent with creative + enthusiastic + synthesizing traits
-> Returns structured draft
```

**Example 2: Edit existing content**
```
User: "Edit this article to be more concise"
-> Spawns Writer with meticulous trait added
-> Returns refined content
```

**Example 3: Create a draft outline**
```
User: "Draft an outline for my presentation"
-> Spawns Writer agent
-> Returns structured outline with key points
```

---

## Handoff Triggers

| Situation | Hand to | Why |
|-----------|---------|-----|
| Need research before writing | Research/ | Get facts first |
| Need content strategy | Strategy/ | Plan before write |
| Quality review needed | Agents/BarRaiser | Final check |
