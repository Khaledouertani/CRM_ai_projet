import { useRef, useCallback } from 'react';

export function useDebounce<T extends (...args: any[]) => any>(fn: T, delay: number): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay]
  ) as unknown as T;
}