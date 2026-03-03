#!/usr/bin/env bun

/**
 * Coach Agent Tool
 *
 * Spawns a Coach agent using AgentFactory with predefined traits:
 * - empathetic: Considers human impact, emotional intelligence
 * - consultative: Advisory stance, recommendations with rationale
 * - synthesizing: Combines perspectives into unified understanding
 *
 * Usage:
 *   bun run Coach.ts --task "Help me get unstuck"
 *   bun run Coach.ts --task "Coaching session on career"
 */

import { parseArgs } from "util";
import { spawnSync } from "child_process";

const PAI_DIR = process.env.PAI_DIR || `${process.env.HOME}/.claude/skills`;
const AGENT_FACTORY = `${PAI_DIR}/Agents/Tools/AgentFactory.ts`;

// Coach's base traits
const BASE_TRAITS = ["empathetic", "consultative", "synthesizing"];

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
Coach Agent - Personal growth specialist

USAGE:
  bun run Coach.ts --task "<task description>"

OPTIONS:
  -t, --task <desc>       Task for the Coach agent
  -a, --add-traits <list> Additional traits (comma-separated)
  -o, --output <fmt>      Output format: json (default), prompt, summary
  -h, --help              Show this help

BASE TRAITS: ${BASE_TRAITS.join(", ")}

SUGGESTED ADD-ONS:
  bold        - For challenging blind spots
  exploratory - For open-ended sessions
  pragmatic   - For action-oriented coaching

EXAMPLES:
  bun run Coach.ts --task "Help me get unstuck on this decision"
  bun run Coach.ts --task "Coaching session on work-life balance"
  bun run Coach.ts --task "Challenge my assumptions" --add-traits "bold"
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
