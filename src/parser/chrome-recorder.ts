import {
  ChromeRecording,
  ChromeRecorderSchema,
  ChromeRecorderStep,
  ParsedAction,
  ParsedRecording,
} from './types.js';
import { ParserError } from '../utils/errors.js';

/**
 * Chrome Recorder JSON を検証してパース
 */
export function parseRecording(json: unknown): ParsedRecording {
  // Zodでスキーマ検証
  const result = ChromeRecorderSchema.safeParse(json);

  if (!result.success) {
    throw new ParserError(
      `Chrome Recorder JSON の形式が不正です:\n${result.error.message}`
    );
  }

  const recording: ChromeRecording = result.data;

  // ステップを簡略化されたアクションに変換
  const steps: ParsedAction[] = recording.steps
    .map((step) => convertStepToAction(step))
    .filter((action): action is ParsedAction => action !== null);

  // 開始URLを取得
  const navigateStep = recording.steps.find((s) => s.type === 'navigate');
  const startUrl = navigateStep?.url || 'unknown';

  return {
    title: recording.title,
    steps,
    metadata: {
      url: startUrl,
      stepCount: steps.length,
    },
  };
}

/**
 * Chrome Recorder のステップを ParsedAction に変換
 */
function convertStepToAction(step: ChromeRecorderStep): ParsedAction | null {
  const selector = extractSelector(step.selectors);

  switch (step.type) {
    case 'navigate':
      return {
        type: 'navigate',
        url: step.url,
        description: `ページ「${step.url}」に移動`,
      };

    case 'click':
      return {
        type: 'click',
        selector,
        description: selector
          ? `要素「${selector}」をクリック`
          : 'クリック操作',
      };

    case 'change':
      return {
        type: 'change',
        selector,
        value: step.value,
        description: selector
          ? `要素「${selector}」に「${step.value}」を入力`
          : `「${step.value}」を入力`,
      };

    case 'keyDown':
      return {
        type: 'keyDown',
        value: step.key,
        description: `キー「${step.key}」を押下`,
      };

    case 'scroll':
      return {
        type: 'scroll',
        description: 'スクロール操作',
      };

    case 'waitForElement':
    case 'waitForExpression':
      return {
        type: 'wait',
        selector,
        description: selector ? `要素「${selector}」を待機` : '待機',
      };

    // setViewport などの設定系は Gherkin に含めない
    case 'setViewport':
    case 'hover':
    case 'doubleClick':
    case 'keyUp':
      return null;

    default:
      return null;
  }
}

/**
 * セレクタ配列から最適なセレクタを抽出
 */
function extractSelector(
  selectors?: string[][]
): string | undefined {
  if (!selectors || selectors.length === 0) {
    return undefined;
  }

  // 最初のセレクタチェーンを使用
  const selectorChain = selectors[0];
  if (!selectorChain || selectorChain.length === 0) {
    return undefined;
  }

  // 最も具体的なセレクタ（最後の要素）を返す
  return selectorChain[selectorChain.length - 1];
}
