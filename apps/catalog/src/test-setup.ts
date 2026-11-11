import '@testing-library/jest-dom/vitest';
import { expect } from 'vitest';
import * as axeMatchers from 'vitest-axe/matchers';

expect.extend(axeMatchers);

// jsdom lacks ResizeObserver, which Headless UI uses.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// axe probes canvas for icon-font detection; jsdom has none.
HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext;
