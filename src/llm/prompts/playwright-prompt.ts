export interface PlaywrightGenerationOptions {
  typescript: boolean;
  framework: 'playwright';
}

/**
 * Build prompt for Playwright code generation from Gherkin
 */
export function buildPlaywrightPrompt(
  gherkinContent: string,
  options: PlaywrightGenerationOptions
): string {
  const { typescript, framework } = options;

  const language = typescript ? 'TypeScript' : 'JavaScript';
  const extension = typescript ? 'ts' : 'js';

  return `You are an expert test automation engineer specializing in Playwright and the Page Object Model pattern.

## Task
Generate ${framework} test code from the following Gherkin specification.

## Gherkin Specification
\`\`\`gherkin
${gherkinContent}
\`\`\`

## Requirements
- Use the Page Object Model (POM) pattern
- Generate ${language} code
- Follow Playwright best practices
- Use modern async/await syntax
- Include proper type annotations${typescript ? ' (TypeScript)' : ''}
- Use data-testid selectors when possible, fallback to CSS selectors
- Include proper error handling
- Add helpful comments in English

## Output Structure
Generate THREE separate files:

### 1. Page Object Class (pages/[PageName].${extension})
- Export a class representing the page
- Include locators as class properties
- Include action methods (e.g., login, fillForm)
- Include assertion methods (e.g., expectErrorMessage)

### 2. Test Spec File (specs/[feature-name].spec.${extension})
- Import the Page Object class
- Implement test scenarios from the Gherkin
- Use describe/test blocks
- Follow the Given/When/Then structure in comments
- Include proper setup and teardown

### 3. Test Data Fixtures (fixtures/[feature-name]-data.${extension})
- Export test data objects
- Include valid and invalid test data
- Make it easy to reuse across tests

## Output Format
Output ONLY a JSON object with the following structure (no explanation text):

\`\`\`json
{
  "pageObject": {
    "filename": "pages/LoginPage.${extension}",
    "code": "..."
  },
  "testSpec": {
    "filename": "specs/login.spec.${extension}",
    "code": "..."
  },
  "testData": {
    "filename": "fixtures/login-data.${extension}",
    "code": "..."
  }
}
\`\`\`

Important: Output only the JSON object above. Do not include any markdown code blocks or explanations.`;
}
