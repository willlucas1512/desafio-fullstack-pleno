import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { emptyChild, makeChild } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import { ChildRow } from './child-row';

describe('ChildRow', () => {
  it('links to the detail page using the child id', () => {
    renderWithProviders(<ChildRow child={makeChild()} />);
    expect(
      screen.getByRole('link', { name: /Ver ficha de Ana Clara Mendes/i }),
    ).toHaveAttribute('href', '/children/c001');
  });

  it('summarizes alerts by area', () => {
    // makeChild() tem 1 alerta em educação e nenhum nas demais áreas
    renderWithProviders(<ChildRow child={makeChild()} />);
    expect(screen.getByText(/Educação:/)).toBeInTheDocument();
    expect(screen.queryByText(/Saúde:/)).not.toBeInTheDocument();
  });

  it('states the coverage gap explicitly when no area has data', () => {
    renderWithProviders(<ChildRow child={emptyChild} />);
    expect(screen.getByText(/sem dados registrados/i)).toBeInTheDocument();
  });

  it('offers a quick review action while the case is pending', () => {
    renderWithProviders(<ChildRow child={makeChild({ revisado: false })} />);
    expect(
      screen.getByRole('button', { name: /marcar como revisado/i }),
    ).toBeInTheDocument();
  });

  it('hides the quick review action once the case is reviewed', () => {
    renderWithProviders(
      <ChildRow child={makeChild({ revisado: true, revisado_em: '2025-11-01T10:00:00Z' })} />,
    );
    expect(
      screen.queryByRole('button', { name: /marcar como revisado/i }),
    ).not.toBeInTheDocument();
  });
});
