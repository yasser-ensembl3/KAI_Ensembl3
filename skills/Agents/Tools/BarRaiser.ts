#!/usr/bin/env bun

/**
 * Bar Raiser Agent Tool
 *
 * Spawns a Bar Raiser agent using AgentFactory with predefined traits:
 * - contrarian: Deliberately takes opposing view, stress-tests ideas
 * - skeptical: Questions assumptions, demands evidence, looks for flaws
 * - adversarial: Red team approach, find weaknesses, attack the problem
 *
 * The Bar Raiser ensures quality across all outputs. It's the quality gate.
 *
 * Inspired by Amazon's Bar Raiser program: An independent voice focused on
 * long-term quality, not short-term convenience.
 *
 * Usage:
 *   bun run BarRaiser.ts --task "Review this code before merge"
 *   bun run BarRaiser.ts --task "Evaluate this content draft"
 */

import { parseArgs } from "util";
import { spawnSync } from "child_process";

const PAI_DIR = process.env.PAI_DIR || `${process.env.HOME}/.claude/skills`;
const AGENT_FACTORY = `${PAI_DIR}/Agents/Tools/AgentFactory.ts`;

// Bar Raiser's base traits
const BASE_TRAITS = ["contrarian", "skeptical", "adversarial"];

async function main() {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      task: { type: "string", short: "t" },
      "add-traits": { type: "string", short: "a" },
      level: { type: "string", short: "l", default: "ship" },
      output: { type: "string", short: "o", default: "json" },
      help: { type: "boolean", short: "h" },
    },
  });

  if (values.help) {
    console.log(`
Bar Raiser Agent - Quality assurance specialist

USAGE:
  bun run BarRaiser.ts --task "<task description>"

OPTIONS:
  -t, --task <desc>       What to review
  -l, --level <level>     Quality level: draft, review, ship (default), archive
  -a, --add-traits <list> Additional traits (comma-separated)
  -o, --output <fmt>      Output format: json (default), prompt, summary
  -h, --help              Show this help

BASE TRAITS: ${BASE_TRAITS.join(", ")}

QUALITY LEVELS:
  draft   - Functional, captures intent (early work)
  review  - Clear, complete, coherent (before handoff)
  ship    - Polished, proud to share (public-facing)
  archive - Documented, learnings captured (completed)

REVIEW CRITERIA:
  - Is the deliverable clearly defined?
  - Does it meet the quality standard?
  - Is it documented properly?
  - Are there obvious issues?

EXAMPLES:
  bun run BarRaiser.ts --task "Review this PR before merge" --level ship
  bun run BarRaiser.ts --task "Check this draft" --level draft
  bun run BarRaiser.ts --task "Final review of blog post" --add-traits "meticulous"
`);
    return;
  }

  if (!values.task) {
    console.error("Error: --task is required");
    process.exit(1);
  }

  // Build the full task with quality level context
  const levelContext = {
    draft: "This is early work - check if it captures intent and is functional.",
    review: "This is for handoff - check if it's clear, complete, and coherent.",
    ship: "This is for public/final - check if it's polished and we'd be proud to share.",
    archive: "This is completed work - check if it's documented with learnings captured.",
  };

  const fullTask = `${values.task}\n\nQuality Level: ${values.level}\n${levelContext[values.level as keyof typeof levelContext] || levelContext.ship}`;

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
    "--task", fullTask,
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
