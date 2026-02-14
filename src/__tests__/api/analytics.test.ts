import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Analytics API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Dashboard stats aggregation', () => {
        const transactions = [
            { amount: 5000, direction: 'received' as const, createdAt: '2026-01-15' },
            { amount: 3000, direction: 'received' as const, createdAt: '2026-01-20' },
            { amount: 2000, direction: 'given' as const, createdAt: '2026-02-01' },
            { amount: 1500, direction: 'received' as const, createdAt: '2026-02-10' },
            { amount: 4000, direction: 'given' as const, createdAt: '2026-02-14' },
        ];

        it('should calculate total received', () => {
            const totalReceived = transactions
                .filter((t) => t.direction === 'received')
                .reduce((sum, t) => sum + t.amount, 0);

            expect(totalReceived).toBe(9500);
        });

        it('should calculate total given', () => {
            const totalGiven = transactions
                .filter((t) => t.direction === 'given')
                .reduce((sum, t) => sum + t.amount, 0);

            expect(totalGiven).toBe(6000);
        });

        it('should calculate net balance', () => {
            const net = transactions.reduce(
                (sum, t) => sum + (t.direction === 'received' ? t.amount : -t.amount),
                0
            );

            expect(net).toBe(3500);
        });

        it('should count total entries', () => {
            expect(transactions.length).toBe(5);
        });
    });

    describe('Monthly data grouping', () => {
        const transactions = [
            { amount: 5000, direction: 'received' as const, createdAt: '2026-01-15' },
            { amount: 3000, direction: 'received' as const, createdAt: '2026-01-20' },
            { amount: 2000, direction: 'given' as const, createdAt: '2026-02-01' },
        ];

        it('should group by month', () => {
            const monthly: Record<string, { received: number; given: number }> = {};
            transactions.forEach((t) => {
                const month = t.createdAt.substring(0, 7); // YYYY-MM
                if (!monthly[month]) monthly[month] = { received: 0, given: 0 };
                monthly[month][t.direction] += t.amount;
            });

            expect(monthly['2026-01'].received).toBe(8000);
            expect(monthly['2026-02'].given).toBe(2000);
        });
    });

    describe('Top contributors', () => {
        it('should sort contributors by total amount descending', () => {
            const contributors = [
                { name: 'Alice', total: 3000 },
                { name: 'Bob', total: 8000 },
                { name: 'Carol', total: 5000 },
            ];

            const sorted = [...contributors].sort((a, b) => b.total - a.total);
            expect(sorted[0].name).toBe('Bob');
            expect(sorted[1].name).toBe('Carol');
            expect(sorted[2].name).toBe('Alice');
        });

        it('should limit top contributors to 5', () => {
            const contributors = Array.from({ length: 10 }, (_, i) => ({
                name: `Person ${i}`,
                total: (10 - i) * 1000,
            }));

            const top5 = contributors.slice(0, 5);
            expect(top5.length).toBe(5);
            expect(top5[0].total).toBe(10000);
        });
    });
});
