# BMAD Agent Integration for Cursor

This directory contains Cursor rules for BMAD Method agents, enabling you to use the `@` symbol to reference agents directly in your IDE.

## Available Agents

- `@analyst` - Business Analyst (Mary) - Market research, brainstorming, project briefs
- `@pm` - Product Manager (Sarah) - PRDs, requirements, epics, stories
- `@architect` - System Architect (Alex) - Architecture, tech stack, system design
- `@dev` - Developer (Jordan) - Implementation, code quality, technical solutions
- `@qa` - Quality Assurance (Taylor) - Testing, quality assessment, bug analysis
- `@ux` - UX Expert (Casey) - User experience, design, usability
- `@po` - Product Owner (Morgan) - Backlog management, prioritization, value delivery
- `@sm` - Scrum Master (Riley) - Agile facilitation, team coaching, process improvement
- `@bmad` - BMAD Master (Sage) - Workflow orchestration, strategic guidance

## Usage

1. Type `@` followed by the agent name (e.g., `@pm`, `@analyst`)
2. The agent will activate with their persona and capabilities
3. Use agent-specific commands with `*` prefix (e.g., `*create-prd`, `*brainstorm`)
4. Each agent has specialized knowledge and workflows for their domain

## Example Usage

```
@pm Create a PRD for a task management app
@analyst Perform market research on project management tools
@architect Design the system architecture for our React app
@dev Implement the user authentication feature
@qa Create a test plan for the login functionality
```

## Integration Notes

- Each agent file (`.mdc`) contains the complete agent definition
- Agents are designed to work together in BMAD workflows
- Use `@bmad` for complex multi-agent coordination
- Refer to `.bmad-core/` directory for detailed agent configurations and tasks

