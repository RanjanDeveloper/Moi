import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { TrendingUp } from 'lucide-react';

describe('StatCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render stat card with title and value', async () => {
    const { StatCard } = await import('@/components/stat-card');
    render(
      <StatCard title="Total Received" value="₹50,000" icon={TrendingUp} />
    );

    expect(screen.getByText('Total Received')).toBeInTheDocument();
    expect(screen.getByText('₹50,000')).toBeInTheDocument();
  });

  it('should format numeric values in Indian locale', async () => {
    const { StatCard } = await import('@/components/stat-card');
    render(
      <StatCard title="Amount" value={150000} icon={TrendingUp} />
    );

    expect(screen.getByText('₹1,50,000')).toBeInTheDocument();
  });

  it('should render subtitle when provided', async () => {
    const { StatCard } = await import('@/components/stat-card');
    render(
      <StatCard
        title="Monthly"
        value="₹12,000"
        subtitle="+15% from last month"
        trend="up"
        icon={TrendingUp}
      />
    );

    expect(screen.getByText('+15% from last month')).toBeInTheDocument();
  });

  it('should apply emerald color for upward trend', async () => {
    const { StatCard } = await import('@/components/stat-card');
    const { container } = render(
      <StatCard
        title="Growth"
        value="₹5,000"
        subtitle="+10%"
        trend="up"
        icon={TrendingUp}
      />
    );

    const subtitleEl = screen.getByText('+10%');
    expect(subtitleEl.className).toContain('emerald');
  });
});
