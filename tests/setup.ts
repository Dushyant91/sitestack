// Vitest setup file
import { beforeAll } from 'vitest';

beforeAll(() => {
  // Ensure performance.now is available
  if (typeof performance === 'undefined') {
    // @ts-expect-error Mocking global performance
    global.performance = { now: () => Date.now() };
  }
});
