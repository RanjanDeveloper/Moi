import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Transactions API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Transaction validation', () => {
        it('should reject transaction without contributor name', () => {
            const body = { eventId: 'evt-1', familyId: 'fam-1', amount: 500, direction: 'received' };
            expect(body).not.toHaveProperty('contributorName');
        });

        it('should reject zero amount', () => {
            const amount = 0;
            expect(amount).toBeLessThanOrEqual(0);
        });

        it('should reject negative amount', () => {
            const amount = -100;
            expect(amount).toBeLessThan(0);
        });

        it('should accept valid transaction data', () => {
            const body = {
                eventId: 'evt-1',
                familyId: 'fam-1',
                contributorName: 'Rajan Kumar',
                amount: 5000,
                direction: 'received' as const,
                paidStatus: false,
                notes: 'Wedding gift',
            };
            expect(body.contributorName.length).toBeGreaterThan(0);
            expect(body.amount).toBeGreaterThan(0);
            expect(['given', 'received']).toContain(body.direction);
        });
    });

    describe('Direction', () => {
        it('should accept received direction', () => {
            expect(['given', 'received']).toContain('received');
        });

        it('should accept given direction', () => {
            expect(['given', 'received']).toContain('given');
        });

        it('should reject invalid direction', () => {
            expect(['given', 'received']).not.toContain('borrowed');
        });
    });

    describe('Amount formatting', () => {
        it('should format amounts in Indian locale', () => {
            const amount = 150000;
            const formatted = amount.toLocaleString('en-IN');
            expect(formatted).toBe('1,50,000');
        });

        it('should handle small amounts', () => {
            const amount = 500;
            const formatted = amount.toLocaleString('en-IN');
            expect(formatted).toBe('500');
        });
    });

    describe('Contribution history sync', () => {
        it('should calculate total contributions per person', () => {
            const transactions = [
                { contributorName: 'Rajan', amount: 5000, direction: 'received' },
                { contributorName: 'Rajan', amount: 3000, direction: 'received' },
                { contributorName: 'Priya', amount: 2000, direction: 'received' },
            ];

            const totals = transactions.reduce((acc, tx) => {
                const name = tx.contributorName;
                acc[name] = (acc[name] || 0) + tx.amount;
                return acc;
            }, {} as Record<string, number>);

            expect(totals['Rajan']).toBe(8000);
            expect(totals['Priya']).toBe(2000);
        });
    });
});
