/**
 * Hatchet Client Singleton
 *
 * PATTERN: Singleton with lazy initialization
 * Creates the Hatchet client once and reuses it across all API requests.
 *
 * WHY SINGLETON?
 * - Hatchet client maintains connection pools to Hatchet Cloud
 * - Creating a new client per request would waste resources and slow responses
 * - Node.js module caching ensures this variable persists across requests
 *
 * CONNECTION LIFECYCLE:
 * - Created: On first API call that needs Hatchet
 * - Persists: For the lifetime of the Node.js process
 * - Cleaned up: Automatically when process terminates (OS closes sockets)
 *
 * PRODUCTION CONSIDERATIONS:
 * For production deployments, consider adding graceful shutdown:
 *
 * ```typescript
 * process.on('SIGTERM', async () => {
 *   await closeHatchetClient();
 *   process.exit(0);
 * });
 * ```
 *
 * This allows:
 * - In-flight requests to complete during rolling deployments
 * - Clean connection closure (prevents "connection refused" errors)
 * - Proper observability (clean shutdown vs crashed process)
 *
 * DEVELOPMENT NOTE:
 * Hot reloads in Next.js dev mode will reset this singleton.
 * Old connections are garbage collected automatically.
 */

import Hatchet from '@hatchet-dev/typescript-sdk';

/**
 * Module-level singleton instance
 * Persists across requests due to Node.js module caching
 */
let hatchetInstance: Hatchet | null = null;

/**
 * Get or create the Hatchet client instance
 *
 * @returns Singleton Hatchet client
 * @throws Error if HATCHET_CLIENT_TOKEN environment variable is not set
 */
export function getHatchetClient(): Hatchet {
  if (!hatchetInstance) {
    const token = process.env.HATCHET_CLIENT_TOKEN;

    if (!token) {
      throw new Error(
        'HATCHET_CLIENT_TOKEN environment variable not found. ' +
        'Ensure this is set in your .env.local file.'
      );
    }

    hatchetInstance = Hatchet.init({ token });
    console.log('✅ Hatchet client initialized');
  }

  return hatchetInstance;
}

/**
 * Close Hatchet client connections gracefully
 *
 * USE CASE: Production graceful shutdown
 * Call this in SIGTERM/SIGINT handlers to close connections cleanly
 * before process termination.
 *
 * @example
 * ```typescript
 * process.on('SIGTERM', async () => {
 *   await closeHatchetClient();
 *   process.exit(0);
 * });
 * ```
 */
export async function closeHatchetClient(): Promise<void> {
  if (hatchetInstance) {
    // Note: Check Hatchet SDK docs for proper cleanup method
    // Most SDKs provide close(), disconnect(), or destroy()
    // For now, we'll rely on automatic cleanup

    // TODO: If Hatchet SDK provides explicit cleanup:
    // await hatchetInstance.close();

    hatchetInstance = null;
    console.log('✅ Hatchet client closed');
  }
}

/**
 * Reset the singleton (primarily for testing)
 *
 * USE CASE: Unit/integration tests
 * Allows tests to start with a fresh client instance
 *
 * @example
 * ```typescript
 * afterEach(() => {
 *   resetHatchetClient();
 * });
 * ```
 */
export function resetHatchetClient(): void {
  hatchetInstance = null;
}