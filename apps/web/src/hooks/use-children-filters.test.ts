import { describe, expect, it } from 'vitest';
import { parseParams, paramsToQuery } from './use-children-filters';

describe('parseParams', () => {
  it('aplica defaults quando a URL está vazia', () => {
    expect(parseParams(new URLSearchParams())).toEqual({
      nome: undefined,
      bairro: undefined,
      alertas: undefined,
      revisado: undefined,
      orderBy: 'alertas',
      page: 1,
      pageSize: 10,
    });
  });

  it('ignora valores inválidos de alertas/orderBy e normaliza revisado/page', () => {
    const parsed = parseParams(
      new URLSearchParams({ alertas: 'xx', orderBy: 'zz', revisado: 'true', page: '0' }),
    );
    expect(parsed.alertas).toBeUndefined();
    expect(parsed.orderBy).toBe('alertas');
    expect(parsed.revisado).toBe(true);
    expect(parsed.page).toBe(1);
  });

  it('lê filtros válidos', () => {
    const parsed = parseParams(
      new URLSearchParams({ nome: ' ana ', bairro: 'Maré', alertas: 'saude', orderBy: 'nome', page: '3' }),
    );
    expect(parsed).toMatchObject({
      nome: 'ana',
      bairro: 'Maré',
      alertas: 'saude',
      orderBy: 'nome',
      page: 3,
    });
  });
});

describe('paramsToQuery', () => {
  it('omite defaults (orderBy=alertas, page=1) e campos vazios', () => {
    expect(paramsToQuery({ orderBy: 'alertas', page: 1, pageSize: 10 })).toBe('');
  });

  it('serializa apenas o que difere do default', () => {
    const qs = paramsToQuery({
      nome: 'ana',
      bairro: 'Maré',
      alertas: 'com',
      revisado: false,
      orderBy: 'nome',
      page: 2,
      pageSize: 10,
    });
    const sp = new URLSearchParams(qs);
    expect(sp.get('nome')).toBe('ana');
    expect(sp.get('bairro')).toBe('Maré');
    expect(sp.get('alertas')).toBe('com');
    expect(sp.get('revisado')).toBe('false');
    expect(sp.get('orderBy')).toBe('nome');
    expect(sp.get('page')).toBe('2');
  });

  it('é o inverso de parseParams para um estado não-default', () => {
    const params = parseParams(
      new URLSearchParams({ bairro: 'Rocinha', alertas: 'educacao', orderBy: 'idade', page: '4' }),
    );
    expect(parseParams(new URLSearchParams(paramsToQuery(params)))).toEqual(params);
  });
});
