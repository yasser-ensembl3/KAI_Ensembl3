---
name: NotionManager
description: Manage Notion databases for MiniVault projects. USE WHEN user wants to add, update, delete, or list tasks, orders, metrics, goals, or other project data.
---

# NotionManager - Notion Database Management

This skill uses the MiniVault MCP server to interact with Notion databases.

## Available Tools (via MCP)

### Tasks
| Tool | Description |
|------|-------------|
| `mcp__minivault__list_tasks` | List tasks (filter by status: 'To Do', 'In Progress', 'Review', 'Done', 'all') |
| `mcp__minivault__create_task` | Create a new task |
| `mcp__minivault__update_task` | Update task by pageId |
| `mcp__minivault__delete_task` | Delete (archive) a task |

### Recurring Tasks
| Tool | Description |
|------|-------------|
| `mcp__minivault__list_recurring_tasks` | List recurring tasks (filter by frequency) |
| `mcp__minivault__create_recurring_task` | Create a recurring task |
| `mcp__minivault__update_recurring_task` | Update a recurring task |

### Orders
| Tool | Description |
|------|-------------|
| `mcp__minivault__list_orders` | List orders (filter by fulfillment/payment status) |
| `mcp__minivault__update_order` | Update order status |

### Metrics & Goals
| Tool | Description |
|------|-------------|
| `mcp__minivault__list_metrics` | List input metrics (actions taken) |
| `mcp__minivault__create_metric` | Add a metric entry |
| `mcp__minivault__list_goals` | List output goals (results achieved) |
| `mcp__minivault__create_goal` | Add a goal entry |

### Essentials & Documents
| Tool | Description |
|------|-------------|
| `mcp__minivault__list_essentials` | List tools, milestones, resources |
| `mcp__minivault__create_essential` | Create an essential item |
| `mcp__minivault__update_essential` | Update an essential |
| `mcp__minivault__delete_essential` | Delete an essential |
| `mcp__minivault__list_documents` | List document links |
| `mcp__minivault__create_document` | Add a document/link |
| `mcp__minivault__delete_document` | Delete a document |

### Feedback
| Tool | Description |
|------|-------------|
| `mcp__minivault__list_feedback` | List user feedback |
| `mcp__minivault__create_feedback` | Add feedback |

### Export
| Tool | Description |
|------|-------------|
| `mcp__minivault__page_to_markdown` | Export a Notion page to Markdown format |

### Overview
| Tool | Description |
|------|-------------|
| `mcp__minivault__get_project_status` | Get complete project overview |
| `mcp__minivault__notion_query` | Raw query on any database |
| `mcp__minivault__notion_update_page` | Update any page directly |
| `mcp__minivault__notion_create_page` | Create page in any database |

---

## Common Workflows

### /tasks - Manage Tasks
```
User: "Montre-moi les tâches à faire"
→ mcp__minivault__list_tasks(status: "To Do")

User: "Crée une tâche pour faire le marketing"
→ mcp__minivault__create_task(title: "Faire le marketing", priority: "High")

User: "Marque la tâche X comme terminée"
→ mcp__minivault__update_task(pageId: "xxx", status: "Done")
```

### /orders - Manage Orders
```
User: "Quelles commandes ne sont pas livrées ?"
→ mcp__minivault__list_orders(fulfillment: "Unfulfilled")

User: "Marque la commande X comme livrée"
→ mcp__minivault__update_order(pageId: "xxx", fulfillment: "Fulfilled")
```

### /status - Project Overview
```
User: "Donne-moi le status du projet"
→ mcp__minivault__get_project_status()
```

### /export - Export Page to Markdown
```
User: "Exporte cette page Notion en markdown"
→ mcp__minivault__page_to_markdown(pageId: "abc123")

User: "Exporte sans les métadonnées"
→ mcp__minivault__page_to_markdown(pageId: "abc123", includeMetadata: false)
```

### /metrics - Track Progress
```
User: "Ajoute 5 posts Instagram aujourd'hui"
→ mcp__minivault__create_metric(type: "instagram posts", value: 5)

User: "On a fait 2 ventes"
→ mcp__minivault__create_goal(type: "sales", value: 2)
```

---

## Field Reference

### Task Fields
- `title` (required): Task title
- `description`: Task description
- `assignee`: Person assigned
- `status`: 'To Do', 'In Progress', 'Review', 'Done'
- `priority`: 'Low', 'Medium', 'High', 'Urgent'
- `dueDate`: YYYY-MM-DD format
- `tags`: Comma-separated tags

### Order Fields
- `fulfillment`: 'Fulfilled', 'Unfulfilled'
- `payment`: 'Paid', 'Pending', 'Refunded'

### Metric/Goal Fields
- `type` (required): Metric type (e.g., "instagram posts", "sales")
- `value` (required): Numeric value
- `date`: YYYY-MM-DD (defaults to today)

### Essential Fields
- `title` (required): Item title
- `type`: 'Tool', 'Milestone', 'Strategy', 'Resource', 'Partnership', 'Achievement'
- `priority`: 'Critical', 'High', 'Medium'
- `description`: Item description
- `url`: Related URL

---

## Examples

**List all tasks:**
```
mcp__minivault__list_tasks(status: "all")
```

**Create a high-priority task:**
```
mcp__minivault__create_task(
  title: "Préparer la vidéo marketing",
  priority: "High",
  dueDate: "2026-02-15",
  assignee: "Yasser"
)
```

**Update an order:**
```
mcp__minivault__update_order(
  pageId: "abc123",
  fulfillment: "Fulfilled",
  payment: "Paid"
)
```

**Get project status:**
```
mcp__minivault__get_project_status()
```
