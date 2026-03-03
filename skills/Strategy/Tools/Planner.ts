#!/usr/bin/env bun

/**
 * Planner Agent Tool
 *
 * Spawns a Planner agent using AgentFactory with predefined traits:
 * - business: Market analysis, strategy, organizational dynamics
 * - analytical: Data-driven, logical, systematic breakdown
 * - systematic: Structured approach, clear methodology
 *
 * Usage:
 *   bun run Planner.ts --task "Plan Q2 goals"
 *   bun run Planner.ts --task "Weekly review"
 */

import { parseArgs } from "util";
import { spawnSync } from "child_process";

const PAI_DIR = process.env.PAI_DIR || `${process.env.HOME}/.claude/skills`;
const AGENT_FACTORY = `${PAI_DIR}/Agents/Tools/AgentFactory.ts`;

// Planner's base traits
const BASE_TRAITS = ["business", "analytical", "systematic"];

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
Planner Agent - Strategy and goals specialist

USAGE:
  bun run Planner.ts --task "<task description>"

OPTIONS:
  -t, --task <desc>       Task for the Planner agent
  -a, --add-traits <list> Additional traits (comma-separated)
  -o, --output <fmt>      Output format: json (default), prompt, summary
  -h, --help              Show this help

BASE TRAITS: ${BASE_TRAITS.join(", ")}

SUGGESTED ADD-ONS:
  comparative - For prioritization, trade-off analysis
  thorough    - For deep quarterly reviews
  consultative - For advisory mode

EXAMPLES:
  bun run Planner.ts --task "Set Q2 goals"
  bun run Planner.ts --task "Weekly review"
  bun run Planner.ts --task "Prioritize these projects" --add-traits "comparative"
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
