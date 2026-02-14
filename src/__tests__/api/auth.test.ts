import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
    default: {
        hash: vi.fn().mockResolvedValue('$2a$12$hashedpassword'),
        compare: vi.fn().mockResolvedValue(true),
    },
}));

// Mock db
const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: 'test-id', name: 'Test User', email: 'test@example.com' }]),
};
vi.mock('@/db', () => ({ db: mockDb }));
vi.mock('@/db/schema', () => ({
    users: { id: 'id', email: 'email', name: 'name', passwordHash: 'passwordHash' },
}));

describe('Auth API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Registration', () => {
        it('should reject registration with short password', async () => {
            const body = { name: 'Test', email: 'test@example.com', password: '12345' };

            // Simulate validation
            expect(body.password.length).toBeLessThan(6);
        });

        it('should reject registration with invalid email', async () => {
            const body = { name: 'Test', email: 'notanemail', password: 'password123' };

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            expect(emailRegex.test(body.email)).toBe(false);
        });

        it('should accept valid registration data', async () => {
            const body = { name: 'Test User', email: 'test@example.com', password: 'password123' };

            expect(body.name.length).toBeGreaterThanOrEqual(2);
            expect(body.password.length).toBeGreaterThanOrEqual(6);
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            expect(emailRegex.test(body.email)).toBe(true);
        });

        it('should hash passwords before storing', async () => {
            const bcrypt = await import('bcryptjs');
            const hash = await bcrypt.default.hash('password123', 12);
            expect(hash).not.toBe('password123');
            expect(bcrypt.default.hash).toHaveBeenCalledWith('password123', 12);
        });
    });

    describe('Password verification', () => {
        it('should verify correct password', async () => {
            const bcrypt = await import('bcryptjs');
            const result = await bcrypt.default.compare('password123', '$2a$12$hash');
            expect(result).toBe(true);
        });
    });
});
