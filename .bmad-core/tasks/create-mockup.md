# Create Mockup Task

## Purpose
Generate full-page responsive mockups with connected navigation to validate UX before building the real application. These mockups use realistic placeholder data based on the actual database structure and communicate look, feel, content, and navigation of the entire application.

## Requirements

### 1. Full Page Mockups
- Create complete page layouts using the front-end technology specified in the project documentation
- Generate full-page mockups, not just components
- Read project docs to discover tech stack (don't hardcode assumptions)

### 2. Data-Driven Placeholder Content
- Use realistic placeholder data that matches the actual database structure and field types
- Reference existing architecture docs to understand what data entities/fields are available
- Avoid making up data that doesn't exist in the actual schema
- Static content is fine, but dynamic data should be realistic and match data types
- Use placeholder data that fits the data type and label

### 3. Connected Navigation Flow
- Link pages together to show user journeys
- No need for state management or dynamic behavior
- Show the logical flow between screens
- Connect screens but can be dumb connections - just link to the page that would be next

### 4. Technical Implementation
- Make mockups responsive and mobile-friendly for PWA
- Use Material Design framework (as specified in project docs)
- Don't hardcode the tech stack - read it from documentation
- Follow existing project documentation and UX best practices

### 5. Stakeholder Validation
- Design for stakeholder review and feedback
- Plan for iterative refinement based on feedback
- Follow usability best practices

## Workflow

1. **Read Project Documentation**
   - Discover front-end technology stack from project docs
   - Understand data structure from database/architecture docs
   - Identify front end technologies to use

2. **Analyze Data Structure**
   - Review database schema and entity relationships
   - Identify available data fields and types
   - Create realistic placeholder data that matches actual structure

3. **Design User Flows**
   - Map out key user journeys based on the front end spec document
   - Identify pages/screens needed
   - Plan navigation connections between screens

4. **Generate Mockups**
   - Create full-page HTML/CSS mockups based on the branding document and the design tokens
   - Use discovered tech stack and framework
   - Add realistic placeholder data based on actual schema

5. **Connect Navigation**
   - Link pages together with simple href connections
   - Show logical user flow progression
   - No state management needed

6. **Validate & Iterate**
   - Present mockups for stakeholder review
   - Gather feedback for refinement
   - Iterate based on feedback

## Output
- Full-page responsive mockups in HTML/CSS
- Connected navigation between pages
- Realistic placeholder data matching actual database structure
- Mobile-friendly PWA design
- Material Design implementation

## Success Criteria
- Mockups accurately represent the intended user experience
- Placeholder data is realistic and matches actual data structure
- Navigation flows are logical and intuitive
- Design is responsive and follows project tech stack
- Stakeholders can provide meaningful feedback for iteration
