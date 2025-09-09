# Complete BMAD Flow: From High-Level Goal to Deployment (Solo Developer Optimized) - Draft v2

## Phase 0: Preparation 
[ ] Manual: Go to git hub and make new repositry for this project
[ ] @dev setup local development environment and tooling (natural language)
[ ] @dev configure basic CI/CD pipeline (GitHub Actions) (natural language)

## Phase 1: Strategic Planning & Discovery
[ ] @bmad-orchestrator *workflow-guidance - Get help selecting the right planning workflow
[ ] @analyst *task create-deep-research-prompt - Produce Market Research report (professional events PWA)
[ ] @analyst *task create-doc - Publish market research document
[ ] @analyst *task create-deep-research-prompt - Produce Competitive Analysis report
[ ] @analyst *task create-doc - Publish competitive analysis document
[ ] @analyst *task facilitate-brainstorming-session - Facilitate structured brainstorming session
[ ] @analyst *task create-doc - Publish brainstorming results document
[ ] @analyst *task create-doc - Create Project Brief from brainstorm + research
[ ] @pm *task create-doc - Build comprehensive PRD for the feature

## Phase 2: Document Preparation & Epic Planning
[ ] @bmad-orchestrator *task shard-doc docs/prd.md prd - Shard PRD for development
[ ] @bmad-orchestrator *task shard-doc docs/architecture.md architecture - Shard architecture for development
[ ] @po *task create-next-story - Create all epics and stories
[ ] @po *task create-story - Create story for basic conference information (WiFi, venue details, emergency contacts)
[ ] @po *task create-story - Create story for session feedback system (ratings, comments, anonymous option)
[ ] @po *task create-story - Create story for post-conference content hub (recordings, networking, resources)

## Phase 3: Architecture & Design
[ ] @architect *task create-brownfield-story - Plan integration points and components
[ ] @architect what spikes do you need to prove this architecture? (natural language)
[ ] @ux-expert *task create-mockup - Create initial mockups
[ ] @bmad-orchestrator *mockup-review {mockup-name} - Orchestrate mockup review with QA/Dev/Architect
[ ] @bmad-orchestrator *mockup-integration {mockup-name} - Update stories and create mockup references
[ ] @dev validate core technology choices and setup backup strategy (natural language)

### Do this one at a time per spike
[ ] @bmad-orchestrator *spike-setup {spike-name} - Orchestrate spike setup phase (PO acceptance criteria, Architect technical approach, QA validation plan)
[ ] @bmad-orchestrator *spike-execute {spike-name} - Execute spike and validate results (Architect/Dev execution, QA validation)
[ ] @bmad-orchestrator *spike-integration {spike-name} - Update architecture and stories from spike findings (Architect docs, PO stories)

## Development: 1 loop per story

### Phase 4: Development & Testing
[ ] @dev *task create-next-story - Execute story with TDD approach
[ ] @dev *task apply-qa-fixes - Use AI tools for code review (solo alternative)
[ ] @dev *task test-design - Analyze coverage and ensure tests run in CI pipeline

### Phase 5: Integration & Validation
[ ] @qa *task trace-requirements {story-name} - Verify test coverage and integration
[ ] @qa *task nfr-assess {story-name} - Validate non-functional requirements
[ ] @qa *task review-story {story-name} - Final integration safety and regression testing

### Phase 6: Completion & Deployment
[ ] @po *task validate-next-story {story-name} - Validate business value delivery
[ ] @architect *task document-project - Update architecture docs if needed
[ ] @dev push all to git (manual command)
[ ] @dev merge feature branch with main branch (manual command)
[ ] @dev remove feature branch (manual command)
[ ] @dev push all to git (manual command)
-- if end of all of the stories in the epic
[ ] @dev deploy completed epic to production (natural language)
[ ] @dev configure basic monitoring and health checks (natural language)

### Phase 7: Prepare for next story
[ ] @sm *task create-next-story - Move to next story in epic
[ ] @po Is the next story ready for development? (natural language)

## Phase 8: Production Readiness (Solo Optimized)
[ ] @dev run basic load testing and optimization (natural language)
[ ] @dev run security scans and fix vulnerabilities (natural language)
[ ] @dev ensure fully automated deployment (natural language)
[ ] @dev test rollback procedures (natural language)

## Phase 9: Launch & Post-Launch
[ ] @qa *task review-story {story-name} - Final validation before launch
[ ] @dev deploy to production (natural language)
[ ] @dev monitor for issues and gather feedback (natural language)
[ ] @dev *task document-project - Update docs based on real-world usage

# Bug Handling Flow
**When Bugs Are Found**
[ ] @bmad-orchestrator *bug-analysis {story-name} {bug-description} - Orchestrate bug analysis phase with all agents
[ ] @bmad-orchestrator *bug-resolution {story-name} {bug-description} - Execute bug resolution phase with all agents
