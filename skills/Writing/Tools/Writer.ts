#!/usr/bin/env bun

/**
 * Writer Agent Tool
 *
 * Spawns a Writer agent using AgentFactory with predefined traits:
 * - creative: Fresh perspectives and innovative approaches
 * - enthusiastic: Positive energy and engagement
 * - synthesizing: Combines multiple sources into unified view
 *
 * Usage:
 *   bun run Writer.ts --task "Write a blog post about X"
 *   bun run Writer.ts --task "Edit this article" --add-traits "meticulous"
 */

import { parseArgs } from "util";
import { spawnSync } from "child_process";

const PAI_DIR = process.env.PAI_DIR || `${process.env.HOME}/.claude/skills`;
const AGENT_FACTORY = `${PAI_DIR}/Agents/Tools/AgentFactory.ts`;

// Writer's base traits
const BASE_TRAITS = ["creative", "enthusiastic", "synthesizing"];

async function main() {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      task: { type: "string", short: "t" },
      "add-traits": { type: "string", short: "a" },
      output: { type: "string", short: "o", default: "json" },
      help: { type: "boolean", short: "h" },
    },
  });

  if (values.help) {
    console.log(`
Writer Agent - Content creation specialist

USAGE:
  bun run Writer.ts --task "<task description>"

OPTIONS:
  -t, --task <desc>       Task for the Writer agent
  -a, --add-traits <list> Additional traits (comma-separated)
  -o, --output <fmt>      Output format: json (default), prompt, summary
  -h, --help              Show this help

BASE TRAITS: ${BASE_TRAITS.join(", ")}

EXAMPLES:
  bun run Writer.ts --task "Write a blog post about AI"
  bun run Writer.ts --task "Edit this draft" --add-traits "meticulous"
`);
    return;
  }

  if (!values.task) {
    console.error("Error: --task is required");
    process.exit(1);
  }

  // Combine base traits with any additional traits
  let traits = [...BASE_TRAITS];
  if (values["add-traits"]) {
    const additional = values["add-traits"].split(",").map(t => t.trim());
    traits = [...new Set([...traits, ...additional])];
  }

  // Call AgentFactory
  const result = spawnSync("bun", [
    "run",
    AGENT_FACTORY,
    "--traits", traits.join(","),
    "--task", values.task,
    "--output", values.output || "json",
  ], {
    encoding: "utf-8",
    env: process.env,
  });

  if (result.error) {
    console.error("Error calling AgentFactory:", result.error);
    process.exit(1);
  }

  if (result.stderr) {
    console.error(result.stderr);
  }

  console.log(result.stdout);
}

main().catch(console.error);
