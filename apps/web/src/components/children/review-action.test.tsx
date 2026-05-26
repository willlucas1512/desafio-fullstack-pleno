import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeChild } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import { ReviewAction } from './review-action';

const reviewChildMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api/children', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/children')>(
    '@/lib/api/children',
  );
  return { ...actual, reviewChild: reviewChildMock };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

afterEach(() => {
  reviewChildMock.mockReset();
});

describe('ReviewAction', () => {
  it('renders the action button when the case is not reviewed', () => {
    renderWithProviders(<ReviewAction child={makeChild()} />);
    expect(screen.getByRole('button', { name: /marcar como revisado/i })).toBeEnabled();
  });

  it('shows reviewer metadata and disables the button when already reviewed', () => {
    renderWithProviders(
      <ReviewAction
        child={makeChild({
          revisado: true,
          revisado_por: 'a@b.test',
          revisado_em: '2026-02-10T09:14:00Z',
        })}
      />,
    );
    expect(screen.getByText(/revisado por/i)).toBeInTheDocument();
    expect(screen.getByText('a@b.test')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /já revisado/i })).toBeDisabled();
  });

  it('calls the review mutation when clicked', async () => {
    const child = makeChild();
    reviewChildMock.mockResolvedValue({
      ...child,
      revisado: true,
      revisado_por: 'a@b.test',
      revisado_em: new Date().toISOString(),
    });

    renderWithProviders(<ReviewAction child={child} />);
    await userEvent.click(screen.getByRole('button', { name: /marcar como revisado/i }));

    await waitFor(() => expect(reviewChildMock).toHaveBeenCalledWith('c001'));
  });
});
