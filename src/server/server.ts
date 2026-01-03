import express, { Express } from 'express';
import { Server } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { ServerConfig, ServerConfigSchema, ServerInstance } from './types.js';
import { findAvailablePort } from '../utils/port-finder.js';
import { logger } from '../utils/logger.js';

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Editor server for serving the web-based Gherkin editor
 */
export class EditorServer {
  private app: Express;
  private server: Server | null = null;
  private config: ServerConfig;

  constructor(config: Partial<ServerConfig> = {}) {
    this.config = ServerConfigSchema.parse(config);
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Serve static files from public directory
    const publicDir = path.join(__dirname, 'public');
    this.app.use(express.static(publicDir));
  }

  /**
   * Setup Express routes
   */
  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (_req, res) => {
      res.json({ status: 'ok' });
    });
  }

  /**
   * Start the server
   * @returns Promise that resolves to ServerInstance
   */
  async start(): Promise<ServerInstance> {
    if (this.server) {
      throw new Error('Server is already running');
    }

    try {
      // Find an available port
      const port = await findAvailablePort(this.config.port);

      if (port !== this.config.port) {
        logger.warn(
          `Port ${this.config.port} is in use. Using port ${port} instead.`
        );
      }

      // Start the server
      await new Promise<void>((resolve, reject) => {
        this.server = this.app.listen(port, this.config.host, () => {
          resolve();
        });
        this.server.once('error', reject);
      });

      const url = `http://${this.config.host}:${port}`;
      logger.success(`Server started at ${url}`);

      return {
        server: this.server,
        port,
        host: this.config.host,
        url,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to start server: ${error.message}`);
      }
      throw new Error('Failed to start server: Unknown error');
    }
  }

  /**
   * Shutdown the server gracefully
   * @returns Promise that resolves when server is closed
   */
  async shutdown(): Promise<void> {
    if (!this.server) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.server!.close((err) => {
        if (err) {
          reject(err);
        } else {
          this.server = null;
          logger.info('Server shut down successfully');
          resolve();
        }
      });
    });
  }

  /**
   * Get the Express app instance
   * @returns Express app
   */
  getApp(): Express {
    return this.app;
  }
}
