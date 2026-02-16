import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useOverview() {
  function useOverviewData(opts?: { start?: string; end?: string }) {
    return useQuery({
      queryKey: ['metrics', 'overview', opts],
      queryFn: async () => {
        const params = new URLSearchParams();
        if (opts?.start) params.set('start', opts.start);
        if (opts?.end) params.set('end', opts.end);
        // Prefer the consolidated dashboard overview endpoint which returns richer buckets
        const url = params.toString() ? `/dashboard/overview?${params.toString()}` : '/dashboard/overview';
        const { data } = await api.get(url);
        return data.data;
      },
      retry: 0,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchInterval: false,
    });
  }

  function useOverviewWaiters(opts?: { start?: string; end?: string }) {
    return useQuery({
      queryKey: ['dashboard', 'overview-waiters', opts],
      queryFn: async () => {
        const params = new URLSearchParams();
        if (opts?.start) params.set('start', opts.start);
        if (opts?.end) params.set('end', opts.end);
        const url = params.toString() ? `/dashboard/overview-waiters?${params.toString()}` : '/dashboard/overview-waiters';
        const { data } = await api.get(url);
        return data.data;
      },
      retry: 0,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchInterval: false,
    });
  }

  function useOverviewFinance(opts?: { start?: string; end?: string }) {
    return useQuery({
      queryKey: ['dashboard', 'overview-finance', opts],
      queryFn: async () => {
        const params = new URLSearchParams();
        if (opts?.start) params.set('start', opts.start);
        if (opts?.end) params.set('end', opts.end);
        const url = params.toString() ? `/dashboard/overview-finance?${params.toString()}` : '/dashboard/overview-finance';
        const { data } = await api.get(url);
        return data.data;
      },
      retry: 0,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchInterval: false,
    });
  }

  function useOverviewOperations(opts?: { start?: string; end?: string }) {
    return useQuery({
      queryKey: ['dashboard', 'overview-operations', opts],
      queryFn: async () => {
        const params = new URLSearchParams();
        if (opts?.start) params.set('start', opts.start);
        if (opts?.end) params.set('end', opts.end);
        const url = params.toString() ? `/dashboard/overview-operations?${params.toString()}` : '/dashboard/overview-operations';
        const { data } = await api.get(url);
        return data.data;
      },
      retry: 0,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchInterval: false,
    });
  }

  function useOverviewKitchen(opts?: { start?: string; end?: string }) {
    return useQuery({
      queryKey: ['dashboard', 'overview-kitchen', opts],
      queryFn: async () => {
        const params = new URLSearchParams();
        if (opts?.start) params.set('start', opts.start);
        if (opts?.end) params.set('end', opts.end);
        const url = params.toString() ? `/dashboard/overview-kitchen?${params.toString()}` : '/dashboard/overview-kitchen';
        const { data } = await api.get(url);
        return data.data;
      },
      retry: 0,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchInterval: false,
    });
  }

  function useOverviewMenu(opts?: { start?: string; end?: string }) {
    return useQuery({
      queryKey: ['dashboard', 'overview-menu', opts],
      queryFn: async () => {
        const params = new URLSearchParams();
        if (opts?.start) params.set('start', opts.start);
        if (opts?.end) params.set('end', opts.end);
        const url = params.toString() ? `/dashboard/overview-menu?${params.toString()}` : '/dashboard/overview-menu';
        const { data } = await api.get(url);
        return data.data;
      },
      retry: 0,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchInterval: false,
    });
  }

  function useRevenue(opts?: { start?: string; end?: string; groupBy?: 'hour' | 'day' }) {
    return useQuery({
      queryKey: ['metrics', 'revenue', opts],
      queryFn: async () => {
        const params = new URLSearchParams();
        if (opts?.start) params.set('start', opts.start);
        if (opts?.end) params.set('end', opts.end);
        params.set('groupBy', opts?.groupBy ?? 'day');
        const url = `/metrics/revenue?${params.toString()}`;
        const { data } = await api.get(url);
        return data.data;
      },
      retry: 0,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    });
  }

  return { useOverviewData, useOverviewWaiters, useOverviewFinance, useOverviewOperations, useOverviewKitchen, useOverviewMenu, useRevenue };
}

export default useOverview;
