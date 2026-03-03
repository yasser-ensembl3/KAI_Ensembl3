import { Client } from "@notionhq/client";
import * as fs from "fs";
import * as path from "path";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const notion = new Client({ auth: NOTION_TOKEN });

function richTextToMarkdown(richText: any[]): string {
  if (!richText || richText.length === 0) return "";
  return richText
    .map((text: any) => {
      let content = text.plain_text || "";
      if (text.annotations) {
        if (text.annotations.bold) content = `**${content}**`;
        if (text.annotations.italic) content = `*${content}*`;
        if (text.annotations.strikethrough) content = `~~${content}~~`;
        if (text.annotations.code) content = "`" + content + "`";
      }
      if (text.href) content = `[${content}](${text.href})`;
      return content;
    })
    .join("");
}

function blockToMarkdown(block: any, indent = ""): string {
  const type = block.type;
  const content = block[type];
  switch (type) {
    case "paragraph":
      return indent + richTextToMarkdown(content?.rich_text) + "\n";
    case "heading_1":
      return indent + "# " + richTextToMarkdown(content?.rich_text) + "\n";
    case "heading_2":
      return indent + "## " + richTextToMarkdown(content?.rich_text) + "\n";
    case "heading_3":
      return indent + "### " + richTextToMarkdown(content?.rich_text) + "\n";
    case "bulleted_list_item":
      return indent + "- " + richTextToMarkdown(content?.rich_text) + "\n";
    case "numbered_list_item":
      return indent + "1. " + richTextToMarkdown(content?.rich_text) + "\n";
    case "to_do":
      return (
        indent +
        "- [" +
        (content?.checked ? "x" : " ") +
        "] " +
        richTextToMarkdown(content?.rich_text) +
        "\n"
      );
    case "toggle":
      return (
        indent +
        "<details>\n" +
        indent +
        "<summary>" +
        richTextToMarkdown(content?.rich_text) +
        "</summary>\n"
      );
    case "code":
      return (
        indent +
        "```" +
        (content?.language || "") +
        "\n" +
        richTextToMarkdown(content?.rich_text) +
        "\n" +
        indent +
        "```\n"
      );
    case "quote":
      return indent + "> " + richTextToMarkdown(content?.rich_text) + "\n";
    case "callout":
      return (
        indent +
        "> " +
        (content?.icon?.emoji || "") +
        " " +
        richTextToMarkdown(content?.rich_text) +
        "\n"
      );
    case "divider":
      return indent + "---\n";
    case "child_page":
      return indent + "📄 **" + content?.title + "**\n";
    default:
      return "";
  }
}

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

  for (const block of blocks) {
    if ((block as any).has_children && block.type !== "child_page") {
      (block as any).children = await fetchAllBlocks(block.id);
    }
  }
  return blocks;
}

function blocksToMarkdown(blocks: any[], indent = ""): string {
  let md = "";
  for (const block of blocks) {
    md += blockToMarkdown(block, indent);
    if ((block as any).children?.length > 0) {
      md += blocksToMarkdown((block as any).children, indent + "  ");
      if (block.type === "toggle") md += indent + "</details>\n";
    }
  }
  return md;
}

async function pageToMarkdown(
  pageId: string
): Promise<{ title: string; markdown: string }> {
  const page = (await notion.pages.retrieve({ page_id: pageId })) as any;
  const titleProp = Object.values(page.properties).find(
    (p: any) => p.type === "title"
  ) as any;
  const title = titleProp?.title?.[0]?.plain_text || "Untitled";

  let md = "---\n";
  md += `title: "${title}"\n`;
  md += `notion_id: "${pageId}"\n`;
  md += "---\n\n";
  md += `# ${title}\n\n`;

  const blocks = await fetchAllBlocks(pageId);
  md += blocksToMarkdown(blocks);

  return { title, markdown: md };
}

async function main() {
  const parentPageId = process.argv[2] || "2ce58fe731b180ff98bde1a59a18464a";
  const outputDir = process.argv[3] || "/Users/mac/Desktop/notion-reports";

  console.log("Fetching parent page...");
  const blocks = await fetchAllBlocks(parentPageId);
  const childPages = blocks.filter((b: any) => b.type === "child_page");

  console.log(`Found ${childPages.length} child pages`);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  if (childPages.length === 0) {
    console.log("No child pages found, exporting the page itself...");
    const { title, markdown } = await pageToMarkdown(parentPageId);
    const safeTitle = title.replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "_");
    const filename = path.join(outputDir, `${safeTitle}.md`);
    fs.writeFileSync(filename, markdown);
    console.log(`✅ ${filename}`);
    return;
  }

  for (const child of childPages) {
    const childTitle = (child as any).child_page?.title || "Untitled";
    console.log(`Converting: ${childTitle}...`);
    try {
      const { title, markdown } = await pageToMarkdown(child.id);
      const safeTitle = title
        .replace(/[^a-zA-Z0-9\s-]/g, "")
        .replace(/\s+/g, "_");
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
