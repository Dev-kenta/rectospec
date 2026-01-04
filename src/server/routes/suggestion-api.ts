import { Router, Request, Response } from 'express';
import { generateSuggestion } from '../../llm/provider.js';
import { SuggestionOptions } from '../../llm/prompts/suggestion-prompt.js';
import { LLMError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

/**
 * Suggestion API router for AI-powered Gherkin improvements
 */
export const suggestionApiRouter = Router();

/**
 * POST /api/suggest - Generate Gherkin improvement suggestions
 * Request body:
 *   - content: Current Gherkin content
 *   - language: Output language (ja/en)
 *   - focusArea: Focus area for improvements (optional)
 */
suggestionApiRouter.post('/suggest', async (req: Request, res: Response) => {
  try {
    const { content, language, focusArea } = req.body;

    // Validation
    if (!content) {
      res.status(400).json({
        error: 'Content is required',
        message: 'Please provide Gherkin content in the request body',
      });
      return;
    }

    if (!language || !['ja', 'en'].includes(language)) {
      res.status(400).json({
        error: 'Invalid language',
        message: 'Language must be either "ja" or "en"',
      });
      return;
    }

    if (
      focusArea &&
      !['clarity', 'completeness', 'best-practices', 'all'].includes(focusArea)
    ) {
      res.status(400).json({
        error: 'Invalid focus area',
        message:
          'Focus area must be one of: clarity, completeness, best-practices, all',
      });
      return;
    }

    // Build options
    const options: SuggestionOptions = {
      currentContent: content,
      language: language as 'ja' | 'en',
      focusArea: focusArea || 'all',
    };

    logger.info(
      `Generating suggestion (language: ${language}, focus: ${options.focusArea})`
    );

    // Generate suggestion
    const suggestion = await generateSuggestion(options);

    logger.info('Suggestion generated successfully');

    res.json({
      success: true,
      suggestion,
      language,
      focusArea: options.focusArea,
    });
  } catch (error) {
    if (error instanceof LLMError) {
      logger.error(`LLM error: ${error.message}`);
      res.status(500).json({
        error: 'Failed to generate suggestion',
        message: error.message,
        provider: error.provider,
      });
    } else if (error instanceof Error) {
      logger.error(`Unexpected error: ${error.message}`);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    } else {
      logger.error('Unknown error in suggestion API');
      res.status(500).json({
        error: 'Internal server error',
        message: 'Unknown error occurred',
      });
    }
  }
});
