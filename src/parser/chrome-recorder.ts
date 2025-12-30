import {
  ChromeRecording,
  ChromeRecorderSchema,
  ChromeRecorderStep,
  ParsedAction,
  ParsedRecording,
} from './types.js';
import { ParserError } from '../utils/errors.js';

/**
 * Validate and parse Chrome Recorder JSON
 */
export function parseRecording(json: unknown): ParsedRecording {
  // Validate schema with Zod
  const result = ChromeRecorderSchema.safeParse(json);

  if (!result.success) {
    throw new ParserError(
      `Invalid Chrome Recorder JSON format:\n${result.error.message}`
    );
  }

  const recording: ChromeRecording = result.data;

  // Convert steps to simplified actions
  const steps: ParsedAction[] = recording.steps
    .map((step) => convertStepToAction(step))
    .filter((action): action is ParsedAction => action !== null);

  // Get start URL
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
 * Convert Chrome Recorder step to ParsedAction
 */
function convertStepToAction(step: ChromeRecorderStep): ParsedAction | null {
  const selector = extractSelector(step.selectors);

  switch (step.type) {
    case 'navigate':
      return {
        type: 'navigate',
        url: step.url,
        description: `Navigate to page "${step.url}"`,
      };

    case 'click':
      return {
        type: 'click',
        selector,
        description: selector
          ? `Click element "${selector}"`
          : 'Click operation',
      };

    case 'change':
      return {
        type: 'change',
        selector,
        value: step.value,
        description: selector
          ? `Enter "${step.value}" in element "${selector}"`
          : `Enter "${step.value}"`,
      };

    case 'keyDown':
      return {
        type: 'keyDown',
        value: step.key,
        description: `Press key "${step.key}"`,
      };

    case 'scroll':
      return {
        type: 'scroll',
        description: 'Scroll operation',
      };

    case 'waitForElement':
    case 'waitForExpression':
      return {
        type: 'wait',
        selector,
        description: selector ? `Wait for element "${selector}"` : 'Wait',
      };

    // Configuration-related operations like setViewport are not included in Gherkin
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
 * Extract optimal selector from selector array
 */
function extractSelector(
  selectors?: string[][]
): string | undefined {
  if (!selectors || selectors.length === 0) {
    return undefined;
  }

  // Use first selector chain
  const selectorChain = selectors[0];
  if (!selectorChain || selectorChain.length === 0) {
    return undefined;
  }

  // Return most specific selector (last element)
  return selectorChain[selectorChain.length - 1];
}
