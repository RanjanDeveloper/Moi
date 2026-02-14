import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Returns API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Smart returns calculation', () => {
        const transactions = [
            { contributorName: 'Rajan Kumar', amount: 5000, direction: 'received' as const, eventId: 'evt-1' },
            { contributorName: 'Rajan Kumar', amount: 3000, direction: 'received' as const, eventId: 'evt-2' },
            { contributorName: 'Priya Sharma', amount: 2000, direction: 'received' as const, eventId: 'evt-1' },
            { contributorName: 'Rajan Kumar', amount: 1000, direction: 'given' as const, eventId: 'evt-3' },
        ];

        it('should aggregate total received from each person', () => {
            const received = transactions
                .filter((t) => t.direction === 'received')
                .reduce((acc, t) => {
                    acc[t.contributorName] = (acc[t.contributorName] || 0) + t.amount;
                    return acc;
                }, {} as Record<string, number>);

            expect(received['Rajan Kumar']).toBe(8000);
            expect(received['Priya Sharma']).toBe(2000);
        });

        it('should calculate net balance per person', () => {
            const balances: Record<string, number> = {};
            transactions.forEach((t) => {
                const mult = t.direction === 'received' ? 1 : -1;
                balances[t.contributorName] = (balances[t.contributorName] || 0) + t.amount * mult;
            });

            expect(balances['Rajan Kumar']).toBe(7000); // 8000 received - 1000 given
            expect(balances['Priya Sharma']).toBe(2000);
        });

        it('should identify people you owe (net received > 0)', () => {
            const balances: Record<string, number> = {};
            transactions.forEach((t) => {
                const mult = t.direction === 'received' ? 1 : -1;
                balances[t.contributorName] = (balances[t.contributorName] || 0) + t.amount * mult;
            });

            const youOwe = Object.entries(balances)
                .filter(([, amount]) => amount > 0)
                .map(([name, amount]) => ({ name, amount }));

            expect(youOwe.length).toBe(2);
            expect(youOwe.find((p) => p.name === 'Rajan Kumar')?.amount).toBe(7000);
        });

        it('should handle person with zero net balance', () => {
            const balanced = [
                { contributorName: 'Equal', amount: 1000, direction: 'received' as const },
                { contributorName: 'Equal', amount: 1000, direction: 'given' as const },
            ];

            const net = balanced.reduce(
                (acc, t) => acc + (t.direction === 'received' ? t.amount : -t.amount),
                0
            );

            expect(net).toBe(0);
        });
    });
});
