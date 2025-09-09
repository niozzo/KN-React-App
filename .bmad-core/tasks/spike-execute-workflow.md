# Spike Execute Workflow

## Purpose
Execute the spike implementation and validate results against acceptance criteria.

## Prerequisites
- Spike setup phase completed
- User has approved setup
- Clear execution plan defined

## Workflow Steps

### 1. Review Spike Setup
- **Action**: Review approved spike setup and execution plan
- **Input**: Spike name, acceptance criteria, technical approach, validation plan
- **Output**: Clear understanding of execution requirements

### 2. Execute Spike Implementation
- **Agent**: @Architect or @Dev (based on spike nature)
- **Command**: *execute-spike {spike-name}
- **Purpose**: Implement spike according to technical approach
- **Output**: Spike implementation and results

### 3. Validate Spike Results
- **Agent**: @QA
- **Command**: *validate-spike-results {spike-name}
- **Purpose**: Validate results against acceptance criteria
- **Output**: Validation results and decision

### 4. Present Execution Results
- **Action**: Present execution and validation results to user
- **Format**:
  - Implementation details
  - Validation results
  - Acceptance criteria assessment
  - Key findings and recommendations
- **Decision Point**: Wait for user confirmation before integration

### 5. User Decision
- **Input**: User feedback on execution results
- **Options**:
  - Proceed to integration
  - Request additional validation
  - Modify approach and re-execute
- **Output**: Approved results for integration phase

## Success Criteria
- Spike implementation completed
- Results validated against acceptance criteria
- User has reviewed and approved results
- Ready for integration phase

## Error Handling
- If implementation fails, present failure analysis and ask user how to proceed
- If validation fails, coordinate with implementation team for fixes
- If results are inconclusive, provide analysis and recommendations
