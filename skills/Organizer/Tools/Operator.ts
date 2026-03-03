#!/usr/bin/env bun

/**
 * Operator Agent Tool
 *
 * Spawns an Operator agent using AgentFactory with predefined traits:
 * - business: Organizational dynamics, operations
 * - pragmatic: Focuses on what works, practical over theoretical
 * - systematic: Structured approach, clear methodology
 *
 * The Operator handles admin, logistics, and operational tasks.
 *
 * Usage:
 *   bun run Operator.ts --task "Process this week's admin tasks"
 *   bun run Operator.ts --task "Coordinate hiring process"
 */

import { parseArgs } from "util";
import { spawnSync } from "child_process";

const PAI_DIR = process.env.PAI_DIR || `${process.env.HOME}/.claude/skills`;
const AGENT_FACTORY = `${PAI_DIR}/Agents/Tools/AgentFactory.ts`;

// Operator's base traits
const BASE_TRAITS = ["business", "pragmatic", "systematic"];

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
Operator Agent - Admin and logistics specialist

USAGE:
  bun run Operator.ts --task "<task description>"

OPTIONS:
  -t, --task <desc>       Task for the Operator agent
  -a, --add-traits <list> Additional traits (comma-separated)
  -o, --output <fmt>      Output format: json (default), prompt, summary
  -h, --help              Show this help

BASE TRAITS: ${BASE_TRAITS.join(", ")}

CAPABILITIES:
  - Process administrative tasks
  - Track deadlines and filings
  - Coordinate hiring processes
  - Handle legal paperwork
  - Manage finances and budget
  - Organize documents

EXAMPLES:
  bun run Operator.ts --task "Process weekly admin tasks"
  bun run Operator.ts --task "Coordinate hiring for developer role"
  bun run Operator.ts --task "Track tax deadlines" --add-traits "meticulous"
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
