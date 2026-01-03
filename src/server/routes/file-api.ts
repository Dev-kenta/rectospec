import { Router, Request, Response } from 'express';
import { readTextFile, writeTextFile } from '../../utils/file-system.js';
import { FileSystemError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

/**
 * File API router for reading and writing Gherkin files
 */
export const fileApiRouter = Router();

/**
 * GET /api/file - Read file content
 * Query params:
 *   - path: File path to read
 */
fileApiRouter.get('/file', async (req: Request, res: Response) => {
  try {
    const filePath = req.query.path as string;

    if (!filePath) {
      res.status(400).json({
        error: 'File path is required',
        message: 'Please provide a file path via the "path" query parameter',
      });
      return;
    }

    // Validate file extension
    if (!filePath.endsWith('.feature')) {
      res.status(400).json({
        error: 'Invalid file type',
        message: 'Only .feature files are supported',
      });
      return;
    }

    // Read file content
    const content = await readTextFile(filePath);

    res.json({
      success: true,
      content,
      path: filePath,
    });
  } catch (error) {
    if (error instanceof FileSystemError) {
      logger.error(`File API error: ${error.message}`);
      res.status(404).json({
        error: 'File not found',
        message: error.message,
      });
    } else if (error instanceof Error) {
      logger.error(`Unexpected error in file API: ${error.message}`);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    } else {
      logger.error('Unknown error in file API');
      res.status(500).json({
        error: 'Internal server error',
        message: 'Unknown error occurred',
      });
    }
  }
});

/**
 * POST /api/file - Write file content
 * Request body:
 *   - path: File path to write
 *   - content: File content to write
 */
fileApiRouter.post('/file', async (req: Request, res: Response) => {
  try {
    const { path: filePath, content } = req.body;

    if (!filePath) {
      res.status(400).json({
        error: 'File path is required',
        message: 'Please provide a file path in the request body',
      });
      return;
    }

    if (content === undefined || content === null) {
      res.status(400).json({
        error: 'Content is required',
        message: 'Please provide content in the request body',
      });
      return;
    }

    // Validate file extension
    if (!filePath.endsWith('.feature')) {
      res.status(400).json({
        error: 'Invalid file type',
        message: 'Only .feature files are supported',
      });
      return;
    }

    // Write file content
    await writeTextFile(filePath, content);

    logger.info(`File saved: ${filePath}`);

    res.json({
      success: true,
      path: filePath,
      message: 'File saved successfully',
    });
  } catch (error) {
    if (error instanceof FileSystemError) {
      logger.error(`File save error: ${error.message}`);
      res.status(500).json({
        error: 'Failed to save file',
        message: error.message,
      });
    } else if (error instanceof Error) {
      logger.error(`Unexpected error saving file: ${error.message}`);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    } else {
      logger.error('Unknown error saving file');
      res.status(500).json({
        error: 'Internal server error',
        message: 'Unknown error occurred',
      });
    }
  }
});
