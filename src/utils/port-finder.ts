import { createServer } from 'net';

/**
 * Check if a port is available
 * @param port - Port number to check
 * @returns Promise that resolves to true if port is available
 */
async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();

    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(false);
      }
    });

    server.once('listening', () => {
      server.close(() => {
        resolve(true);
      });
    });

    server.listen(port);
  });
}

/**
 * Find an available port starting from the specified port
 * @param startPort - Port number to start searching from
 * @param stopPort - Maximum port number to try (default: startPort + 1000)
 * @returns Promise that resolves to an available port number
 * @throws Error if no available port is found within the range
 */
export async function findAvailablePort(
  startPort: number,
  stopPort?: number
): Promise<number> {
  if (startPort < 1 || startPort > 65535) {
    throw new Error('Port must be between 1 and 65535');
  }

  const maxPort = stopPort ?? startPort + 1000;

  if (maxPort > 65535) {
    throw new Error('stopPort exceeds maximum port number (65535)');
  }

  if (maxPort < startPort) {
    throw new Error('stopPort must be greater than or equal to startPort');
  }

  let port = startPort;

  while (port <= maxPort) {
    const available = await isPortAvailable(port);
    if (available) {
      return port;
    }
    port++;
  }

  throw new Error(
    `No available port found in range ${startPort}-${maxPort}`
  );
}
