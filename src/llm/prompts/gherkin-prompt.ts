import { ParsedRecording } from '../../parser/types.js';

export interface GherkinGenerationOptions {
  language: 'ja' | 'en';
  includeEdgeCases: boolean;
}

/**
 * Build prompt for Gherkin generation
 */
export function buildGherkinPrompt(
  recording: ParsedRecording,
  options: GherkinGenerationOptions
): string {
  const { language, includeEdgeCases } = options;

  const stepsDescription = recording.steps
    .map((step, index) => `${index + 1}. ${step.description}`)
    .join('\n');

  if (language === 'ja') {
    return `あなたは経験豊富なQAエンジニアで、BDD（振る舞い駆動開発）とGherkinのエキスパートです。

## タスク
以下のブラウザ操作記録から、Gherkin形式のテストケースを生成してください。

## 操作記録
タイトル: ${recording.title}
開始URL: ${recording.metadata.url}

操作ステップ:
${stepsDescription}

## 要件
- Feature, Scenario, Given/When/Then の構造で出力してください
- 操作の意図を推測して、自然な日本語で記述してください
- Background を使って共通の前提条件をまとめてください
- Then（期待結果）は具体的に記述してください。ただし、操作記録からは明確にわからない場合は [TODO: 期待結果を追加] としてプレースホルダーを配置してください
- 複数のシナリオに分割できる場合は、適切に分割してください
${
  includeEdgeCases
    ? '- 正常系のシナリオに加えて、エッジケース（異常系）のシナリオも2-3個提案してください'
    : ''
}

## 出力形式
以下の形式でGherkinを出力してください:

\`\`\`gherkin
# Language: ja
Feature: [機能の説明]

  Background:
    Given [共通の前提条件]

  Scenario: [正常系シナリオの名前]
    Given [前提条件]
    When [操作]
    And [追加の操作]
    Then [期待結果]
${
  includeEdgeCases
    ? `
  Scenario: [エッジケースシナリオの名前]
    Given [前提条件]
    When [操作]
    Then [期待結果]
`
    : ''
}
\`\`\`

出力はGherkinコードのみを含めてください。説明文は不要です。`;
  } else {
    // English version
    return `You are an experienced QA engineer and an expert in BDD (Behavior-Driven Development) and Gherkin.

## Task
Generate a Gherkin test case from the following browser operation recording.

## Operation Recording
Title: ${recording.title}
Start URL: ${recording.metadata.url}

Operation Steps:
${stepsDescription}

## Requirements
- Output in Feature, Scenario, Given/When/Then structure
- Infer the intent of operations and describe in natural English
- Use Background to group common preconditions
- Describe Then (expected results) specifically. If unclear from the recording, use [TODO: Add expected result] as a placeholder
- Split into multiple scenarios if appropriate
${
  includeEdgeCases
    ? '- In addition to happy path scenarios, suggest 2-3 edge case scenarios'
    : ''
}

## Output Format
Output Gherkin in the following format:

\`\`\`gherkin
# Language: en
Feature: [Feature description]

  Background:
    Given [Common preconditions]

  Scenario: [Happy path scenario name]
    Given [Precondition]
    When [Action]
    And [Additional action]
    Then [Expected result]
${
  includeEdgeCases
    ? `
  Scenario: [Edge case scenario name]
    Given [Precondition]
    When [Action]
    Then [Expected result]
`
    : ''
}
\`\`\`

Output only the Gherkin code. No explanation text is needed.`;
  }
}
