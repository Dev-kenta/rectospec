export interface SuggestionOptions {
  currentContent: string;
  language: 'ja' | 'en';
  focusArea?: 'clarity' | 'completeness' | 'best-practices' | 'all';
}

/**
 * Build prompt for Gherkin improvement suggestions
 */
export function buildSuggestionPrompt(options: SuggestionOptions): string {
  const { currentContent, language, focusArea = 'all' } = options;

  const focusInstructions = getFocusInstructions(focusArea);

  return `You are an experienced QA engineer and an expert in BDD (Behavior-Driven Development) and Gherkin.

## Task
Analyze the following Gherkin file content and provide improvement suggestions.

## Current Gherkin
\`\`\`gherkin
${currentContent}
\`\`\`

## Focus Area
${focusInstructions}

## Output Requirements
- Output the improved Gherkin code only
- Use \`# Language: ${language}\` at the beginning
- ${language === 'ja' ? 'Write all scenario names and steps in Japanese' : 'Write all scenario names and steps in English'}
- No explanation text is needed

## Output Format
\`\`\`gherkin
# Language: ${language}
[Improved Gherkin]
\`\`\`

Output the complete Gherkin file in a markdown code block.`;
}

/**
 * Get focus-specific instructions based on the focus area
 */
function getFocusInstructions(focusArea: string): string {
  switch (focusArea) {
    case 'clarity':
      return `Focus on clarity improvements:
- Make scenario names more clear and specific
- Clarify step descriptions
- Eliminate ambiguous expressions
- Use consistent terminology`;

    case 'completeness':
      return `Focus on completeness improvements:
- Add missing preconditions
- Describe Then (expected results) specifically
- Add edge case scenarios if appropriate
- Use data tables to improve coverage`;

    case 'best-practices':
      return `Focus on best practice improvements:
- Use Background/Scenario Outline/Examples appropriately
- Follow the one scenario one purpose principle
- Properly distinguish Given/When/Then roles
- Focus on behavior rather than implementation details`;

    case 'all':
    default:
      return `Comprehensive improvements:
- Clarity: Make scenario names and steps understandable
- Completeness: Add missing preconditions and expected results
- Best Practices: Follow Gherkin principles in structure
- Maintainability: Use consistent terminology and structure`;
  }
}
