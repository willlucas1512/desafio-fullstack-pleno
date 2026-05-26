import type { Metadata } from 'next';
import { ChildDetailView } from './child-detail-view';

export const metadata: Metadata = {
  title: 'Detalhe da criança — Painel PCRJ',
};

export default async function ChildDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ChildDetailView id={id} />;
}
