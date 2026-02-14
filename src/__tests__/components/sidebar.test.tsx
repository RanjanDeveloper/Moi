import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Must mock before importing component
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: {
      user: { id: 'test-id', name: 'Test User', email: 'test@example.com' },
    },
    status: 'authenticated',
  })),
  signOut: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/dashboard'),
}));

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the sidebar with Moi Ledger branding', async () => {
    const { Sidebar } = await import('@/components/sidebar');
    render(<Sidebar />);

    expect(screen.getByText('Moi Ledger')).toBeInTheDocument();
  });

  it('should render all navigation items', async () => {
    const { Sidebar } = await import('@/components/sidebar');
    render(<Sidebar />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Events')).toBeInTheDocument();
    expect(screen.getByText('Family')).toBeInTheDocument();
    expect(screen.getByText('Returns')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should show Sign Out button', async () => {
    const { Sidebar } = await import('@/components/sidebar');
    render(<Sidebar />);

    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('should display user initial', async () => {
    const { Sidebar } = await import('@/components/sidebar');
    render(<Sidebar />);

    expect(screen.getByText('T')).toBeInTheDocument(); // 'Test User' → 'T'
  });
});
