import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    refresh: vi.fn(),
  })),
}));

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login form', async () => {
    const LoginPage = (await import('@/app/(auth)/login/page')).default;
    render(<LoginPage />);

    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByText('Sign in to Moi Ledger')).toBeInTheDocument();
  });

  it('should render email and password inputs', async () => {
    const LoginPage = (await import('@/app/(auth)/login/page')).default;
    render(<LoginPage />);

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('should render sign in button', async () => {
    const LoginPage = (await import('@/app/(auth)/login/page')).default;
    render(<LoginPage />);

    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('should render register link', async () => {
    const LoginPage = (await import('@/app/(auth)/login/page')).default;
    render(<LoginPage />);

    expect(screen.getByText('Sign up')).toBeInTheDocument();
    const registerLink = screen.getByText('Sign up').closest('a');
    expect(registerLink?.getAttribute('href')).toBe('/register');
  });

  it('should allow typing in email field', async () => {
    const LoginPage = (await import('@/app/(auth)/login/page')).default;
    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    expect(emailInput.value).toBe('test@example.com');
  });

  it('should allow typing in password field', async () => {
    const LoginPage = (await import('@/app/(auth)/login/page')).default;
    render(<LoginPage />);

    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    expect(passwordInput.value).toBe('password123');
  });

  it('should render Moi Ledger logo', async () => {
    const LoginPage = (await import('@/app/(auth)/login/page')).default;
    render(<LoginPage />);

    expect(screen.getByText('M')).toBeInTheDocument(); // Logo letter
  });
});
