/**
 * @license
 * Copyright 2024 FlowDot
 * SPDX-License-Identifier: Apache-2.0
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/utils/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
      ],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
  },
});
