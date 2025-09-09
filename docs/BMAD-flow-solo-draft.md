# Complete BMAD Flow: From High-Level Goal to Deployment (Solo Developer Optimized)

## Phase 0: Preparation 
[ ] Manual: Go to git hub and make new repositry for this project
[ ] @Dev create development branch for {Project}
[ ] @Dev setup local development environment and tooling
[ ] @Dev configure basic CI/CD pipeline (GitHub Actions)

## Phase 1: Strategic Planning & Discovery
[ ] @bmad-orchestrator *workflow greenfield-fullstack - Complete planning workflow (handles analyst → pm → ux → architect sequence)

## Phase 2: Document Preparation & Epic Planning
[ ] @bmad-orchestrator *shard-doc docs/prd.md prd - Shard PRD for development
[ ] @bmad-orchestrator *shard-doc docs/architecture.md architecture - Shard architecture for development
[ ] @bmad-orchestrator *workflow epic-story-creation - Create all epics and stories

## Phase 3: Architecture & Design
[ ] @Architect *create-brownfield-architecture` - Replace with greenfield  as needed. Plan integration points and components
[ ] @Architect what spikes do you need to prove this architecture.
[ ] @ux *create-mockup - Create initial mockups
[ ] @bmad-orchestrator *mockup-review {mockup-name} - Orchestrate mockup review with QA/Dev/Architect
[ ] @bmad-orchestrator *mockup-integration {mockup-name} - Update stories and create mockup references
[ ] @Dev validate core technology choices and setup backup strategy

### Do this one at a time per spike
[ ] @bmad-orchestrator *spike-setup {spike-name} - Orchestrate spike setup phase (PO acceptance criteria, Architect technical approach, QA validation plan)
[ ] @bmad-orchestrator *spike-execute {spike-name} - Execute spike and validate results (Architect/Dev execution, QA validation)
[ ] @bmad-orchestrator *spike-integration {spike-name} - Update architecture and stories from spike findings (Architect docs, PO stories)

## Development: 1 loop per story

### Phase 4: Development & Testing
[ ] @Dev *develop-story {story-name}` - Execute story with TDD approach
[ ] @Dev *review-qa - Use AI tools for code review (solo alternative)
[ ] @Dev *run-tests - Analyze coverage and ensure tests run in CI pipeline

### Phase 5: Integration & Validation
[ ] @QA *trace {story-name}` - Verify test coverage and integration
[ ] @QA *nfr {story-name}` - Validate non-functional requirements
[ ] @QA *review {story-name}` - Final integration safety and regression testing

### Phase 6: Completion & Deployment
[ ] @PO *validate-story-draft {story-name}` - Validate business value delivery
[ ] @Architect *document-project - Update architecture docs if needed
[ ] @Dev push all to git
[ ] @dev merge feature branch with main branch
[ ] @dev remove feature branch
[ ] @dev push all to git
-- if end of all of the stories in the epic
[ ] @Dev deploy completed epic to production
[ ] @Dev configure basic monitoring and health checks

### Phase 7: Prepare for next story
[ ] @SM *draft - Move to next story in epic
[ ] @po Is the next story ready for development

## Phase 8: Production Readiness (Solo Optimized)
[ ] @Dev run basic load testing and optimization
[ ] @Dev run security scans and fix vulnerabilities
[ ] @Dev ensure fully automated deployment
[ ] @Dev test rollback procedures

## Phase 9: Launch & Post-Launch
[ ] @QA *review {story-name} - Final validation before launch
[ ] @Dev deploy to production
[ ] @Dev monitor for issues and gather feedback
[ ] @Dev *explain - Update docs based on real-world usage

# Bug Handling Flow
**When Bugs Are Found**
[ ] @bmad-orchestrator *bug-analysis {story-name} {bug-description} - Orchestrate bug analysis phase with all agents
[ ] @bmad-orchestrator *bug-resolution {story-name} {bug-description} - Execute bug resolution phase with all agents