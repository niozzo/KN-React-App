# Spike Integration Workflow

## Purpose
Update architecture documentation and user stories based on spike findings and results.

## Prerequisites
- Spike execution phase completed
- User has approved execution results
- Clear findings and recommendations available

## Workflow Steps

### 1. Review Spike Results
- **Action**: Review approved spike execution results and findings
- **Input**: Spike name, execution results, validation results, findings
- **Output**: Understanding of integration requirements

### 2. Update Architecture Documentation
- **Agent**: @Architect
- **Command**: *update-architecture-from-spike {spike-name}
- **Purpose**: Update architecture docs based on spike findings
- **Output**: Updated architecture documentation

### 3. Update User Stories
- **Agent**: @PO
- **Command**: *update-stories-from-spike {spike-name}
- **Purpose**: Update affected stories based on spike learnings
- **Output**: Updated user stories

### 4. Validate Integration Updates
- **Action**: Ensure all updates are consistent and complete
- **Validation**:
  - Architecture changes are well-documented
  - Story updates are complete and actionable
  - All changes are consistent with spike findings
- **Output**: Validated integration updates

### 5. Present Integration Summary
- **Action**: Present integration results to user
- **Format**:
  - Architecture updates summary
  - Story updates summary
  - Integration validation results
  - Next steps and recommendations
- **Output**: Complete integration report

## Success Criteria
- Architecture documentation updated with spike findings
- User stories updated to reflect learnings
- All updates are consistent and complete
- Integration is validated and documented

## Error Handling
- If architecture updates fail, present partial updates and ask user how to proceed
- If story updates create conflicts, resolve with stakeholders
- If integration is incomplete, provide analysis and recommendations
