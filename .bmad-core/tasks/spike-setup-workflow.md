# Spike Setup Workflow

## Purpose
Orchestrate the spike setup phase by coordinating PO, Architect, and QA to define acceptance criteria, technical approach, and validation plan.

## Input Parameters
- `spike-name`: Name/identifier of the spike

## Workflow Steps

### 1. Initial Spike Assessment
- **Input**: Spike name and any existing context
- **Action**: Present spike details to user for confirmation
- **Output**: Confirmed spike context and objectives

### 2. Define Acceptance Criteria
- **Agent**: @PO
- **Command**: *define-spike-acceptance-criteria {spike-name}
- **Purpose**: Define clear success criteria and validation requirements
- **Output**: Spike acceptance criteria

### 3. Define Technical Approach
- **Agent**: @Architect
- **Command**: *spike-technical-approach {spike-name}
- **Purpose**: Define technical approach and proof points
- **Output**: Technical approach specification

### 4. Create Validation Plan
- **Agent**: @QA
- **Command**: *spike-validation-plan {spike-name}
- **Purpose**: Create validation plan based on acceptance criteria
- **Output**: Spike validation plan

### 5. Synthesis and Review
- **Action**: Present all setup results to user
- **Format**:
  - PO acceptance criteria
  - Architect technical approach
  - QA validation plan
  - Synthesis of setup
- **Decision Point**: Wait for user approval to proceed to execution

### 6. User Decision
- **Input**: User feedback on setup
- **Options**:
  - Proceed to execution
  - Request modifications
  - Cancel spike
- **Output**: Approved setup for execution phase

## Success Criteria
- Clear acceptance criteria defined
- Technical approach specified
- Validation plan created
- User has reviewed and approved setup
- Ready for execution phase

## Error Handling
- If any agent fails, present partial results and ask user how to proceed
- If user rejects setup, restart with modified parameters
- If critical information missing, request additional details
