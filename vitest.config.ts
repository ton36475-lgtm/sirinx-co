import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'legacy/**',
      '**/.{idea,git,cache,output,temp}/**',
    ],
  },
});
