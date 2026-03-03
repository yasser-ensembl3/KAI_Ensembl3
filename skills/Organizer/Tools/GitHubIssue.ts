#!/usr/bin/env bun

/**
 * GitHubIssue - GitHub Issue and Comment Management Tool
 *
 * Uses the `gh` CLI for GitHub operations.
 *
 * Usage:
 *   bun run GitHubIssue.ts list --repo owner/repo
 *   bun run GitHubIssue.ts create --repo owner/repo --title "Bug" --body "Description"
 *   bun run GitHubIssue.ts comment --repo owner/repo --issue 123 --body "Comment"
 *   bun run GitHubIssue.ts view --repo owner/repo --issue 123
 */

import { parseArgs } from "util";
import { $ } from "bun";

// Check if gh CLI is available
async function checkGhCli(): Promise<boolean> {
  try {
    await $`gh --version`.quiet();
    return true;
  } catch {
    return false;
  }
}

// Check if authenticated
async function checkAuth(): Promise<boolean> {
  try {
    await $`gh auth status`.quiet();
    return true;
  } catch {
    return false;
  }
}

// List issues
async function listIssues(repo: string, state = "open", limit = 10): Promise<void> {
  console.log(`\n📋 Issues for ${repo} (${state})\n`);

  try {
    const result = await $`gh issue list --repo ${repo} --state ${state} --limit ${limit} --json number,title,state,author,createdAt`.text();
    const issues = JSON.parse(result);

    if (issues.length === 0) {
      console.log("  No issues found.");
      return;
    }

    for (const issue of issues) {
      const date = new Date(issue.createdAt).toLocaleDateString();
      const stateIcon = issue.state === "OPEN" ? "🟢" : "🟣";
      console.log(`  ${stateIcon} #${issue.number} ${issue.title}`);
      console.log(`     by @${issue.author.login} on ${date}`);
    }

    console.log(`\n  Total: ${issues.length} issues`);
  } catch (error) {
    console.error("Error listing issues:", error);
    process.exit(1);
  }
}

// Create issue
async function createIssue(repo: string, title: string, body: string, labels?: string): Promise<void> {
  console.log(`\n📝 Creating issue in ${repo}...`);

  try {
    let cmd = `gh issue create --repo ${repo} --title "${title}" --body "${body}"`;
    if (labels) {
      cmd += ` --label "${labels}"`;
    }

    const result = await $`gh issue create --repo ${repo} --title ${title} --body ${body}`.text();
    console.log(`\n✅ Issue created: ${result.trim()}`);
  } catch (error) {
    console.error("Error creating issue:", error);
    process.exit(1);
  }
}

// Add comment to issue
async function addComment(repo: string, issueNumber: number, body: string): Promise<void> {
  console.log(`\n💬 Adding comment to #${issueNumber}...`);

  try {
    await $`gh issue comment ${issueNumber} --repo ${repo} --body ${body}`;
    console.log(`\n✅ Comment added to issue #${issueNumber}`);
  } catch (error) {
    console.error("Error adding comment:", error);
    process.exit(1);
  }
}

// View issue details
async function viewIssue(repo: string, issueNumber: number): Promise<void> {
  console.log(`\n📄 Issue #${issueNumber} in ${repo}\n`);

  try {
    const result = await $`gh issue view ${issueNumber} --repo ${repo} --json number,title,state,body,author,createdAt,comments`.text();
    const issue = JSON.parse(result);

    const stateIcon = issue.state === "OPEN" ? "🟢 OPEN" : "🟣 CLOSED";
    console.log(`  Title: ${issue.title}`);
    console.log(`  State: ${stateIcon}`);
    console.log(`  Author: @${issue.author.login}`);
    console.log(`  Created: ${new Date(issue.createdAt).toLocaleString()}`);
    console.log(`  Comments: ${issue.comments.length}`);

    if (issue.body) {
      console.log(`\n  Description:`);
      console.log(`  ${issue.body.split('\n').join('\n  ')}`);
    }

    if (issue.comments.length > 0) {
      console.log(`\n  Recent Comments:`);
      for (const comment of issue.comments.slice(-3)) {
        console.log(`\n  @${comment.author.login} (${new Date(comment.createdAt).toLocaleDateString()}):`);
        console.log(`  ${comment.body.slice(0, 200)}${comment.body.length > 200 ? '...' : ''}`);
      }
    }
  } catch (error) {
    console.error("Error viewing issue:", error);
    process.exit(1);
  }
}

// Close issue
async function closeIssue(repo: string, issueNumber: number, reason?: string): Promise<void> {
  console.log(`\n🔒 Closing issue #${issueNumber}...`);

  try {
    if (reason) {
      await $`gh issue close ${issueNumber} --repo ${repo} --reason ${reason}`;
    } else {
      await $`gh issue close ${issueNumber} --repo ${repo}`;
    }
    console.log(`\n✅ Issue #${issueNumber} closed`);
  } catch (error) {
    console.error("Error closing issue:", error);
    process.exit(1);
  }
}

// Search issues
async function searchIssues(repo: string, query: string, limit = 10): Promise<void> {
  console.log(`\n🔍 Searching issues in ${repo} for "${query}"\n`);

  try {
    const result = await $`gh search issues --repo ${repo} ${query} --limit ${limit} --json number,title,state,repository`.text();
    const issues = JSON.parse(result);

    if (issues.length === 0) {
      console.log("  No matching issues found.");
      return;
    }

    for (const issue of issues) {
      const stateIcon = issue.state === "open" ? "🟢" : "🟣";
      console.log(`  ${stateIcon} #${issue.number} ${issue.title}`);
    }

    console.log(`\n  Found: ${issues.length} issues`);
  } catch (error) {
    console.error("Error searching issues:", error);
    process.exit(1);
  }
}

// Main
async function main() {
  const { values, positionals } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      repo: { type: "string", short: "r" },
      title: { type: "string", short: "t" },
      body: { type: "string", short: "b" },
      issue: { type: "string", short: "i" },
      state: { type: "string", short: "s", default: "open" },
      labels: { type: "string", short: "l" },
      query: { type: "string", short: "q" },
      limit: { type: "string", default: "10" },
      reason: { type: "string" },
      help: { type: "boolean", short: "h" },
    },
    allowPositionals: true,
  });

  const command = positionals[0];

  if (values.help || !command) {
    console.log(`
GitHubIssue - GitHub Issue Management Tool

USAGE:
  bun run GitHubIssue.ts <command> [options]

COMMANDS:
  list      List issues
  create    Create a new issue
  comment   Add a comment to an issue
  view      View issue details
  close     Close an issue
  search    Search issues

OPTIONS:
  -r, --repo <owner/repo>   Repository (required)
  -t, --title <text>        Issue title (for create)
  -b, --body <text>         Issue/comment body
  -i, --issue <number>      Issue number
  -s, --state <state>       Filter by state: open, closed, all (default: open)
  -l, --labels <labels>     Comma-separated labels
  -q, --query <text>        Search query
  --limit <n>               Limit results (default: 10)
  --reason <reason>         Close reason: completed, not_planned
  -h, --help                Show this help

EXAMPLES:
  bun run GitHubIssue.ts list --repo anthropics/claude-code
  bun run GitHubIssue.ts create --repo user/repo --title "Bug report" --body "Description"
  bun run GitHubIssue.ts comment --repo user/repo --issue 123 --body "Thanks!"
  bun run GitHubIssue.ts view --repo user/repo --issue 123
  bun run GitHubIssue.ts close --repo user/repo --issue 123 --reason completed
  bun run GitHubIssue.ts search --repo user/repo --query "bug"

PREREQUISITES:
  - GitHub CLI (gh) must be installed: brew install gh
  - Must be authenticated: gh auth login
`);
    return;
  }

  // Check prerequisites
  if (!(await checkGhCli())) {
    console.error("❌ GitHub CLI (gh) not found. Install with: brew install gh");
    process.exit(1);
  }

  if (!(await checkAuth())) {
    console.error("❌ Not authenticated with GitHub. Run: gh auth login");
    process.exit(1);
  }

  // Validate repo
  if (!values.repo && command !== "help") {
    console.error("Error: --repo is required");
    process.exit(1);
  }

  switch (command) {
    case "list":
      await listIssues(values.repo!, values.state, parseInt(values.limit!));
      break;

    case "create":
      if (!values.title) {
        console.error("Error: --title is required for create");
        process.exit(1);
      }
      await createIssue(values.repo!, values.title, values.body || "", values.labels);
      break;

    case "comment":
      if (!values.issue || !values.body) {
        console.error("Error: --issue and --body are required for comment");
        process.exit(1);
      }
      await addComment(values.repo!, parseInt(values.issue), values.body);
      break;

    case "view":
      if (!values.issue) {
        console.error("Error: --issue is required for view");
        process.exit(1);
      }
      await viewIssue(values.repo!, parseInt(values.issue));
      break;

    case "close":
      if (!values.issue) {
        console.error("Error: --issue is required for close");
        process.exit(1);
      }
      await closeIssue(values.repo!, parseInt(values.issue), values.reason);
      break;

    case "search":
      if (!values.query) {
        console.error("Error: --query is required for search");
        process.exit(1);
      }
      await searchIssues(values.repo!, values.query, parseInt(values.limit!));
      break;

    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

main().catch(console.error);
