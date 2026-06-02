import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ChildrenListParams } from '@/lib/types';
import { renderWithProviders } from '@/test/render';
import { ChildrenFilters } from './children-filters';

vi.mock('@/hooks/use-children', () => ({
  useNeighborhoods: () => ({ data: ['Rocinha', 'Maré'] }),
}));

describe('ChildrenFilters', () => {
  it('emits the typed name and resets to the first page', () => {
    const onChange = vi.fn();
    renderWithProviders(<ChildrenFilters value={{ page: 3 }} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Buscar pelo nome'), { target: { value: 'ana' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ nome: 'ana', page: 1 }));
  });

  it('renders a removable chip per active filter', () => {
    const onChange = vi.fn();
    const value: ChildrenListParams = { nome: 'ana', bairro: 'Rocinha', revisado: false, page: 1 };
    renderWithProviders(<ChildrenFilters value={value} onChange={onChange} />);
    expect(screen.getByText('Filtros ativos:')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Bairro: Rocinha/i }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ bairro: undefined, page: 1 }));
  });

  it('clears every filter at once, keeping ordering and page size', () => {
    const onChange = vi.fn();
    const value: ChildrenListParams = {
      nome: 'ana',
      bairro: 'Rocinha',
      orderBy: 'nome',
      pageSize: 10,
      page: 2,
    };
    renderWithProviders(<ChildrenFilters value={value} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /limpar tudo/i }));
    expect(onChange).toHaveBeenCalledWith({ page: 1, pageSize: 10, orderBy: 'nome' });
  });
});
