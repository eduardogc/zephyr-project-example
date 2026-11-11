import { configureAxe } from 'vitest-axe';

/** axe with colour-contrast off: it needs a real rendering engine (canvas), jsdom can't evaluate it. */
export const axe = configureAxe({ rules: { 'color-contrast': { enabled: false } } });
