// Vitest setup file
import { beforeAll } from 'vitest';

beforeAll(() => {
  // Ensure React 18 act environment is recognized
  (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

  // Ensure performance.now is available
  if (typeof performance === 'undefined') {
    // @ts-expect-error Mocking global performance
    global.performance = { now: () => Date.now() };
  }
});
