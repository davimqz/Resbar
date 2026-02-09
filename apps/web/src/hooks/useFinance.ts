import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useFinance() {
  function useSummary(opts?: { start?: string; end?: string }) {
    const start = opts?.start ?? null;
    const end = opts?.end ?? null;
    return useQuery({
      queryKey: ['finance', 'summary', start, end],
      queryFn: async () => {
        const params = new URLSearchParams();
        if (start) params.set('start', start);
        if (end) params.set('end', end);
        const url = params.toString() ? `/dashboard/finance/summary?${params.toString()}` : '/dashboard/finance/summary';
        const { data } = await api.get(url);
        return data.data;
      },
      retry: 0,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchInterval: false,
    });
  }

  return { useSummary };
}

export default useFinance;
