import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EditorServer } from '../../src/server/server.js';
import { ServerInstance } from '../../src/server/types.js';

describe('EditorServer Integration Tests', () => {
  let server: EditorServer;
  let instance: ServerInstance | null = null;

  beforeEach(() => {
    server = new EditorServer({ port: 9100 });
  });

  afterEach(async () => {
    if (instance) {
      await server.shutdown();
      instance = null;
    }
  });

  describe('Server Lifecycle', () => {
    it('should start server on specified port', async () => {
      instance = await server.start();

      expect(instance.port).toBe(9100);
      expect(instance.host).toBe('localhost');
      expect(instance.url).toBe('http://localhost:9100');
      expect(instance.server).toBeDefined();
    });

    it('should shutdown server gracefully', async () => {
      instance = await server.start();
      const port = instance.port;

      await server.shutdown();
      instance = null;

      // Verify server can be restarted on same port
      const server2 = new EditorServer({ port });
      const instance2 = await server2.start();
      expect(instance2.port).toBe(port);
      await server2.shutdown();
    });

    it('should throw error when starting already running server', async () => {
      instance = await server.start();

      await expect(server.start()).rejects.toThrow(
        'Server is already running'
      );
    });

    it('should not throw error when shutting down non-running server', async () => {
      await expect(server.shutdown()).resolves.not.toThrow();
    });
  });

  describe('Health Check Endpoint', () => {
    it('should respond to health check endpoint', async () => {
      instance = await server.start();

      const response = await fetch(`${instance.url}/health`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ status: 'ok' });
    });
  });

  describe('Configuration', () => {
    it('should use default port 3000 when not specified', async () => {
      const defaultServer = new EditorServer();
      const defaultInstance = await defaultServer.start();

      try {
        expect(defaultInstance.port).toBeGreaterThanOrEqual(3000);
        expect(defaultInstance.port).toBeLessThanOrEqual(4000);
      } finally {
        await defaultServer.shutdown();
      }
    });

    it('should use custom host when specified', async () => {
      const customServer = new EditorServer({
        port: 9105,
        host: '127.0.0.1',
      });
      const customInstance = await customServer.start();

      try {
        expect(customInstance.host).toBe('127.0.0.1');
        expect(customInstance.url).toBe('http://127.0.0.1:9105');
      } finally {
        await customServer.shutdown();
      }
    });
  });
});
