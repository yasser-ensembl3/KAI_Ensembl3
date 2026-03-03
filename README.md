# Kai — Claude Code Configuration Backup

Complete backup of Kai's Claude Code setup: skills, hooks, tools, MCP servers, settings, and project memory. This is the full configuration that lives in `~/.claude/` on the Mac.

**Assistant name**: Kai
**User**: Yasser
**Runtime**: Claude Code (Anthropic CLI) with Bun for hooks/tools

---

## What's Included

```
Kai-Claude-Code-Config/
├── skills/                    # 12 skill modules (the AI's capabilities)
├── hooks/                     # 8 lifecycle hooks + 2 shared libs
├── tools/                     # 3 global CLI tools
├── mcp-servers/               # 2 MCP servers (Notion + Shopify)
├── project-memory/            # Per-project persistent memory files
├── settings.json              # Global settings (hooks config + flags)
├── settings.local.json        # Permission allowlist
└── env-config                 # Environment variables (PAI_DIR, name, timezone)
```

---

## Skills (12 modules)

Each skill lives in `skills/<SkillName>/` with a mandatory `SKILL.md` (YAML frontmatter + markdown body). Skills are auto-discovered by Claude Code.

| Skill | Description | Key Files |
|-------|-------------|-----------|
| **CORE** | Identity, preferences, response format. Auto-loads at session start. | `SKILL.md`, `SkillSystem.md`, `Workflows/UpdateDocumentation.md` |
| **Agents** | Dynamic agent composition — personality traits, parallel agents, BarRaiser quality review | `SKILL.md`, `AgentPersonalities.md`, `Data/Traits.yaml`, `Templates/DynamicAgent.hbs`, Tools: `AgentFactory.ts`, `BarRaiser.ts`, Workflows: `CreateCustomAgent.md`, `ListTraits.md`, `SpawnParallelAgents.md` |
| **Browser** | Code-first browser automation with Bun + Puppeteer — screenshots, page verification, extraction | `SKILL.md`, `index.ts`, `Tools/Browse.ts`, 3 examples, 4 workflows, `package.json` |
| **Coaching** | Personal growth, breakthroughs, getting unstuck | `SKILL.md`, `Tools/Coach.ts` |
| **Coding** | Technical work, prototypes, debugging | `SKILL.md`, `Tools/Coder.ts` |
| **CreateSkill** | Skill creation and validation helper | `SKILL.md` |
| **NotionManager** | Manage Notion databases via MCP — tasks, orders, metrics, goals, essentials, feedback | `SKILL.md`, `install.sh`, `mcp-server/src/index.ts`, `scripts/notion-to-md.ts`, `mcp-server/export-page.ts` |
| **Organizer** | Multi-destination file organization — Drive, Obsidian, Notion, GitHub Issues | `SKILL.md`, Tools: `FileSort.ts`, `Operator.ts`, `ObsidianCapture.ts`, `NotionSync.ts`, `GitHubIssue.ts`, `drive_para_organizer.py`, `shared_files_organizer.py`, 5 workflows |
| **Prompting** | Meta-prompting with templates, standards, and Handlebars primitives | `SKILL.md`, `Standards.md`, `Templates/README.md`, 5 Handlebars primitives (Briefing, Gate, Roster, Structure, Voice), Tools: `RenderTemplate.ts`, `ValidateTemplate.ts` |
| **Research** | Knowledge synthesis, information gathering | `SKILL.md`, `Tools/Researcher.ts` |
| **Strategy** | Goals, planning, reviews, strategic direction | `SKILL.md`, `Tools/Planner.ts` |
| **Writing** | Content creation, editing, publishing | `SKILL.md`, `Tools/Writer.ts` |

### Skill Structure Convention

```
SkillName/            # TitleCase (PascalCase) required
├── SKILL.md          # Mandatory — YAML frontmatter with USE WHEN clause
├── Tools/            # TypeScript CLI tools
├── Workflows/        # Step-by-step execution guides (.md)
├── Templates/        # Handlebars/other templates
└── Data/             # Static data files (YAML, JSON)
```

---

## Hooks (8 lifecycle hooks)

All hooks run via Bun (`~/.bun/bin/bun run`). Configured in `settings.json`.

| Hook | Event | Purpose |
|------|-------|---------|
| `initialize-session.ts` | SessionStart | Initialize session state and environment |
| `load-core-context.ts` | SessionStart | Inject CORE skill context into Claude's conversation |
| `capture-all-events.ts` | ALL events | Captures every Claude Code hook event to JSONL logs |
| `update-tab-titles.ts` | UserPromptSubmit | Update terminal tab title with task context |
| `security-validator.ts` | PreToolUse | Validates commands and blocks dangerous operations |
| `stop-hook.ts` | Stop | Captures main agent work summaries and learnings |
| `subagent-stop-hook.ts` | SubagentStop | Routes subagent outputs to appropriate history directories |
| `capture-session-summary.ts` | SessionEnd | Creates session summary when Claude Code session ends |

### Hook Libraries

- `lib/metadata-extraction.ts` — shared metadata extraction utilities
- `lib/observability.ts` — shared observability/logging utilities

### Event Flow

```
SessionStart → initialize-session → load-core-context → capture-all-events
     ↓
UserPromptSubmit → update-tab-titles → capture-all-events
     ↓
PreToolUse → capture-all-events
     ↓
PostToolUse → capture-all-events
     ↓
Stop → stop-hook → capture-all-events
SubagentStop → subagent-stop-hook → capture-all-events
     ↓
SessionEnd → capture-session-summary → capture-all-events
```

---

## Tools (3 global tools)

| Tool | Purpose |
|------|---------|
| `GenerateSkillIndex.ts` | Parses all SKILL.md files and builds a searchable index |
| `PaiArchitecture.ts` | Scans the PAI installation and generates Architecture.md |
| `SkillSearch.ts` | Search the skill index to discover capabilities dynamically |

---

## MCP Servers (2 servers)

### minivault

Notion database integration for MiniVault project management. TypeScript + `@modelcontextprotocol/sdk`.

**Tools provided**: `list_tasks`, `create_task`, `update_task`, `delete_task`, `list_orders`, `update_order`, `list_metrics`, `create_metric`, `list_goals`, `create_goal`, `list_essentials`, `create_essential`, `update_essential`, `delete_essential`, `list_documents`, `create_document`, `delete_document`, `list_feedback`, `create_feedback`, `list_recurring_tasks`, `create_recurring_task`, `update_recurring_task`, `get_project_status`, `notion_query`, `notion_update_page`, `notion_create_page`

**Databases**: tasks, orders, essentials, documents, metrics, goals, feedback, recurringTasks, sales, webAnalytics, assumptions

### shopify

Shopify store integration. TypeScript + `@modelcontextprotocol/sdk`.

**Tools provided**: `get_shop_info`, `list_orders`, `get_order`, `list_products`, `get_product`, `list_customers`, `get_inventory`, `list_locations`, `get_analytics_summary`

---

## Settings

### `settings.json` — Global Configuration

- **Hooks**: All 7 lifecycle events configured (SessionStart, PreToolUse, PostToolUse, UserPromptSubmit, Stop, SubagentStop, SessionEnd)
- **Always Thinking**: enabled (`alwaysThinkingEnabled: true`)

### `settings.local.json` — Permissions

Allowlisted commands include: `git`, `ls`, `cat`, `find`, `bun`, `npm`, `python3`, `gh` (GitHub CLI), `curl`, `open`, `tree`, `chmod`, `brew`, `wc`, various project-specific commands. Skill `CORE` and `Organizer` are always allowed.

### `env-config` — Environment

```
PAI_DIR="$HOME/.claude"
DA="Kai"
TIME_ZONE="Europe/Paris"
```

---

## Project Memory

Persistent memory files from `~/.claude/projects/*/memory/`:

| Project | Files |
|---------|-------|
| Quarterly-results | `MEMORY.md` |
| Template-book-manager | `MEMORY.md`, `architecture.md` |

---

## Restoration

To restore this configuration on a new machine:

```bash
# 1. Install Claude Code
npm install -g @anthropic-ai/claude-code

# 2. Install Bun (required for hooks)
curl -fsSL https://bun.sh/install | bash

# 3. Copy configuration
cp -r skills/ ~/.claude/skills/
cp -r hooks/ ~/.claude/hooks/
cp -r tools/ ~/.claude/tools/
cp settings.json ~/.claude/settings.json
cp settings.local.json ~/.claude/settings.local.json
cp env-config ~/.claude/.env

# 4. Install MCP servers
cp -r mcp-servers/ ~/.claude/mcp-servers/
cd ~/.claude/mcp-servers/minivault && npm install && npm run build
cd ~/.claude/mcp-servers/shopify && npm install && npm run build

# 5. Configure MCP servers with your tokens
claude mcp add minivault --scope user \
  --env NOTION_TOKEN=your_token \
  -- node ~/.claude/mcp-servers/minivault/dist/index.js

# 6. Install Browser skill dependencies
cd ~/.claude/skills/Browser && bun install

# 7. Install Organizer Python dependencies
cd ~/.claude/skills/Organizer/Tools && pip install -r requirements.txt

# 8. Restart Claude Code
```

---

## Excluded from Backup

These directories contain transient/sensitive data and are NOT backed up:

| Directory | Reason |
|-----------|--------|
| `~/.claude/debug/` | Debug logs (300+ session dirs) |
| `~/.claude/history/` | Command history |
| `~/.claude/history.jsonl` | Full conversation history |
| `~/.claude/session-env/` | Session environment snapshots |
| `~/.claude/shell-snapshots/` | Shell state snapshots |
| `~/.claude/todos/` | Session-specific todo lists |
| `~/.claude/plans/` | Session-specific plans |
| `~/.claude/paste-cache/` | Clipboard paste cache |
| `~/.claude/file-history/` | File edit history |
| `~/.claude/cache/` | Cache |
| `~/.claude/plugins/` | Plugin state |
| `~/.claude/statsig/` | Analytics |
| `~/.claude/telemetry/` | Telemetry |
| `~/.claude/backups/` | Auto-backups of .claude.json |
| `~/.claude/agent-sessions.json` | Active agent sessions |
| `~/.claude/browser-profiles/` | Browser automation profiles |
| `~/.claude/downloads/` | Downloaded files |
| `skills/Organizer/Tools/venv/` | Python virtual environment |
| `skills/Browser/node_modules/` | Node dependencies |
| `skills/Organizer/Tools/token.json` | OAuth token (sensitive) |
| `skills/Organizer/Tools/credentials.json` | Google credentials (sensitive) |
| `skills/Organizer/Tools/.env` | Environment secrets |
