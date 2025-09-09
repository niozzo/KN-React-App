# Bug Analysis Workflow

## Purpose
Orchestrate comprehensive bug analysis with input from all relevant agents before proceeding to resolution.

## Workflow Steps

### 1. Initial Bug Assessment
- **Input**: Story name, bug description
- **Action**: Present bug details to user for confirmation
- **Output**: Confirmed bug details

### 2. Root Cause Analysis
- **Agent**: @Dev
- **Command**: *rca {story-name} {bug-description}
- **Purpose**: Identify technical root cause and initial fix approach
- **Output**: RCA report with technical findings

### 3. Technical Validation
- **Agent**: @Architect
- **Command**: *validate-bug-fix-approach {story-name} {bug-description}
- **Purpose**: Validate technical approach and assess architectural impact
- **Output**: Technical validation and impact assessment

### 4. Quality Impact Assessment
- **Agent**: @QA
- **Command**: *assess-bug-impact {story-name} {bug-description}
- **Purpose**: Assess testing impact, regression risk, and quality implications
- **Output**: Quality impact assessment and testing recommendations

### 5. Synthesis and Recommendations
- **Action**: Present all agent findings to user
- **Format**: 
  - Dev RCA findings
  - Architect technical validation
  - QA impact assessment
  - Synthesized recommendations
- **Decision Point**: Wait for user feedback and approval

### 6. User Decision
- **Input**: User feedback on recommendations
- **Options**: 
  - Proceed to resolution
  - Request additional analysis
  - Modify approach
- **Output**: Approved approach for resolution phase

## Success Criteria
- All agents have provided input
- User has reviewed and approved approach
- Clear path forward for resolution phase
- Documentation of all findings and decisions

## Error Handling
- If any agent fails, present partial findings and ask user how to proceed
- If user rejects approach, restart analysis with modified parameters
- If critical information missing, request additional details from user
