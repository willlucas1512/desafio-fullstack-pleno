import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { sampleSummary } from '@/test/fixtures';
import { CoverageCard } from './coverage-card';

describe('CoverageCard', () => {
  it('shows per-area coverage and a callout when there is at least one fully uncovered child', () => {
    render(
      <CoverageCard coverage={sampleSummary.cobertura} total={sampleSummary.total_criancas} />,
    );
    expect(screen.getByText(/Saúde/i)).toBeInTheDocument();
    expect(screen.getByText(/Educação/i)).toBeInTheDocument();
    expect(screen.getByText(/Assistência social/i)).toBeInTheDocument();
    expect(screen.getByText(/sem registro em nenhuma área/i)).toBeInTheDocument();
  });

  it('omits the callout when no child is fully uncovered', () => {
    render(
      <CoverageCard
        coverage={{ ...sampleSummary.cobertura, sem_nenhuma_area: 0 }}
        total={sampleSummary.total_criancas}
      />,
    );
    expect(screen.queryByText(/sem registro em nenhuma área/i)).not.toBeInTheDocument();
  });
});
