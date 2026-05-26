import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ChildrenListView } from './children-list-view';

export const metadata: Metadata = {
  title: 'Crianças — Painel PCRJ',
};

export default function ChildrenPage() {
  return (
    <Suspense fallback={null}>
      <ChildrenListView />
    </Suspense>
  );
}
