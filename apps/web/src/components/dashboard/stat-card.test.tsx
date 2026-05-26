import { render, screen } from '@testing-library/react';
import { Users } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { StatCard } from './stat-card';

describe('StatCard', () => {
  it('renders label, value and total', () => {
    render(<StatCard label="Total de crianças" value={25} icon={Users} />);
    expect(screen.getByText('Total de crianças')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('renders ratio when total is provided', () => {
    render(<StatCard label="Com alertas" value={17} total={25} icon={Users} tone="warning" />);
    expect(screen.getByText(/\/ 25/)).toBeInTheDocument();
  });

  it('wraps in a link when href is provided', () => {
    render(<StatCard label="Lista" value={1} icon={Users} href="/children?alertas=com" />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/children?alertas=com');
  });
});
