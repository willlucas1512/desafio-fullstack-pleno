'use client';

import { useQuery } from '@tanstack/react-query';
import { getSummary } from '@/lib/api/summary';

export function useSummary() {
  return useQuery({
    queryKey: ['summary'],
    queryFn: getSummary,
  });
}
