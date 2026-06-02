'use client';

import { useEffect, useState } from 'react';

/** Retorna `value` com atraso de `delayMs`, re-renderizando só quando ele estabiliza. */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
