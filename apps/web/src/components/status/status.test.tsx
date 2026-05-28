import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { emptyChild, makeChild } from '@/test/fixtures';
import { AlertBadge } from './alert-badge';
import { AreaStatusDot, AreaStatusRow } from './area-status';
import { EmptyArea } from './empty-area';
import { ReviewBadge } from './review-badge';

describe('AlertBadge', () => {
  it('renders the PT-BR label for a known code', () => {
    render(<AlertBadge code="vacinas_atrasadas" />);
    expect(screen.getByText('Vacinas atrasadas')).toBeInTheDocument();
  });
});

describe('ReviewBadge', () => {
  it('shows "Revisado" when reviewed', () => {
    render(<ReviewBadge reviewed />);
    expect(screen.getByText('Revisado')).toBeInTheDocument();
  });

  it('shows "Pendente" when not reviewed', () => {
    render(<ReviewBadge reviewed={false} />);
    expect(screen.getByText('Pendente')).toBeInTheDocument();
  });
});

describe('AreaStatusDot', () => {
  it('flags missing area as "sem dados"', () => {
    render(<AreaStatusDot child={emptyChild} area="saude" />);
    expect(screen.getByText(/Saúde: sem dados/)).toBeInTheDocument();
  });

  it('flags area with alerts as "N alerta(s)"', () => {
    const child = makeChild();
    render(<AreaStatusDot child={child} area="educacao" />);
    expect(screen.getByText(/Educação: \d+ alerta/)).toBeInTheDocument();
  });

  it('flags area with no alerts as "em dia"', () => {
    const child = makeChild();
    render(<AreaStatusDot child={child} area="saude" />);
    expect(screen.getByText(/Saúde: em dia/)).toBeInTheDocument();
  });
});

describe('AreaStatusRow', () => {
  it('renders all three area indicators', () => {
    const child = makeChild();
    render(<AreaStatusRow child={child} />);
    expect(screen.getByRole('group', { name: /status por área/i })).toBeInTheDocument();
  });
});

describe('EmptyArea', () => {
  it('communicates the coverage gap explicitly', () => {
    render(<EmptyArea area="educacao" />);
    expect(screen.getByText(/sem dados de educação/i)).toBeInTheDocument();
    expect(screen.getByText(/cobertura cadastral/i)).toBeInTheDocument();
  });
});
