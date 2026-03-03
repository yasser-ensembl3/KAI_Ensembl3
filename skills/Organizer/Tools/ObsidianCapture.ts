#!/usr/bin/env bun

/**
 * ObsidianCapture - Add content to Obsidian vault with PARA organization
 *
 * Usage:
 *   bun run ObsidianCapture.ts add --title "My Note" --category 1-Projects --content "Content here"
 *   bun run ObsidianCapture.ts add --title "My Note" --category 2-Areas --subfolder "Finance"
 *   bun run ObsidianCapture.ts copy --source /path/to/file.md --category 3-Resources
 *   bun run ObsidianCapture.ts list --category 1-Projects
 *   bun run ObsidianCapture.ts structure
 */

import { parseArgs } from "util";
import { readdir, stat, mkdir, copyFile, writeFile } from "fs/promises";
import { join, basename } from "path";
import { homedir } from "os";

const VAULT_PATH = join(homedir(), "Desktop", "Shared Vault");
const PARA_CATEGORIES = ["1-Projects", "2-Areas", "3-Resources", "4-Archives"];

// Parse command line arguments
const args = Bun.argv.slice(2);
const command = args[0];

async function ensureDir(path: string) {
  try {
    await mkdir(path, { recursive: true });
  } catch (e) {
    // Directory exists
  }
}

async function addNote(
  title: string,
  category: string,
  content: string,
  subfolder?: string
) {
  if (!PARA_CATEGORIES.includes(category)) {
    console.error(`❌ Invalid category: ${category}`);
    console.error(`   Valid categories: ${PARA_CATEGORIES.join(", ")}`);
    process.exit(1);
  }

  let targetDir = join(VAULT_PATH, category);
  if (subfolder) {
    targetDir = join(targetDir, subfolder);
  }

  await ensureDir(targetDir);

  // Create filename from title
  const filename = title.replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "-") + ".md";
  const filepath = join(targetDir, filename);

  // Check if file exists
  let finalPath = filepath;
  let counter = 1;
  while (await Bun.file(finalPath).exists()) {
    const nameWithoutExt = filename.slice(0, -3);
    finalPath = join(targetDir, `${nameWithoutExt}-${counter}.md`);
    counter++;
  }

  // Create frontmatter
  const now = new Date().toISOString();
  const frontmatter = `---
title: "${title}"
created: ${now}
category: ${category}
${subfolder ? `subfolder: ${subfolder}` : ""}
---

`;

  await writeFile(finalPath, frontmatter + content);
  console.log(`✅ Note created: ${finalPath.replace(homedir(), "~")}`);
  return finalPath;
}

async function copyToVault(source: string, category: string, subfolder?: string) {
  if (!PARA_CATEGORIES.includes(category)) {
    console.error(`❌ Invalid category: ${category}`);
    process.exit(1);
  }

  const sourceFile = Bun.file(source);
  if (!(await sourceFile.exists())) {
    console.error(`❌ Source file not found: ${source}`);
    process.exit(1);
  }

  let targetDir = join(VAULT_PATH, category);
  if (subfolder) {
    targetDir = join(targetDir, subfolder);
  }

  await ensureDir(targetDir);

  const filename = basename(source);
  let targetPath = join(targetDir, filename);

  // Handle duplicates
  let counter = 1;
  while (await Bun.file(targetPath).exists()) {
    const ext = filename.includes(".") ? "." + filename.split(".").pop() : "";
    const nameWithoutExt = ext ? filename.slice(0, -ext.length) : filename;
    targetPath = join(targetDir, `${nameWithoutExt}-${counter}${ext}`);
    counter++;
  }

  await copyFile(source, targetPath);
  console.log(`✅ File copied: ${targetPath.replace(homedir(), "~")}`);
  return targetPath;
}

async function listCategory(category: string) {
  const categoryPath = join(VAULT_PATH, category);

  try {
    const items = await readdir(categoryPath, { withFileTypes: true });

    console.log(`\n📁 ${category}/`);

    for (const item of items) {
      if (item.name.startsWith(".")) continue;

      if (item.isDirectory()) {
        const subItems = await readdir(join(categoryPath, item.name));
        const mdFiles = subItems.filter(f => f.endsWith(".md")).length;
        console.log(`   📁 ${item.name}/ (${mdFiles} notes)`);
      } else if (item.name.endsWith(".md")) {
        console.log(`   📄 ${item.name}`);
      }
    }
  } catch (e) {
    console.log(`   (empty)`);
  }
}

async function showStructure() {
  console.log(`\n📚 Obsidian Vault PARA Structure`);
  console.log(`   Path: ${VAULT_PATH}\n`);

  for (const category of PARA_CATEGORIES) {
    await listCategory(category);
  }
  console.log();
}

async function main() {
  if (!command || command === "help") {
    console.log(`
ObsidianCapture - Add content to Obsidian vault

Commands:
  add       Create a new note
  copy      Copy a file to vault
  list      List notes in a category
  structure Show full PARA structure

Examples:
  bun run ObsidianCapture.ts add --title "Meeting Notes" --category 1-Projects --content "..."
  bun run ObsidianCapture.ts add --title "Budget 2026" --category 2-Areas --subfolder "Finance"
  bun run ObsidianCapture.ts copy --source ~/Downloads/guide.md --category 3-Resources
  bun run ObsidianCapture.ts list --category 1-Projects
  bun run ObsidianCapture.ts structure
`);
    process.exit(0);
  }

  if (command === "structure") {
    await showStructure();
    process.exit(0);
  }

  if (command === "list") {
    const categoryIdx = args.indexOf("--category");
    if (categoryIdx === -1) {
      // List all
      for (const cat of PARA_CATEGORIES) {
        await listCategory(cat);
      }
    } else {
      await listCategory(args[categoryIdx + 1]);
    }
    process.exit(0);
  }

  if (command === "add") {
    const titleIdx = args.indexOf("--title");
    const categoryIdx = args.indexOf("--category");
    const contentIdx = args.indexOf("--content");
    const subfolderIdx = args.indexOf("--subfolder");

    if (titleIdx === -1 || categoryIdx === -1) {
      console.error("Usage: add --title <title> --category <category> [--content <content>] [--subfolder <subfolder>]");
      process.exit(1);
    }

    const title = args[titleIdx + 1];
    const category = args[categoryIdx + 1];
    const content = contentIdx !== -1 ? args[contentIdx + 1] : "";
    const subfolder = subfolderIdx !== -1 ? args[subfolderIdx + 1] : undefined;

    await addNote(title, category, content, subfolder);
    process.exit(0);
  }

  if (command === "copy") {
    const sourceIdx = args.indexOf("--source");
    const categoryIdx = args.indexOf("--category");
    const subfolderIdx = args.indexOf("--subfolder");

    if (sourceIdx === -1 || categoryIdx === -1) {
      console.error("Usage: copy --source <path> --category <category> [--subfolder <subfolder>]");
      process.exit(1);
    }

    const source = args[sourceIdx + 1];
    const category = args[categoryIdx + 1];
    const subfolder = subfolderIdx !== -1 ? args[subfolderIdx + 1] : undefined;

    await copyToVault(source, category, subfolder);
    process.exit(0);
  }

  console.error(`Unknown command: ${command}`);
  process.exit(1);
}

main().catch(console.error);
