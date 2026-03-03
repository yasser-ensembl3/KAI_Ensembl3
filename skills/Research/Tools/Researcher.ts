#!/usr/bin/env bun

/**
 * Researcher Agent Tool
 *
 * Spawns a Researcher agent using AgentFactory with predefined traits:
 * - research: Academic methodology, source evaluation, synthesis
 * - analytical: Data-driven, logical, systematic breakdown
 * - thorough: Exhaustive analysis, comprehensive coverage
 *
 * Usage:
 *   bun run Researcher.ts --task "Research AI agent architectures"
 *   bun run Researcher.ts --task "Quick comparison" --add-traits "rapid"
 */

import { parseArgs } from "util";
import { spawnSync } from "child_process";

const PAI_DIR = process.env.PAI_DIR || `${process.env.HOME}/.claude/skills`;
const AGENT_FACTORY = `${PAI_DIR}/Agents/Tools/AgentFactory.ts`;

// Researcher's base traits
const BASE_TRAITS = ["research", "analytical", "thorough"];

async function main() {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      task: { type: "string", short: "t" },
      "add-traits": { type: "string", short: "a" },
      output: { type: "string", short: "o", default: "json" },
      quick: { type: "boolean", short: "q" },
      help: { type: "boolean", short: "h" },
    },
  });

  if (values.help) {
    console.log(`
Researcher Agent - Knowledge synthesis specialist

USAGE:
  bun run Researcher.ts --task "<task description>"

OPTIONS:
  -t, --task <desc>       Task for the Researcher agent
  -a, --add-traits <list> Additional traits (comma-separated)
  -q, --quick             Use rapid mode (replaces thorough with rapid)
  -o, --output <fmt>      Output format: json (default), prompt, summary
  -h, --help              Show this help

BASE TRAITS: ${BASE_TRAITS.join(", ")}

SUGGESTED ADD-ONS:
  comparative  - For evaluating options
  skeptical    - For critical analysis
  synthesizing - For combining multiple sources

EXAMPLES:
  bun run Researcher.ts --task "Research AI agent architectures"
  bun run Researcher.ts --task "Quick fact check" --quick
  bun run Researcher.ts --task "Compare frameworks" --add-traits "comparative"
`);
    return;
  }

  if (!values.task) {
    console.error("Error: --task is required");
    process.exit(1);
  }

  // Combine base traits with any additional traits
  let traits = [...BASE_TRAITS];

  // Quick mode replaces thorough with rapid
  if (values.quick) {
    traits = traits.filter(t => t !== "thorough");
    traits.push("rapid");
  }

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
