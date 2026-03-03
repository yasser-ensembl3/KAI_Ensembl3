---
name: Coding
description: Technical work, prototypes, debugging, and software development. USE WHEN code, debug, implement, build, prototype, fix bug, OR technical development.
---

# Coding - Technical Development Skill

**Auto-routes when user mentions coding, debugging, building, or technical implementation.**

---

## Tools

| Tool | Purpose | Command |
|------|---------|---------|
| **Coder.ts** | Spawn a Coder agent | `bun run $PAI_DIR/skills/Coding/Tools/Coder.ts --task "<task>"` |

---

## Coder Agent

**Traits:** `technical, meticulous, systematic`

The Coder agent handles technical work:
- Write clean, functional code
- Build prototypes quickly
- Debug and fix issues
- Review and refactor code
- Document technical decisions

### Principles

- **Ship fast** - Working > perfect
- **Minimal viable** - Build only what's needed
- **No over-engineering** - Solve today's problem
- **Document decisions** - Why, not just what

---

## Complexity Assessment

| Level | Description | Example |
|-------|-------------|---------|
| **Trivial** | Quick fix | Fix typo, add config |
| **Simple** | Single session | New endpoint, simple UI |
| **Moderate** | Multiple sessions | New feature, integration |
| **Complex** | Multi-day effort | New system, major refactor |
| **Unknown** | Needs spike | New technology, unclear scope |

---

## Workflow Routing

| Workflow | Trigger | Action |
|----------|---------|--------|
| **Build** | "code", "implement", "build" | Spawn Coder agent |
| **Debug** | "debug", "fix bug", "troubleshoot" | Spawn Coder with cautious trait |
| **Review** | "review code", "refactor" | Spawn Coder with comparative trait |

---

## Examples

**Example 1: Build a feature**
```
User: "Implement a login system"
-> Spawns Coder agent with technical + meticulous + systematic traits
-> Returns implementation plan and code
```

**Example 2: Debug an issue**
```
User: "Debug this API error"
-> Spawns Coder with cautious trait added
-> Systematic debugging approach
```

**Example 3: Code review**
```
User: "Review this PR"
-> Spawns Coder with comparative trait
-> Returns structured review
```

---

## Handoff Triggers

| Situation | Hand to | Why |
|-----------|---------|-----|
| Need to define what to build | Strategy/ | Plan first |
| Need research on technology | Research/ | Learn first |
| Need documentation for users | Writing/ | Content creation |
| Quality review needed | Agents/BarRaiser | Final check |
