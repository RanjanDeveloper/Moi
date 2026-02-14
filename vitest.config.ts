import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./vitest.setup.ts'],
        include: ['src/__tests__/**/*.{test,spec}.{ts,tsx}'],
        coverage: {
            reporter: ['text', 'html'],
            include: ['src/**/*.{ts,tsx}'],
            exclude: ['src/__tests__/**', 'src/components/ui/**'],
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
