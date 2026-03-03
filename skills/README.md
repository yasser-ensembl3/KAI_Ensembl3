# Kai - Personal AI Assistant Skills

Kai is a personalized AI assistant built on Claude Code with specialized skills for different domains.

## Quick Start

### Prerequisites

- [Claude Code](https://claude.ai/code) installed (`npm install -g @anthropic-ai/claude-code`)
- Node.js 18+
- Git

### Installation

1. **Clone this repository into your Claude config:**

```bash
cd ~/.claude
git clone git@github.com:yasser-ensembl3/KAI_Ensembl3.git skills
```

2. **Restart Claude Code** to load the skills.

That's it! The skills will be automatically available in all your Claude Code sessions.

---

## Available Skills

| Skill | Description | Trigger Keywords |
|-------|-------------|------------------|
| **CORE** | Identity, preferences, response format | Auto-loads at session start |
| **NotionManager** | Manage Notion databases (tasks, orders, metrics) | add task, list orders, project status |
| **Coding** | Technical work, debugging, development | code, debug, implement, build |
| **Research** | Information gathering, learning | research, find, investigate, learn |
| **Writing** | Content creation, editing | write, draft, content, article |
| **Strategy** | Goals, planning, reviews | plan, goals, strategy, review |
| **Coaching** | Personal growth, getting unstuck | stuck, blocked, help me, motivation |
| **Organizer** | File organization, admin tasks | organize, manage, schedule |
| **Agents** | Custom agent creation | custom agents, spin up |
| **Browser** | Web automation, screenshots | browser, screenshot, navigate |

---

## NotionManager Setup (MCP Server)

The NotionManager skill requires an MCP server to interact with Notion databases.

### Quick Install (Recommended)

Database IDs are pre-configured. You only need your Notion token.

```bash
# Run the install script
~/.claude/skills/NotionManager/install.sh
```

The script will:
1. Ask for your Notion token
2. Install the MCP server
3. Configure everything automatically

### Get Your Notion Token

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Create a new integration (or use existing one)
3. Copy the **Internal Integration Token** (starts with `ntn_`)
4. **Important**: Share the team databases with your integration

### Verify Installation

```bash
claude mcp list
# Should show: minivault: ... - ✓ Connected
```

### Test It

Start Claude Code and try:
- "Show me the project status"
- "List all tasks"
- "Create a task for marketing review"

---

### Manual Install (Advanced)

If you prefer manual installation:

```bash
# 1. Copy MCP server
mkdir -p ~/.claude/mcp-servers/minivault
cp -r ~/.claude/skills/NotionManager/mcp-server/* ~/.claude/mcp-servers/minivault/
cd ~/.claude/mcp-servers/minivault
npm install && npm run build

# 2. Configure (database IDs are pre-set in install.sh - copy them)
claude mcp add minivault --scope user \
  --env NOTION_TOKEN=ntn_your_token \
  --env NOTION_DB_TASKS=29d58fe731b1812e964bd1817a08e968 \
  ... (see install.sh for all IDs)
  -- node ~/.claude/mcp-servers/minivault/dist/index.js
```

---

## Available MCP Tools

Once configured, these tools are available:

### Tasks
- `list_tasks` - List tasks (filter by status)
- `create_task` - Create a new task
- `update_task` - Update a task
- `delete_task` - Delete a task

### Orders
- `list_orders` - List orders (filter by fulfillment/payment)
- `update_order` - Update order status

### Metrics & Goals
- `list_metrics` / `create_metric` - Track input actions
- `list_goals` / `create_goal` - Track output results

### Other
- `list_essentials` - List project essentials
- `list_documents` - List documentation links
- `list_feedback` - List user feedback
- `get_project_status` - Complete project overview

---

## Skill Structure

Each skill follows this structure:

```
SkillName/
├── SKILL.md          # Main skill file (required)
├── templates/        # Optional templates
└── examples/         # Optional examples
```

The `SKILL.md` file must have a YAML frontmatter:

```yaml
---
name: SkillName
description: When to use this skill. USE WHEN keyword1, keyword2.
---

# Skill Content
Instructions, workflows, examples...
```

---

## Creating Custom Skills

Use the `CreateSkill` skill or manually:

1. Create a folder in `~/.claude/skills/YourSkillName/`
2. Add a `SKILL.md` with frontmatter
3. Restart Claude Code

---

## License

Private repository - internal use only.
