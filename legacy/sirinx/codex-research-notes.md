# Codex Prompting Research Notes

## Key Findings from OpenAI Codex Prompting Guide

### AGENTS.md Structure
- Files pulled from ~/.codex plus each directory from repo root to CWD
- Merged in order, later directories overriding earlier ones
- Each chunk becomes user-role message: `# AGENTS.md instructions for <directory>`
- Injected near top of conversation history, before user prompt, root-to-leaf order

### Best Practices for Enterprise Automation Prompts
1. **Autonomy & Persistence**: Act as autonomous senior engineer, proactively gather context, plan, implement, test, refine
2. **Bias to Action**: Default to implementing with reasonable assumptions
3. **Batch Operations**: Parallelize tool calls, batch file reads
4. **Code Implementation**: Optimize for correctness, clarity, reliability; follow codebase conventions
5. **Plan Tool**: Skip for simple tasks, update after sub-tasks, never end with only a plan
6. **Frontend Tasks**: Avoid AI slop, use expressive typography, clear visual direction, meaningful animations

### Recommended Prompt Structure
- Role definition (one sentence)
- General guidelines (tools, parallelism, file handling)
- Autonomy and persistence rules
- Code implementation standards
- Editing constraints
- Exploration and reading patterns
- Plan tool usage
- Frontend design guidelines
- Presentation/output format
