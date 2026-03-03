#!/usr/bin/env bun

/**
 * Coder Agent Tool
 *
 * Spawns a Coder agent using AgentFactory with predefined traits:
 * - technical: Software architecture, system design, debugging
 * - meticulous: Attention to detail, precision, thoroughness
 * - systematic: Structured approach, clear methodology
 *
 * Usage:
 *   bun run Coder.ts --task "Implement a login system"
 *   bun run Coder.ts --task "Debug this error" --add-traits "cautious"
 */

import { parseArgs } from "util";
import { spawnSync } from "child_process";

const PAI_DIR = process.env.PAI_DIR || `${process.env.HOME}/.claude/skills`;
const AGENT_FACTORY = `${PAI_DIR}/Agents/Tools/AgentFactory.ts`;

// Coder's base traits
const BASE_TRAITS = ["technical", "meticulous", "systematic"];

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
Coder Agent - Technical development specialist

USAGE:
  bun run Coder.ts --task "<task description>"

OPTIONS:
  -t, --task <desc>       Task for the Coder agent
  -a, --add-traits <list> Additional traits (comma-separated)
  -o, --output <fmt>      Output format: json (default), prompt, summary
  -h, --help              Show this help

BASE TRAITS: ${BASE_TRAITS.join(", ")}

SUGGESTED ADD-ONS:
  cautious    - For debugging, error handling
  comparative - For code review, refactoring
  rapid       - For quick prototypes

EXAMPLES:
  bun run Coder.ts --task "Implement user authentication"
  bun run Coder.ts --task "Debug this API error" --add-traits "cautious"
  bun run Coder.ts --task "Review this PR" --add-traits "comparative"
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
