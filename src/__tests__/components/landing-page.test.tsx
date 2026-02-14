import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// We need to override the next/link mock for this test
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe('Landing Page', () => {
  it('should render the hero section', async () => {
    const LandingPage = (await import('@/app/page')).default;
    render(<LandingPage />);

    // The hero heading text is split across multiple child elements
    expect(screen.getByText('Moi')).toBeInTheDocument();
    expect(screen.getByText(/Now tracking contributions digitally/)).toBeInTheDocument();
  });

  it('should render the Moi Ledger branding', async () => {
    const LandingPage = (await import('@/app/page')).default;
    render(<LandingPage />);

    expect(screen.getAllByText('Moi Ledger').length).toBeGreaterThanOrEqual(1);
  });

  it('should have Sign In and Get Started buttons', async () => {
    const LandingPage = (await import('@/app/page')).default;
    render(<LandingPage />);

    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  it('should render all feature cards', async () => {
    const LandingPage = (await import('@/app/page')).default;
    render(<LandingPage />);

    expect(screen.getByText('Event Management')).toBeInTheDocument();
    expect(screen.getByText('Family Groups')).toBeInTheDocument();
    expect(screen.getByText('Smart Returns')).toBeInTheDocument();
    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Mobile First')).toBeInTheDocument();
    expect(screen.getByText('Secure & Private')).toBeInTheDocument();
  });

  it('should have CTA section with Create Your Free Account', async () => {
    const LandingPage = (await import('@/app/page')).default;
    render(<LandingPage />);

    expect(screen.getByText('Create Your Free Account')).toBeInTheDocument();
  });

  it('should render the footer', async () => {
    const LandingPage = (await import('@/app/page')).default;
    render(<LandingPage />);

    expect(screen.getByText(/Made with/)).toBeInTheDocument();
  });

  it('should have correct navigation links', async () => {
    const LandingPage = (await import('@/app/page')).default;
    render(<LandingPage />);

    const signInLink = screen.getByText('Sign In').closest('a');
    expect(signInLink?.getAttribute('href')).toBe('/login');

    const getStartedLink = screen.getByText('Get Started').closest('a');
    expect(getStartedLink?.getAttribute('href')).toBe('/register');
  });
});
