import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface OperationalMetrics {
  avgServiceTime: number;
  avgOrderToPayment: number;
  tableTurnoverRate: number;
  revenueByType: Array<{
    type: 'TABLE' | 'COUNTER';
    revenue: number;
    count: number;
  }>;
  occupancyByHour: Array<{
    hour: number;
    tablesUsed: number;
    occupancyRate: number;
  }>;
}

export function useOperational() {
  function useOperationalMetrics(opts?: { start?: string; end?: string }) {
    return useQuery({
      queryKey: ['dashboard', 'operational-metrics', opts],
      queryFn: async () => {
        const params = new URLSearchParams();
        if (opts?.start) params.set('start', opts.start);
        if (opts?.end) params.set('end', opts.end);
        const url = params.toString() 
          ? `/dashboard/operational-metrics?${params.toString()}` 
          : '/dashboard/operational-metrics';
        const { data } = await api.get(url);
        return data.data as OperationalMetrics;
      },
      retry: 0,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      refetchInterval: false,
    });
  }

  return { useOperationalMetrics };
}

export default useOperational;
