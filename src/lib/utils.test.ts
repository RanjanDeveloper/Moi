import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('utils', () => {
    describe('cn', () => {
        it('should merge tailwind classes correctly', () => {
            expect(cn('p-4', 'p-6')).toBe('p-6');
            expect(cn('flex', 'flex-col')).toBe('flex flex-col');
            expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
        });

        it('should handle conditional classes', () => {
            expect(cn('flex', true && 'flex-col', false && 'justify-center')).toBe('flex flex-col');
        });
    });
});
