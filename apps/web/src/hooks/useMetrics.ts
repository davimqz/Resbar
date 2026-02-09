import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useMetrics() {
  function useOverview() {
    return useQuery({
      queryKey: ['metrics', 'overview'],
      queryFn: async () => {
        const { data } = await api.get('/metrics/overview');
        return data.data;
      },
      retry: 0,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      // Poll every 60s only when tab is visible to be friendly to backend/rate-limits
      refetchInterval: () => (typeof document !== 'undefined' && document.visibilityState === 'visible' ? 60_000 : false),
    });
  }

  function useRevenue(opts?: { start?: string; end?: string; groupBy?: 'hour' | 'day' }) {
    const start = opts?.start ?? null;
    const end = opts?.end ?? null;
    const groupBy = opts?.groupBy ?? null;
    return useQuery({
      queryKey: ['metrics', 'revenue', start, end, groupBy],
      queryFn: async () => {
        const params = new URLSearchParams();
        if (start) params.set('start', start);
        if (end) params.set('end', end);
        if (groupBy) params.set('groupBy', groupBy);
        const { data } = await api.get(`/metrics/revenue?${params.toString()}`);
        return data.data;
      },
      enabled: true,
      retry: 0,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchInterval: false,
    });
  }

  function useKitchen(opts?: { start?: string; end?: string; slaMinutes?: number }) {
    const start = opts?.start ?? null;
    const end = opts?.end ?? null;
    const sla = opts?.slaMinutes ?? null;
    return useQuery({
      queryKey: ['metrics', 'kitchen', start, end, sla],
      queryFn: async () => {
        const params = new URLSearchParams();
        if (start) params.set('start', start);
        if (end) params.set('end', end);
        if (sla) params.set('slaMinutes', String(sla));
        const { data } = await api.get(`/metrics/kitchen?${params.toString()}`);
        return data.data;
      },
      retry: 0,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchInterval: () => (typeof document !== 'undefined' && document.visibilityState === 'visible' ? 60_000 : false),
    });
  }

  function useWaitersRanking(opts?: { start?: string; end?: string; metric?: string }) {
    const start = opts?.start ?? null;
    const end = opts?.end ?? null;
    const metric = opts?.metric ?? null;
    return useQuery({
      queryKey: ['metrics', 'waiters', start, end, metric],
      queryFn: async () => {
        const params = new URLSearchParams();
        if (start) params.set('start', start);
        if (end) params.set('end', end);
        if (metric) params.set('metric', metric);
        const { data } = await api.get(`/metrics/waiters/ranking?${params.toString()}`);
        return data.data;
      },
      retry: 0,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchInterval: () => (typeof document !== 'undefined' && document.visibilityState === 'visible' ? 60_000 : false),
    });
  }

  function useTopMenuItems(opts?: { start?: string; end?: string; limit?: number }) {
    const start = opts?.start ?? null;
    const end = opts?.end ?? null;
    const limit = opts?.limit ?? null;
    return useQuery({
      queryKey: ['metrics', 'menu', start, end, limit],
      queryFn: async () => {
        const params = new URLSearchParams();
        if (start) params.set('start', start);
        if (end) params.set('end', end);
        if (limit) params.set('limit', String(limit));
        const { data } = await api.get(`/metrics/menu/top-items?${params.toString()}`);
        return data.data;
      },
      retry: 0,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchInterval: false,
    });
  }

  return { useOverview, useRevenue, useKitchen, useWaitersRanking, useTopMenuItems };
}

export default useMetrics;
