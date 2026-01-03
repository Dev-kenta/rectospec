import { Router, Request, Response } from 'express';
import { readTextFile } from '../../utils/file-system.js';
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
