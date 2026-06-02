import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EmptyArea } from './empty-area';

describe('EmptyArea', () => {
  it('communicates the coverage gap explicitly', () => {
    render(<EmptyArea area="educacao" />);
    expect(screen.getByText('Educação')).toBeInTheDocument();
    expect(screen.getByText(/sem dados/i)).toBeInTheDocument();
    expect(screen.getByText(/cobertura cadastral/i)).toBeInTheDocument();
  });
});
