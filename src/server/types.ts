import { z } from 'zod';
import { Server } from 'http';

/**
 * Server configuration schema
 */
export const ServerConfigSchema = z.object({
  port: z.number().int().min(1).max(65535).default(3000),
  host: z.string().default('localhost'),
});

/**
 * Server configuration type
 */
export type ServerConfig = z.infer<typeof ServerConfigSchema>;

/**
 * Running server instance information
 */
export interface ServerInstance {
  server: Server;
  port: number;
  host: string;
  url: string;
}
