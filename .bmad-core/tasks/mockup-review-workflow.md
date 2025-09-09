# Mockup Review Workflow

## Purpose
Orchestrate comprehensive mockup review with QA, Dev, and Architect to ensure technical validation and identify any required changes.

## Input Parameters
- `mockup-name`: Name/identifier of the mockup to review

## Workflow Steps

### 1. Initial Mockup Assessment
- **Input**: Mockup name and any existing context
- **Action**: Present mockup details to user for confirmation
- **Output**: Confirmed mockup context and objectives

### 2. QA Review
- **Agent**: @QA
- **Command**: *review {mockup-name} or *test-design {mockup-name}
- **Purpose**: Assess mockup for testing considerations and quality implications
- **Output**: QA review and recommendations

### 3. Dev Review
- **Agent**: @Dev
- **Command**: *validate-mockup {mockup-name}
- **Purpose**: Validate technical feasibility and implementation considerations
- **Output**: Development feasibility assessment

### 4. Architect Review
- **Agent**: @Architect
- **Command**: *validate-mockup {mockup-name}
- **Purpose**: Validate architectural alignment and technical considerations
- **Output**: Architectural validation and recommendations

### 5. Synthesis and Review
- **Action**: Present all review results to user
- **Format**:
  - QA review findings
  - Dev technical assessment
  - Architect validation
  - Synthesis of all feedback
  - Identified issues and recommendations
- **Decision Point**: Wait for user to resolve issues and approve

### 6. User Decision
- **Input**: User feedback on review results
- **Options**:
  - Proceed to integration (all issues resolved)
  - Request mockup modifications
  - Request additional analysis
- **Output**: Approved mockup for integration phase

## Success Criteria
- All agents have provided comprehensive reviews
- Technical feasibility validated
- Architectural alignment confirmed
- User has resolved all issues and approved mockup
- Ready for integration phase

## Error Handling
- If any agent fails, present partial results and ask user how to proceed
- If significant issues are identified, present options for resolution
- If mockup needs major changes, coordinate with UX team
