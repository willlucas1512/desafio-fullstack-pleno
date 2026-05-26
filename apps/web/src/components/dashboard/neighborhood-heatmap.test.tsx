import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { sampleSummary } from '@/test/fixtures';
import { NeighborhoodHeatmap } from './neighborhood-heatmap';

describe('NeighborhoodHeatmap', () => {
  it('renders one card per neighborhood with the alert percentage', () => {
    render(<NeighborhoodHeatmap data={sampleSummary.por_bairro} />);
    expect(screen.getByText('Complexo do Alemão')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Mangueira:.*sem dados/i }),
    ).toBeInTheDocument();
  });

  it('links to a pre-filtered children list', () => {
    render(<NeighborhoodHeatmap data={sampleSummary.por_bairro} />);
    const link = screen.getByRole('link', { name: /Rocinha:/i });
    expect(link).toHaveAttribute('href', '/children?bairro=Rocinha');
  });

  it('shows an empty-state when no neighborhoods are returned', () => {
    render(<NeighborhoodHeatmap data={[]} />);
    expect(screen.getByText(/nenhum bairro/i)).toBeInTheDocument();
  });
});
