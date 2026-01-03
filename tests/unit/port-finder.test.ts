import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createServer, Server } from 'net';
import { findAvailablePort } from '../../src/utils/port-finder.js';

describe('port-finder', () => {
  describe('findAvailablePort', () => {
    let servers: Server[] = [];

    // Helper function to occupy a port
    const occupyPort = (port: number): Promise<Server> => {
      return new Promise((resolve, reject) => {
        const server = createServer();
        server.listen(port, () => {
          servers.push(server);
          resolve(server);
        });
        server.once('error', reject);
      });
    };

    // Clean up all servers after each test
    afterEach(async () => {
      await Promise.all(
        servers.map(
          (server) =>
            new Promise<void>((resolve) => {
              server.close(() => resolve());
            })
        )
      );
      servers = [];
    });

    it('should return the start port if it is available', async () => {
      const port = await findAvailablePort(9000);
      expect(port).toBe(9000);
    });

    it('should find the next available port if start port is occupied', async () => {
      await occupyPort(9001);
      const port = await findAvailablePort(9001);
      expect(port).toBe(9002);
    });

    it('should find available port when multiple ports are occupied', async () => {
      await occupyPort(9010);
      await occupyPort(9011);
      await occupyPort(9012);
      const port = await findAvailablePort(9010);
      expect(port).toBe(9013);
    });

    it('should respect custom stopPort parameter', async () => {
      await occupyPort(9020);
      await occupyPort(9021);
      await occupyPort(9022);

      await expect(
        findAvailablePort(9020, 9022)
      ).rejects.toThrow('No available port found in range 9020-9022');
    });

    it('should use default range of startPort + 1000', async () => {
      // Occupy all ports from 9030 to 10030 (this would exceed default range)
      // We'll just test that the function doesn't throw for a reasonable case
      const port = await findAvailablePort(9030);
      expect(port).toBeGreaterThanOrEqual(9030);
      expect(port).toBeLessThanOrEqual(10030);
    });

    it('should throw error if startPort is less than 1', async () => {
      await expect(findAvailablePort(0)).rejects.toThrow(
        'Port must be between 1 and 65535'
      );
    });

    it('should throw error if startPort is greater than 65535', async () => {
      await expect(findAvailablePort(65536)).rejects.toThrow(
        'Port must be between 1 and 65535'
      );
    });

    it('should throw error if stopPort exceeds 65535', async () => {
      await expect(findAvailablePort(65000, 65536)).rejects.toThrow(
        'stopPort exceeds maximum port number (65535)'
      );
    });

    it('should throw error if stopPort is less than startPort', async () => {
      await expect(findAvailablePort(9050, 9040)).rejects.toThrow(
        'stopPort must be greater than or equal to startPort'
      );
    });

    it('should throw error if no port is available in range', async () => {
      // Occupy a small range
      await occupyPort(9060);
      await occupyPort(9061);
      await occupyPort(9062);

      await expect(findAvailablePort(9060, 9062)).rejects.toThrow(
        'No available port found in range 9060-9062'
      );
    });
  });
});
