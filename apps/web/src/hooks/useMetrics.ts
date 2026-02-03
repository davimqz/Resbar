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
    });
  }

  function useRevenue(opts?: { start?: string; end?: string; groupBy?: 'hour' | 'day' }) {
    return useQuery({
      queryKey: ['metrics', 'revenue', opts],
      queryFn: async () => {
        const params = new URLSearchParams();
        if (opts?.start) params.set('start', opts.start);
        if (opts?.end) params.set('end', opts.end);
        if (opts?.groupBy) params.set('groupBy', opts.groupBy);
        const { data } = await api.get(`/metrics/revenue?${params.toString()}`);
        return data.data;
      },
      enabled: !!opts || true,
    });
  }

  function useKitchen(opts?: { start?: string; end?: string; slaMinutes?: number }) {
    return useQuery({
      queryKey: ['metrics', 'kitchen', opts],
      queryFn: async () => {
        const params = new URLSearchParams();
        if (opts?.start) params.set('start', opts.start);
        if (opts?.end) params.set('end', opts.end);
        if (opts?.slaMinutes) params.set('slaMinutes', String(opts.slaMinutes));
        const { data } = await api.get(`/metrics/kitchen?${params.toString()}`);
        return data.data;
      },
    });
  }

  function useWaitersRanking(opts?: { start?: string; end?: string; metric?: string }) {
    return useQuery({
      queryKey: ['metrics', 'waiters', opts],
      queryFn: async () => {
        const params = new URLSearchParams();
        if (opts?.start) params.set('start', opts.start);
        if (opts?.end) params.set('end', opts.end);
        if (opts?.metric) params.set('metric', opts.metric);
        const { data } = await api.get(`/metrics/waiters/ranking?${params.toString()}`);
        return data.data;
      },
    });
  }

  function useTopMenuItems(opts?: { start?: string; end?: string; limit?: number }) {
    return useQuery({
      queryKey: ['metrics', 'menu', opts],
      queryFn: async () => {
        const params = new URLSearchParams();
        if (opts?.start) params.set('start', opts.start);
        if (opts?.end) params.set('end', opts.end);
        if (opts?.limit) params.set('limit', String(opts.limit));
        const { data } = await api.get(`/metrics/menu/top-items?${params.toString()}`);
        return data.data;
      },
    });
  }

  return { useOverview, useRevenue, useKitchen, useWaitersRanking, useTopMenuItems };
}

export default useMetrics;
