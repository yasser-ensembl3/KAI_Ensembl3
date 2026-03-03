#!/usr/bin/env bun

/**
 * NotionSync - Notion API Integration Tool
 *
 * Create pages, databases, and sync content with Notion.
 *
 * Usage:
 *   bun run NotionSync.ts list-databases
 *   bun run NotionSync.ts create-page --database <id> --title "Page Title" --content "Content"
 *   bun run NotionSync.ts search --query "search term"
 */

import { parseArgs } from "util";

// Load token from .env
const envPath = `${import.meta.dir}/.env`;
const envFile = await Bun.file(envPath).text().catch(() => "");
const NOTION_TOKEN = envFile.match(/NOTION_TOKEN=(.+)/)?.[1]?.trim()
  || process.env.NOTION_TOKEN;

if (!NOTION_TOKEN) {
  console.error("Error: NOTION_TOKEN not found in .env or environment");
  process.exit(1);
}

const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

// API Helper
async function notionRequest(endpoint: string, method = "GET", body?: object) {
  const response = await fetch(`${NOTION_API}${endpoint}`, {
    method,
    headers: {
      "Authorization": `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Notion API Error: ${error.message || response.statusText}`);
  }

  return response.json();
}

// Commands
async function listDatabases() {
  const result = await notionRequest("/search", "POST", {
    filter: { property: "object", value: "database" },
    page_size: 100,
  });

  console.log("\n📚 NOTION DATABASES\n");

  if (result.results.length === 0) {
    console.log("No databases found. Make sure to share databases with your integration.");
    return;
  }

  for (const db of result.results) {
    const title = db.title?.[0]?.plain_text || "Untitled";
    console.log(`  ${title}`);
    console.log(`  ID: ${db.id}`);
    console.log(`  URL: ${db.url}`);
    console.log("");
  }

  console.log(`Total: ${result.results.length} databases`);
}

async function listPages(limit = 10) {
  const result = await notionRequest("/search", "POST", {
    filter: { property: "object", value: "page" },
    page_size: limit,
    sort: { direction: "descending", timestamp: "last_edited_time" },
  });

  console.log("\n📄 RECENT NOTION PAGES\n");

  for (const page of result.results) {
    const title = page.properties?.title?.title?.[0]?.plain_text
      || page.properties?.Name?.title?.[0]?.plain_text
      || "Untitled";
    const lastEdited = new Date(page.last_edited_time).toLocaleDateString();
    console.log(`  ${title}`);
    console.log(`  ID: ${page.id} | Edited: ${lastEdited}`);
    console.log("");
  }

  console.log(`Showing: ${result.results.length} pages`);
}

async function search(query: string) {
  const result = await notionRequest("/search", "POST", {
    query,
    page_size: 20,
  });

  console.log(`\n🔍 SEARCH RESULTS FOR "${query}"\n`);

  if (result.results.length === 0) {
    console.log("No results found.");
    return;
  }

  for (const item of result.results) {
    const type = item.object;
    let title = "Untitled";

    if (type === "database") {
      title = item.title?.[0]?.plain_text || "Untitled Database";
    } else if (type === "page") {
      title = item.properties?.title?.title?.[0]?.plain_text
        || item.properties?.Name?.title?.[0]?.plain_text
        || "Untitled Page";
    }

    console.log(`  [${type.toUpperCase()}] ${title}`);
    console.log(`  ID: ${item.id}`);
    console.log("");
  }

  console.log(`Found: ${result.results.length} results`);
}

async function createPage(databaseId: string, title: string, content: string) {
  // First, get database schema to understand properties
  const db = await notionRequest(`/databases/${databaseId}`);

  // Find the title property name
  let titleProperty = "Name";
  for (const [key, prop] of Object.entries(db.properties) as [string, any][]) {
    if (prop.type === "title") {
      titleProperty = key;
      break;
    }
  }

  const body = {
    parent: { database_id: databaseId },
    properties: {
      [titleProperty]: {
        title: [{ text: { content: title } }],
      },
    },
    children: content ? [
      {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content } }],
        },
      },
    ] : [],
  };

  const result = await notionRequest("/pages", "POST", body);

  console.log("\n✅ PAGE CREATED\n");
  console.log(`  Title: ${title}`);
  console.log(`  ID: ${result.id}`);
  console.log(`  URL: ${result.url}`);
}

async function createStandalonePage(title: string, content: string, parentPageId?: string) {
  const body: any = {
    parent: parentPageId
      ? { page_id: parentPageId }
      : { type: "workspace", workspace: true },
    properties: {
      title: {
        title: [{ text: { content: title } }],
      },
    },
    children: content ? [
      {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content } }],
        },
      },
    ] : [],
  };

  const result = await notionRequest("/pages", "POST", body);

  console.log("\n✅ PAGE CREATED\n");
  console.log(`  Title: ${title}`);
  console.log(`  ID: ${result.id}`);
  console.log(`  URL: ${result.url}`);
}

async function getPage(pageId: string) {
  const page = await notionRequest(`/pages/${pageId}`);
  const blocks = await notionRequest(`/blocks/${pageId}/children`);

  console.log("\n📄 PAGE DETAILS\n");

  // Extract title
  let title = "Untitled";
  for (const [key, prop] of Object.entries(page.properties) as [string, any][]) {
    if (prop.type === "title" && prop.title?.[0]?.plain_text) {
      title = prop.title[0].plain_text;
      break;
    }
  }

  console.log(`  Title: ${title}`);
  console.log(`  ID: ${page.id}`);
  console.log(`  URL: ${page.url}`);
  console.log(`  Created: ${new Date(page.created_time).toLocaleString()}`);
  console.log(`  Edited: ${new Date(page.last_edited_time).toLocaleString()}`);

  if (blocks.results.length > 0) {
    console.log("\n  Content:");
    for (const block of blocks.results) {
      if (block.type === "paragraph") {
        const text = block.paragraph.rich_text.map((t: any) => t.plain_text).join("");
        if (text) console.log(`    ${text}`);
      } else if (block.type === "heading_1") {
        const text = block.heading_1.rich_text.map((t: any) => t.plain_text).join("");
        console.log(`\n    # ${text}`);
      } else if (block.type === "heading_2") {
        const text = block.heading_2.rich_text.map((t: any) => t.plain_text).join("");
        console.log(`\n    ## ${text}`);
      } else if (block.type === "bulleted_list_item") {
        const text = block.bulleted_list_item.rich_text.map((t: any) => t.plain_text).join("");
        console.log(`    • ${text}`);
      }
    }
  }
}

async function testConnection() {
  try {
    const result = await notionRequest("/users/me");
    console.log("\n✅ NOTION CONNECTION SUCCESSFUL\n");
    console.log(`  Bot: ${result.name}`);
    console.log(`  Type: ${result.type}`);
    console.log(`  ID: ${result.id}`);
    return true;
  } catch (error) {
    console.error("\n❌ NOTION CONNECTION FAILED\n");
    console.error(`  ${error}`);
    return false;
  }
}

// Recursively fetch all blocks including nested children
async function getAllBlocks(blockId: string): Promise<any[]> {
  const blocks: any[] = [];
  let cursor: string | undefined;

  do {
    const endpoint = cursor
      ? `/blocks/${blockId}/children?start_cursor=${cursor}`
      : `/blocks/${blockId}/children`;
    const result = await notionRequest(endpoint);

    for (const block of result.results) {
      blocks.push(block);
      // Recursively get children if block has_children
      if (block.has_children) {
        const children = await getAllBlocks(block.id);
        blocks.push(...children);
      }
    }

    cursor = result.has_more ? result.next_cursor : undefined;
  } while (cursor);

  return blocks;
}

// Extract text from rich_text array
function extractText(richText: any[]): string {
  return richText?.map((t: any) => t.plain_text).join("") || "";
}

// Helper to create bold paragraph block
function boldParagraph(text: string): object {
  return {
    object: "block",
    type: "paragraph",
    paragraph: {
      rich_text: [{ type: "text", text: { content: text }, annotations: { bold: true } }]
    }
  };
}

// Helper to create regular paragraph block
function paragraph(text: string): object {
  return {
    object: "block",
    type: "paragraph",
    paragraph: {
      rich_text: [{ type: "text", text: { content: text } }]
    }
  };
}

// Helper to create bullet point block
function bullet(text: string): object {
  return {
    object: "block",
    type: "bulleted_list_item",
    bulleted_list_item: {
      rich_text: [{ type: "text", text: { content: text } }]
    }
  };
}

// Task Progress structure interface
interface TaskProgressContent {
  resources?: { label: string; value: string }[];
  overview?: string;
  sections?: { title: string; bullets: string[] }[];
  triggers?: string[];
}

// List all sections in a page (for understanding page structure)
async function listSections(pageName: string) {
  const searchResult = await notionRequest("/search", "POST", {
    query: pageName,
    filter: { property: "object", value: "page" },
    page_size: 10,
  });

  if (searchResult.results.length === 0) {
    console.error(`\n❌ Page "${pageName}" not found in Notion`);
    return;
  }

  const page = searchResult.results.find((p: any) => {
    const title = p.properties?.title?.title?.[0]?.plain_text
      || p.properties?.Name?.title?.[0]?.plain_text
      || "";
    return title.toLowerCase().includes(pageName.toLowerCase());
  }) || searchResult.results[0];

  const pageTitle = page.properties?.title?.title?.[0]?.plain_text
    || page.properties?.Name?.title?.[0]?.plain_text
    || "Untitled";

  const blocks = await notionRequest(`/blocks/${page.id}/children?page_size=100`);

  console.log(`\n📄 SECTIONS IN: ${pageTitle}\n`);

  for (const block of blocks.results) {
    if (block.type === "heading_3" || block.type === "heading_2" || block.type === "heading_1") {
      const headingType = block.type as "heading_1" | "heading_2" | "heading_3";
      const text = extractText(block[headingType].rich_text);
      const level = block.type === "heading_1" ? "#" : block.type === "heading_2" ? "##" : "###";
      console.log(`  ${level} ${text}`);
      console.log(`     ID: ${block.id}`);
    } else if (block.type === "toggle") {
      const text = extractText(block.toggle.rich_text);
      if (text.toLowerCase().includes("task progress")) {
        console.log(`     └─ ✅ Task Progress (ID: ${block.id})`);
      }
    }
  }

  console.log(`\n  URL: ${page.url}`);
}

// Find or create Task Progress toggle for a section
async function findOrCreateTaskProgress(pageId: string, sectionName: string): Promise<{ toggleId: string; created: boolean } | null> {
  const blocks = await notionRequest(`/blocks/${pageId}/children?page_size=100`);

  let foundSection = false;
  let sectionHeadingId: string | null = null;
  let toggleId: string | null = null;

  for (const block of blocks.results) {
    // Look for heading that matches the section
    if (block.type === "heading_3" || block.type === "heading_2" || block.type === "heading_1") {
      const headingType = block.type as "heading_1" | "heading_2" | "heading_3";
      const text = extractText(block[headingType].rich_text);

      if (text.toLowerCase().includes(sectionName.toLowerCase())) {
        foundSection = true;
        sectionHeadingId = block.id;
      } else if (foundSection && text.match(/^\d+\./)) {
        // We've moved to the next numbered section, stop looking
        break;
      }
    }

    // Look for Task Progress toggle after finding the section
    if (foundSection && block.type === "toggle") {
      const text = extractText(block.toggle.rich_text);
      if (text.toLowerCase().includes("task progress")) {
        return { toggleId: block.id, created: false };
      }
    }
  }

  if (!sectionHeadingId) {
    console.error(`\n❌ Could not find section "${sectionName}" in page`);
    return null;
  }

  // Create the Task Progress toggle after the section heading
  const response = await fetch(`${NOTION_API}/blocks/${pageId}/children`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      children: [{
        object: "block",
        type: "toggle",
        toggle: {
          rich_text: [{
            type: "text",
            text: { content: "Task Progress" },
            annotations: { bold: true }
          }],
          children: []
        }
      }],
      after: sectionHeadingId
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error(`\n❌ Failed to create Task Progress toggle: ${error.message}`);
    return null;
  }

  const result = await response.json();
  return { toggleId: result.results[0].id, created: true };
}

// Initialize a Task Progress with full structure
async function initTaskProgress(pageName: string, section: string, content: TaskProgressContent) {
  // Search for the page
  const searchResult = await notionRequest("/search", "POST", {
    query: pageName,
    filter: { property: "object", value: "page" },
    page_size: 10,
  });

  if (searchResult.results.length === 0) {
    console.error(`\n❌ Page "${pageName}" not found in Notion`);
    return;
  }

  const page = searchResult.results.find((p: any) => {
    const title = p.properties?.title?.title?.[0]?.plain_text
      || p.properties?.Name?.title?.[0]?.plain_text
      || "";
    return title.toLowerCase().includes(pageName.toLowerCase());
  }) || searchResult.results[0];

  const pageTitle = page.properties?.title?.title?.[0]?.plain_text
    || page.properties?.Name?.title?.[0]?.plain_text
    || "Untitled";

  // Find or create the Task Progress toggle
  const result = await findOrCreateTaskProgress(page.id, section);
  if (!result) return;

  const { toggleId, created } = result;
  if (created) {
    console.log(`\n📝 Created new "Task Progress" toggle in section "${section}"`);
  }

  // Build the structured content
  const children: object[] = [];

  // Ressources section
  if (content.resources && content.resources.length > 0) {
    children.push(boldParagraph("Ressources"));
    for (const res of content.resources) {
      children.push(paragraph(`${res.label}: ${res.value}`));
    }
  }

  // Overview section
  if (content.overview) {
    children.push(boldParagraph("Overview"));
    children.push(paragraph(content.overview));
  }

  // Numbered sections
  if (content.sections && content.sections.length > 0) {
    for (const sec of content.sections) {
      children.push(boldParagraph(sec.title));
      for (const b of sec.bullets) {
        children.push(bullet(b));
      }
    }
  }

  // Trigger phrases
  if (content.triggers && content.triggers.length > 0) {
    children.push(boldParagraph("Trigger Phrases:"));
    children.push(bullet(content.triggers.map(t => `"${t}"`).join(", ")));
  }

  // Add content to the toggle
  const response = await fetch(`${NOTION_API}/blocks/${toggleId}/children`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ children }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error(`\n❌ Failed to initialize Task Progress: ${error.message}`);
    return;
  }

  console.log(`\n✅ INITIALIZED: ${pageTitle}`);
  console.log(`  Section: ${section}`);
  console.log(`  Structure created:`);
  if (content.resources) console.log(`    • Ressources (${content.resources.length} items)`);
  if (content.overview) console.log(`    • Overview`);
  if (content.sections) console.log(`    • ${content.sections.length} section(s)`);
  if (content.triggers) console.log(`    • Trigger phrases`);
  console.log(`\n  URL: ${page.url}`);
}

async function reviewTodos(pageName: string) {
  // Search for the page
  const searchResult = await notionRequest("/search", "POST", {
    query: pageName,
    filter: { property: "object", value: "page" },
    page_size: 10,
  });

  if (searchResult.results.length === 0) {
    console.error(`\n❌ Page "${pageName}" not found in Notion`);
    return;
  }

  // Find best match
  const page = searchResult.results.find((p: any) => {
    const title = p.properties?.title?.title?.[0]?.plain_text
      || p.properties?.Name?.title?.[0]?.plain_text
      || "";
    return title.toLowerCase().includes(pageName.toLowerCase());
  }) || searchResult.results[0];

  const pageTitle = page.properties?.title?.title?.[0]?.plain_text
    || page.properties?.Name?.title?.[0]?.plain_text
    || "Untitled";

  console.log(`\n📋 REVIEW: ${pageTitle}\n`);
  console.log(`  URL: ${page.url}\n`);

  // Get all blocks from the page
  const blocks = await getAllBlocks(page.id);

  // Extract to-do items
  const todos = blocks.filter((b: any) => b.type === "to_do");

  if (todos.length === 0) {
    console.log("  No to-do items found on this page.");
    return;
  }

  const completed = todos.filter((t: any) => t.to_do.checked);
  const pending = todos.filter((t: any) => !t.to_do.checked);

  // Progress bar
  const progress = Math.round((completed.length / todos.length) * 100);
  const barLength = 20;
  const filledLength = Math.round((progress / 100) * barLength);
  const bar = "█".repeat(filledLength) + "░".repeat(barLength - filledLength);

  console.log(`  Progress: [${bar}] ${progress}%`);
  console.log(`  Total: ${todos.length} | ✅ ${completed.length} done | ⏳ ${pending.length} remaining\n`);

  // Show completed tasks
  if (completed.length > 0) {
    console.log("  ✅ COMPLETED:");
    for (const todo of completed) {
      const text = extractText(todo.to_do.rich_text);
      console.log(`     ✓ ${text}`);
    }
    console.log("");
  }

  // Show pending tasks
  if (pending.length > 0) {
    console.log("  ⏳ REMAINING:");
    for (const todo of pending) {
      const text = extractText(todo.to_do.rich_text);
      console.log(`     ○ ${text}`);
    }
    console.log("");
  }

  // Summary
  console.log("  ─────────────────────────────────");
  if (pending.length === 0) {
    console.log("  🎉 All tasks completed!");
  } else if (completed.length === 0) {
    console.log(`  📌 ${pending.length} tasks to start`);
  } else {
    console.log(`  📌 Next: ${extractText(pending[0].to_do.rich_text)}`);
  }
}

async function updateToggleProgress(pageName: string, section: string, updates: string[]) {
  // Search for the page
  const searchResult = await notionRequest("/search", "POST", {
    query: pageName,
    filter: { property: "object", value: "page" },
    page_size: 10,
  });

  if (searchResult.results.length === 0) {
    console.error(`\n❌ Page "${pageName}" not found in Notion`);
    return;
  }

  const page = searchResult.results.find((p: any) => {
    const title = p.properties?.title?.title?.[0]?.plain_text
      || p.properties?.Name?.title?.[0]?.plain_text
      || "";
    return title.toLowerCase().includes(pageName.toLowerCase());
  }) || searchResult.results[0];

  const pageTitle = page.properties?.title?.title?.[0]?.plain_text
    || page.properties?.Name?.title?.[0]?.plain_text
    || "Untitled";

  // Find or create the Task Progress toggle
  const result = await findOrCreateTaskProgress(page.id, section);
  if (!result) return;

  const { toggleId, created } = result;
  if (created) {
    console.log(`\n📝 Created new "Task Progress" toggle in section "${section}"`);
  }

  // Build the update blocks with date header
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const children: object[] = [boldParagraph(`Update (${today})`)];

  for (const update of updates) {
    children.push(bullet(update));
  }

  // Append to the toggle
  const response = await fetch(`${NOTION_API}/blocks/${toggleId}/children`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ children }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error(`\n❌ Failed to update: ${error.message}`);
    return;
  }

  console.log(`\n✅ UPDATED: ${pageTitle}`);
  console.log(`  Section: ${section}`);
  console.log(`  Added ${updates.length} update(s):`);
  for (const update of updates) {
    console.log(`    • ${update}`);
  }
  console.log(`\n  URL: ${page.url}`);
}

// Main
async function main() {
  const { values, positionals } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      database: { type: "string", short: "d" },
      title: { type: "string", short: "t" },
      content: { type: "string", short: "c" },
      query: { type: "string", short: "q" },
      parent: { type: "string", short: "p" },
      limit: { type: "string", short: "l" },
      page: { type: "string" },
      section: { type: "string", short: "s" },
      update: { type: "string", short: "u", multiple: true },
      // For init-task-progress
      overview: { type: "string", short: "o" },
      resource: { type: "string", short: "r", multiple: true },
      trigger: { type: "string", multiple: true },
      json: { type: "string", short: "j" },
      help: { type: "boolean", short: "h" },
    },
    allowPositionals: true,
  });

  const command = positionals[0];

  if (values.help || !command) {
    console.log(`
NotionSync - Notion API Integration

USAGE:
  bun run NotionSync.ts <command> [options]

COMMANDS:
  test                    Test Notion connection
  list-databases          List all accessible databases
  list-pages              List recent pages
  list-sections           List sections in a page (shows headings + Task Progress toggles)
  search                  Search Notion
  get-page <id>           Get page details
  create-page             Create a new page in a database
  create-standalone       Create a standalone page
  review-todos            Review to-do progress on a page
  init-task-progress      Initialize a Task Progress with full structure
  update-progress         Add incremental updates to a Task Progress toggle

OPTIONS:
  -d, --database <id>     Database ID for create-page
  -t, --title <text>      Page title
  -c, --content <text>    Page content
  -q, --query <text>      Search query
  -p, --parent <id>       Parent page ID for standalone page
  -l, --limit <n>         Limit results (default: 10)
  -s, --section <name>    Section name for task progress commands
  -u, --update <text>     Update text (can be repeated)
  -o, --overview <text>   Overview text for init-task-progress
  -r, --resource <text>   Resource in "Label: Value" format (can be repeated)
  --trigger <text>        Trigger phrase (can be repeated)
  -j, --json <json>       JSON content for init-task-progress (advanced)
  -h, --help              Show this help

TASK PROGRESS STRUCTURE:
  The standard Task Progress format includes:
  • Ressources     - Links to tools, docs, repos
  • Overview       - Description of what was done
  • Sections       - Numbered sections with bullet points
  • Trigger Phrases - Commands to invoke the workflow

EXAMPLES:
  # List sections in a page
  bun run NotionSync.ts list-sections --page "January 2026"

  # Initialize Task Progress with full structure
  bun run NotionSync.ts init-task-progress \\
    --page "January 2026" \\
    --section "PARA System" \\
    -r "Workflow: ~/.claude/skills/Organizer/Workflows/DriveSync.md" \\
    -r "Tool: ~/.claude/skills/Organizer/Tools/drive_para_organizer.py" \\
    -o "DriveSync organizes Google Drive using PARA methodology." \\
    --trigger "organize my drive" --trigger "sync my drive"

  # Add incremental update
  bun run NotionSync.ts update-progress \\
    --page "January 2026" \\
    --section "TAO Minivault" \\
    -u "Dashboard migrated" -u "Data validated ✓"

  # Advanced: Initialize with JSON
  bun run NotionSync.ts init-task-progress --page "January 2026" --section "Test" \\
    --json '{"overview":"Test overview","resources":[{"label":"Doc","value":"path"}]}'
`);
    return;
  }

  switch (command) {
    case "test":
      await testConnection();
      break;

    case "list-databases":
      await listDatabases();
      break;

    case "list-pages":
      await listPages(parseInt(values.limit || "10"));
      break;

    case "search":
      if (!values.query) {
        console.error("Error: --query is required");
        process.exit(1);
      }
      await search(values.query);
      break;

    case "get-page":
      const pageId = positionals[1];
      if (!pageId) {
        console.error("Error: page ID required");
        process.exit(1);
      }
      await getPage(pageId);
      break;

    case "create-page":
      if (!values.database || !values.title) {
        console.error("Error: --database and --title are required");
        process.exit(1);
      }
      await createPage(values.database, values.title, values.content || "");
      break;

    case "create-standalone":
      if (!values.title) {
        console.error("Error: --title is required");
        process.exit(1);
      }
      await createStandalonePage(values.title, values.content || "", values.parent);
      break;

    case "review-todos":
      if (!values.page) {
        console.error("Error: --page is required (name of the Notion page)");
        process.exit(1);
      }
      await reviewTodos(values.page);
      break;

    case "list-sections":
      if (!values.page) {
        console.error("Error: --page is required");
        process.exit(1);
      }
      await listSections(values.page);
      break;

    case "init-task-progress":
      if (!values.page || !values.section) {
        console.error("Error: --page and --section are required");
        process.exit(1);
      }

      // Build content from options or JSON
      let taskContent: TaskProgressContent = {};

      if (values.json) {
        try {
          taskContent = JSON.parse(values.json);
        } catch (e) {
          console.error("Error: Invalid JSON for --json option");
          process.exit(1);
        }
      } else {
        // Build from individual options
        if (values.resource) {
          taskContent.resources = (values.resource as string[]).map(r => {
            const [label, ...valueParts] = r.split(":");
            return { label: label.trim(), value: valueParts.join(":").trim() };
          });
        }
        if (values.overview) {
          taskContent.overview = values.overview;
        }
        if (values.trigger) {
          taskContent.triggers = values.trigger as string[];
        }
      }

      await initTaskProgress(values.page, values.section, taskContent);
      break;

    case "update-progress":
      if (!values.page || !values.section || !values.update) {
        console.error("Error: --page, --section, and at least one --update are required");
        process.exit(1);
      }
      await updateToggleProgress(values.page, values.section, values.update as string[]);
      break;

    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

main().catch(console.error);
