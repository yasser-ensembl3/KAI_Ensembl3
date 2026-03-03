#!/usr/bin/env bun

/**
 * FileSort - Organize files by week/day structure
 *
 * Usage:
 *   bun run FileSort.ts --from 2026-01-06 --to 2026-01-19 --sources ~/Downloads,~/Desktop --dest ~/Documents
 *   bun run FileSort.ts --from 2026-01-06 --to 2026-01-19 --sources ~/Downloads --dest ~/Documents --dry-run
 */

import { parseArgs } from "util";
import { readdir, stat, mkdir, rename } from "fs/promises";
import { join, basename } from "path";
import { homedir } from "os";

// Parse command line arguments
const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    from: { type: "string" },
    to: { type: "string" },
    sources: { type: "string" },
    dest: { type: "string" },
    "dry-run": { type: "boolean", default: false },
  },
});

// Validate required args
if (!values.from || !values.to || !values.sources || !values.dest) {
  console.error("Usage: bun run FileSort.ts --from YYYY-MM-DD --to YYYY-MM-DD --sources dir1,dir2 --dest dir");
  console.error("Options:");
  console.error("  --from       Start date (inclusive) YYYY-MM-DD");
  console.error("  --to         End date (inclusive) YYYY-MM-DD");
  console.error("  --sources    Comma-separated source directories");
  console.error("  --dest       Destination directory");
  console.error("  --dry-run    Preview without moving files");
  process.exit(1);
}

// Expand ~ to home directory
function expandPath(path: string): string {
  if (path.startsWith("~/")) {
    return join(homedir(), path.slice(2));
  }
  return path;
}

// Get ISO week number
function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Format date as YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

// Get week folder name (YYYY-WXX)
function getWeekFolder(date: Date): string {
  const year = date.getFullYear();
  const week = getISOWeek(date).toString().padStart(2, "0");
  return `${year}-W${week}`;
}

// Check if date is within range
function isInRange(date: Date, from: Date, to: Date): boolean {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return d >= from && d <= to;
}

// Main function
async function main() {
  const fromDate = new Date(values.from!);
  const toDate = new Date(values.to!);
  const sources = values.sources!.split(",").map(s => expandPath(s.trim()));
  const dest = expandPath(values.dest!);
  const dryRun = values["dry-run"] || false;

  console.log(`\n📁 FileSort - Organizing files`);
  console.log(`   From: ${values.from} To: ${values.to}`);
  console.log(`   Sources: ${sources.join(", ")}`);
  console.log(`   Destination: ${dest}`);
  console.log(`   Mode: ${dryRun ? "DRY RUN (preview)" : "LIVE"}\n`);

  const filesToMove: Array<{ source: string; dest: string; file: string }> = [];

  // Scan each source directory
  for (const sourceDir of sources) {
    try {
      const files = await readdir(sourceDir);

      for (const file of files) {
        // Skip hidden files and directories
        if (file.startsWith(".")) continue;

        const filePath = join(sourceDir, file);
        const fileStat = await stat(filePath);

        // Skip directories
        if (fileStat.isDirectory()) continue;

        const modDate = new Date(fileStat.mtime);

        // Check if file is in date range
        if (isInRange(modDate, fromDate, toDate)) {
          const weekFolder = getWeekFolder(modDate);
          const dayFolder = formatDate(modDate);
          const destPath = join(dest, weekFolder, dayFolder);

          filesToMove.push({
            source: filePath,
            dest: destPath,
            file: file,
          });
        }
      }
    } catch (error) {
      console.error(`⚠️  Could not read directory: ${sourceDir}`);
    }
  }

  if (filesToMove.length === 0) {
    console.log("ℹ️  No files found in the specified date range.");
    return;
  }

  console.log(`Found ${filesToMove.length} file(s) to organize:\n`);

  // Group by destination for cleaner output
  const grouped = new Map<string, string[]>();
  for (const item of filesToMove) {
    const key = item.dest;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(item.file);
  }

  // Display and execute moves
  for (const [destPath, files] of grouped) {
    const relativeDest = destPath.replace(homedir(), "~");
    console.log(`📂 ${relativeDest}/`);
    for (const file of files) {
      console.log(`   └─ ${file}`);
    }
  }

  if (dryRun) {
    console.log("\n🔍 DRY RUN - No files were moved.");
    console.log("   Remove --dry-run to execute.");
    return;
  }

  // Execute moves
  console.log("\nMoving files...");
  let moved = 0;
  let errors = 0;

  for (const item of filesToMove) {
    try {
      // Create destination directory
      await mkdir(item.dest, { recursive: true });

      // Handle duplicate filenames
      let destFile = join(item.dest, item.file);
      let counter = 1;
      const ext = item.file.includes(".") ? "." + item.file.split(".").pop() : "";
      const nameWithoutExt = ext ? item.file.slice(0, -ext.length) : item.file;

      while (await Bun.file(destFile).exists()) {
        destFile = join(item.dest, `${nameWithoutExt}_${counter}${ext}`);
        counter++;
      }

      // Move file
      await rename(item.source, destFile);
      moved++;
    } catch (error) {
      console.error(`   ❌ Failed to move: ${item.file}`);
      errors++;
    }
  }

  console.log(`\n✅ Done! Moved ${moved} file(s)${errors > 0 ? `, ${errors} error(s)` : ""}`);
}

main().catch(console.error);
