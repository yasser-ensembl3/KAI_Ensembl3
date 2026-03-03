#!/usr/bin/env npx tsx

import { Client } from "@notionhq/client";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const notion = new Client({ auth: NOTION_TOKEN });

// Rich text to markdown
function richTextToMarkdown(richText: any[]): string {
  if (!richText || richText.length === 0) return "";
  return richText.map((text: any) => {
    let content = text.plain_text || "";
    if (text.annotations) {
      if (text.annotations.bold) content = `**${content}**`;
      if (text.annotations.italic) content = `*${content}*`;
      if (text.annotations.strikethrough) content = `~~${content}~~`;
      if (text.annotations.code) content = `\`${content}\``;
    }
    if (text.href) content = `[${content}](${text.href})`;
    return content;
  }).join("");
}

// Block to markdown
function blockToMarkdown(block: any, indent = ""): string {
  const type = block.type;
  const content = block[type];

  switch (type) {
    case "paragraph":
      return `${indent}${richTextToMarkdown(content?.rich_text)}\n`;
    case "heading_1":
      return `${indent}# ${richTextToMarkdown(content?.rich_text)}\n`;
    case "heading_2":
      return `${indent}## ${richTextToMarkdown(content?.rich_text)}\n`;
    case "heading_3":
      return `${indent}### ${richTextToMarkdown(content?.rich_text)}\n`;
    case "bulleted_list_item":
      return `${indent}- ${richTextToMarkdown(content?.rich_text)}\n`;
    case "numbered_list_item":
      return `${indent}1. ${richTextToMarkdown(content?.rich_text)}\n`;
    case "to_do":
      const checked = content?.checked ? "x" : " ";
      return `${indent}- [${checked}] ${richTextToMarkdown(content?.rich_text)}\n`;
    case "toggle":
      return `${indent}<details>\n${indent}<summary>${richTextToMarkdown(content?.rich_text)}</summary>\n`;
    case "code":
      const lang = content?.language || "";
      return `${indent}\`\`\`${lang}\n${richTextToMarkdown(content?.rich_text)}\n${indent}\`\`\`\n`;
    case "quote":
      return `${indent}> ${richTextToMarkdown(content?.rich_text)}\n`;
    case "callout":
      const icon = content?.icon?.emoji || "💡";
      return `${indent}> ${icon} ${richTextToMarkdown(content?.rich_text)}\n`;
    case "divider":
      return `${indent}---\n`;
    case "image":
      const imgUrl = content?.file?.url || content?.external?.url || "";
      const caption = content?.caption ? richTextToMarkdown(content.caption) : "image";
      return `${indent}![${caption}](${imgUrl})\n`;
    case "child_page":
      return `${indent}📄 **${content?.title}**\n`;
    case "child_database":
      return `${indent}🗃️ **${content?.title}**\n`;
    default:
      return "";
  }
}

// Fetch all blocks recursively
async function fetchAllBlocks(pageId: string): Promise<any[]> {
  const blocks: any[] = [];
  let cursor: string | undefined;

  do {
    const response = await notion.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
      page_size: 100,
    });

    blocks.push(...response.results);
    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (cursor);

  // Recursively fetch children
  for (const block of blocks) {
    if ((block as any).has_children && (block as any).type !== "child_page") {
      const children = await fetchAllBlocks(block.id);
      (block as any).children = children;
    }
  }

  return blocks;
}

// Convert blocks to markdown
function blocksToMarkdown(blocks: any[], indent = ""): string {
  let markdown = "";
  for (const block of blocks) {
    markdown += blockToMarkdown(block, indent);
    if ((block as any).children && (block as any).children.length > 0) {
      markdown += blocksToMarkdown((block as any).children, indent + "  ");
      if (block.type === "toggle") {
        markdown += `${indent}</details>\n`;
      }
    }
  }
  return markdown;
}

// Get text from property
function getTextFromProperty(property: any): string {
  if (!property) return "";
  switch (property.type) {
    case "title":
      return property.title?.[0]?.plain_text || "";
    case "rich_text":
      return property.rich_text?.[0]?.plain_text || "";
    case "select":
      return property.select?.name || "";
    case "date":
      return property.date?.start || "";
    default:
      return "";
  }
}

// Convert a single page to markdown
async function pageToMarkdown(pageId: string): Promise<{ title: string; markdown: string }> {
  const page = await notion.pages.retrieve({ page_id: pageId }) as any;

  // Get title
  const titleProp = Object.values(page.properties).find((p: any) => p.type === "title") as any;
  const title = titleProp?.title?.[0]?.plain_text || "Untitled";

  let markdown = "---\n";
  markdown += `title: "${title}"\n`;
  markdown += `notion_id: "${pageId}"\n`;
  markdown += `created: "${page.created_time}"\n`;
  markdown += `updated: "${page.last_edited_time}"\n`;
  markdown += "---\n\n";
  markdown += `# ${title}\n\n`;

  const blocks = await fetchAllBlocks(pageId);
  markdown += blocksToMarkdown(blocks);

  return { title, markdown };
}

// Main: fetch parent page and find all child pages (reports)
async function main() {
  const parentPageId = process.argv[2];
  const outputDir = process.argv[3] || ".";

  if (!parentPageId) {
    console.error("Usage: npx tsx notion-to-md.ts <page-id> [output-dir]");
    process.exit(1);
  }

  console.log(`Fetching page: ${parentPageId}`);

  // Get blocks from parent page
  const blocks = await fetchAllBlocks(parentPageId);

  // Find child pages
  const childPages = blocks.filter((b: any) => b.type === "child_page");

  if (childPages.length === 0) {
    console.log("No child pages found. Converting the page itself...");
    const { title, markdown } = await pageToMarkdown(parentPageId);
    const filename = `${outputDir}/${title.replace(/[^a-zA-Z0-9]/g, "_")}.md`;
    const fs = await import("fs");
    fs.writeFileSync(filename, markdown);
    console.log(`✅ Created: ${filename}`);
    return;
  }

  console.log(`Found ${childPages.length} child pages (reports)`);

  const fs = await import("fs");
  const path = await import("path");

  // Create output directory if needed
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Convert each child page
  for (const child of childPages) {
    const childId = child.id;
    const childTitle = (child as any).child_page?.title || "Untitled";

    console.log(`Converting: ${childTitle}...`);

    try {
      const { title, markdown } = await pageToMarkdown(childId);
      const safeTitle = title.replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "_");
      const filename = path.join(outputDir, `${safeTitle}.md`);
      fs.writeFileSync(filename, markdown);
      console.log(`  ✅ ${filename}`);
    } catch (err: any) {
      console.error(`  ❌ Error: ${err.message}`);
    }
  }

  console.log("\nDone!");
}

main().catch(console.error);
