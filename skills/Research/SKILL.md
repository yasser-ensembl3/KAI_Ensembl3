---
name: Research
description: Knowledge synthesis, information gathering, and learning. USE WHEN research, find information, investigate, learn about, summarize, OR deep dive.
---

# Research - Knowledge Synthesis Skill

**Auto-routes when user mentions research, investigation, learning, or information gathering.**

---

## Tools

| Tool | Purpose | Command |
|------|---------|---------|
| **Researcher.ts** | Spawn a Researcher agent | `bun run $PAI_DIR/skills/Research/Tools/Researcher.ts --task "<task>"` |

---

## Researcher Agent

**Traits:** `research, analytical, thorough`

The Researcher agent gathers and synthesizes knowledge:
- Deep dive research on topics
- Synthesize information from multiple sources
- Document findings clearly
- Answer factual questions
- Connect ideas across domains

### Principles

- **Synthesize, don't just collect** - Distill insights
- **Source everything** - Always cite
- **Flag uncertainty** - What's opinion vs fact
- **Update, don't duplicate** - Add to existing knowledge

---

## Output Formats

### Quick Answer
```markdown
## Answer
[Direct answer]

## Sources
- [Source 1]

## Confidence
[High/Medium/Low] - [Why]
```

### Deep Dive
```markdown
## Summary
[Key takeaways in 3-5 bullets]

## Detailed Findings
[Structured analysis]

## Implications
[What this means]

## Open Questions
[What remains unclear]
```

---

## Workflow Routing

| Workflow | Trigger | Action |
|----------|---------|--------|
| **Quick** | "find", "what is", "quick answer" | Rapid research |
| **Deep** | "research", "deep dive", "investigate" | Thorough analysis |
| **Compare** | "compare", "evaluate options" | Comparative research |

---

## Examples

**Example 1: Quick fact check**
```
User: "What's the difference between REST and GraphQL?"
-> Spawns Researcher with rapid trait
-> Returns concise comparison
```

**Example 2: Deep dive**
```
User: "Research AI agent architectures"
-> Spawns Researcher with full thorough trait
-> Returns comprehensive analysis
```

**Example 3: Comparative analysis**
```
User: "Compare these 3 frameworks"
-> Spawns Researcher with comparative trait
-> Returns structured comparison
```

---

## Handoff Triggers

| Situation | Hand to | Why |
|-----------|---------|-----|
| Research supports a decision | Strategy/ | Options + tradeoffs |
| Research for content | Writing/ | Key insights ready |
| Research for building | Coding/ | Technical findings |
| Quality review needed | Agents/BarRaiser | Verify accuracy |
