import { z } from 'zod/v3';

/**
 * Chrome Recorder step type
 */
export const ChromeRecorderStepSchema = z.object({
  type: z.enum([
    'navigate',
    'click',
    'change',
    'keyDown',
    'keyUp',
    'scroll',
    'doubleClick',
    'hover',
    'setViewport',
    'waitForElement',
    'waitForExpression',
  ]),
  url: z.string().optional(),
  selectors: z.array(z.array(z.string())).optional(),
  offsetX: z.number().optional(),
  offsetY: z.number().optional(),
  target: z.string().optional(),
  frame: z.array(z.number()).optional(),
  assertedEvents: z
    .array(
      z.object({
        type: z.string(),
        title: z.string().optional(),
        url: z.string().optional(),
      })
    )
    .optional(),
  value: z.string().optional(),
  key: z.string().optional(),
  operator: z.string().optional(),
  count: z.number().optional(),
  expression: z.string().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  deviceScaleFactor: z.number().optional(),
  isMobile: z.boolean().optional(),
  hasTouch: z.boolean().optional(),
  isLandscape: z.boolean().optional(),
});

/**
 * Chrome Recorder full recording
 */
export const ChromeRecorderSchema = z.object({
  title: z.string(),
  steps: z.array(ChromeRecorderStepSchema),
  timeout: z.number().optional(),
});

export type ChromeRecorderStep = z.infer<typeof ChromeRecorderStepSchema>;
export type ChromeRecording = z.infer<typeof ChromeRecorderSchema>;

/**
 * Parsed action (simplified format)
 */
export interface ParsedAction {
  type: 'navigate' | 'click' | 'type' | 'change' | 'keyDown' | 'scroll' | 'wait';
  selector?: string;
  value?: string;
  url?: string;
  description: string;
}

/**
 * Parsed recording
 */
export interface ParsedRecording {
  title: string;
  steps: ParsedAction[];
  metadata: {
    url: string;
    stepCount: number;
  };
}
