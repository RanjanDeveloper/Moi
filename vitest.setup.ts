import '@testing-library/jest-dom/vitest';
import React from 'react';

// Mock next-auth
vi.mock('next-auth/react', () => ({
    useSession: vi.fn(() => ({
        data: {
            user: { id: 'test-user-id', name: 'Test User', email: 'test@example.com' },
            expires: '2099-01-01',
        },
        status: 'authenticated',
    })),
    signIn: vi.fn(),
    signOut: vi.fn(),
    SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
    useRouter: vi.fn(() => ({
        push: vi.fn(),
        replace: vi.fn(),
        refresh: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        prefetch: vi.fn(),
    })),
    usePathname: vi.fn(() => '/dashboard'),
    useParams: vi.fn(() => ({})),
    useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// Mock next/link
vi.mock('next/link', () => {
    const LinkComponent = ({ children, href, ...props }: { children: React.ReactNode; href: string;[key: string]: unknown }) => {
        return React.createElement('a', { href, ...props }, children);
    };
    return { default: LinkComponent };
});

// Mock sonner
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        warning: vi.fn(),
        info: vi.fn(),
    },
}));

// Global fetch mock
global.fetch = vi.fn();
