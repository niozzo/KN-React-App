# Bug Resolution Workflow

## Purpose
Execute bug resolution with coordinated implementation, validation, and documentation updates.

## Prerequisites
- Bug analysis phase completed
- User has approved approach
- Clear resolution path defined

## Workflow Steps

### 1. Scope and Approach Decision
- **Agent**: @PO
- **Command**: *bug-resolution-decision {story-name} {bug-description}
- **Purpose**: Make final decision on fix approach and determine scope
- **Output**: Approved resolution approach and scope determination

### 2. Scope Determination
- **Agent**: @PO
- **Command**: *determine-bug-scope {story-name} {bug-description}
- **Purpose**: Decide if bug is in-scope for current story or needs separate story
- **Output**: Scope decision (in-scope vs. separate story)

### 3. Implementation
- **Agent**: @Dev
- **Command**: *implement-bug-fix {story-name} {bug-description}
- **Purpose**: Implement the approved fix
- **Output**: Implemented fix with implementation notes

### 4. Validation and Testing
- **Agent**: @QA
- **Command**: *validate-bug-fix {story-name} {bug-description}
- **Purpose**: Validate fix and perform regression testing
- **Output**: Validation results and test coverage report

### 5. Documentation Updates
- **Agent**: @Architect
- **Command**: *update-docs-from-bug {story-name} {bug-description}
- **Purpose**: Update architecture and technical documentation based on bug learnings
- **Output**: Updated documentation reflecting bug resolution

### 6. Final Validation
- **Action**: Present resolution summary to user
- **Format**:
  - Implementation details
  - Validation results
  - Documentation updates
  - Scope impact
- **Output**: Complete resolution report

## Success Criteria
- Bug fix implemented and validated
- All relevant documentation updated
- Scope properly determined and handled
- User confirms resolution is complete

## Error Handling
- If implementation fails, present error details and ask user how to proceed
- If validation fails, coordinate with Dev for additional fixes
- If documentation updates fail, present partial updates and ask user how to proceed
- If scope determination is unclear, present options to user for decision

## Scope Handling
- **In-scope bugs**: Update current story documentation
- **Separate story bugs**: Create new story with proper documentation
- **Architecture bugs**: Update architecture docs regardless of scope
