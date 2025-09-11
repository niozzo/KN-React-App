# BMAD cheat sheet
**Version:** 4.0  
**Date:** Septemeber 8, 2025  
**Workflow:** Solo Development with AI Agent Support  

## Bug Handling Flow**
**When Bugs Are Found**
[ ] @dev *rca {story-name} {bug-description}` - Perform root cause analysis for discovered bugs
[ ] @architect validate the findings and recommend the fix
[ ] @po *correct-course
[ ] @qa *risk {story-name}` - Reassess risk profile after story updates
[ ] @qa *design {story-name}` - Update test strategy for new scope and scenarios
[ ] @dev *develop-story {story-name}` - Resume development with updated story scope

# Complete BMAD Flow: From High-Level Goal to Deployment
## Phase 0: Preperation 
[x] Manual: Go to git hub and make new repositry for this project
[x] @Dev *make-feature-branch {Project}` - Create development branch

## Phase 1: Strategic Planning & Discovery
[x] @Analyst *perform-market-research - Produce Market Research report (professional events PWA)
[x] @Analyst *doc-out {market-research.md} - Publish market research document

[x] @Analyst *create-competitor-analysis - Produce Competitive Analysis report
[x] @Analyst *doc-out {competitor-analysis.md} - Publish competitive analysis document

[x] @Analyst *brainstorm {AI conference attendee app} - Facilitate structured brainstorming session
[x] @Analyst *doc-out {brainstorming-session-results.md} - Publish brainstorming results document

[x] @Analyst *create-project-brief - Create Project Brief from brainstorm + research
[x] @Analyst *doc-out  - Publish brainstorming results document

[x] @PM *prd {feature-name}` - Build comprehensive PRD for the feature

## Phase 2: Epic Planning & Story Creation
[x] @bmad-orchestrator *workflow epic-story-creation. This steps throught this flow for all epics and stories
    @PO *epic-breakdown {feature-name}` - Decompose feature into manageable epics
    @PO *epic-plan {epic-name}` - Define epic mission and business value  
    @PO *story-breakdown {epic-name}` - Break epic into focused BMAD stories

## Phase 3: Architecture & Design
[x] @Architect *create-brownfield-architecture` - Plan integration points and components
[x] @Architect what spikes do you need to prove this architecture.
[x] @ux to do mocks ups (assumes we have the new capabilty) 
[x] @architect to analysis and recommend fixes
[x] @BMAD orchextration to have arch update docs, dev, build new reference, and UX to validate 



### Do this one at a time per spike
[ ] @SM *story-checklist {story-name}` - Execute story drafting checklist for QA
[ ] @SM prep the spikes, have QA review it to make sure spike validation foloows TDD stratrgy 
[ ] @QA *risk {story-name}` - Assess integration risks and dependencies
[ ] @QA *design {story-name}` - Create test strategy (unit, integration, E2E)
[ ] @architect work on the spike 
[ ] Have a conversation between the actors to validate the architecture and tests plans post spike research
[ ] @architect prove spike findings are valid

## Development: 1 loop per story
### Phase 4: Development & Testing
@Dev *develop-story {story-name}` - Execute story with TDD approach
@qa *review test-architecture-compliance
@Dev *code-review {story-name}` - Review against architecture standards
@Dev *test-coverage {story-name}` - Analyze coverage and identify gaps

### Phase 5: Integration & Validation
@QA *trace {story-name}` - Verify test coverage and integration
@QA *nfr {story-name}` - Validate non-functional requirements
@QA *review {story-name}` - Final integration safety and regression testing

### Phase 6: Completion & Deployment
@PO *accept {story-name}` - Validate business value delivery
@Architect *update-documents` - Update architecture docs if needed
@Dev push all to git
@dev merge feature branch with main branch
@dev remove feature branch
@dev push all to git
-- if end of all of the stories in the epic
@Dev *deploy {epic-name}` - Deploy completed epic to production


### Phase 7: Prepare for next story
@SM *next-story` - Move to next story in epic
@po Is the next story ready for development

# version 5 test
# Complete BMAD Flow: From High-Level Goal to Deployment
## Phase 0: Preparation 
[x] Manual: Go to git hub and make new repositry for this project
[x] @Dev *make-feature-branch {Project}` - Create development branch

## Phase 1: Strategic Planning & Discovery
[x] @bmad-orchestrator *workflow greenfield-fullstack - Complete planning workflow (handles analyst → pm → ux → architect sequence)

## Phase 2: Document Preparation & Epic Planning
[x] @bmad-orchestrator *shard-doc docs/prd.md prd - Shard PRD for development
[x] @bmad-orchestrator *shard-doc docs/architecture.md architecture - Shard architecture for development
[x] @bmad-orchestrator *workflow epic-story-creation - Create all epics and stories

## Phase 3: Architecture & Design
[x] @Architect *create-brownfield-architecture` - Plan integration points and components
[x] @Architect what spikes do you need to prove this architecture.
[x] @ux to do mocks ups (assumes we have the new capabilty) 

### Do this one at a time per spike
[ ] @SM *story-checklist {story-name}` - Execute story drafting checklist for QA
[ ] @SM prep the spikes, have QA review it to make sure spike validation foloows TDD stratrgy 
[ ] @QA *risk {story-name}` - Assess integration risks and dependencies
[ ] @QA *design {story-name}` - Create test strategy (unit, integration, E2E)
[ ] @architect work on the spike 
[ ] Have a conversation between the actors to validate the architecture and tests plans post spike research
[ ] @architect prove spike findings are valid

## Development: 1 loop per story
### Phase 4: Development & Testing
@Dev *develop-story {story-name}` - Execute story with TDD approach
@qa *review test-architecture-compliance
@Dev *code-review {story-name}` - Review against architecture standards
@Dev *test-coverage {story-name}` - Analyze coverage and identify gaps

### Phase 5: Integration & Validation
@QA *trace {story-name}` - Verify test coverage and integration
@QA *nfr {story-name}` - Validate non-functional requirements
@QA *review {story-name}` - Final integration safety and regression testing

### Phase 6: Completion & Deployment
@PO *accept {story-name}` - Validate business value delivery
@Architect *update-documents` - Update architecture docs if needed
@Dev push all to git
@dev merge feature branch with main branch
@dev remove feature branch
@dev push all to git
-- if end of all of the stories in the epic
@Dev *deploy {epic-name}` - Deploy completed epic to production

### Phase 7: Prepare for next story
@SM *next-story` - Move to next story in epic
@po Is the next story ready for development