import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { DashboardStatsDTO } from '@resbar/shared';

export function useDashboard() {
  function useStats() {
    return useQuery({
      queryKey: ['dashboard', 'stats'],
      queryFn: async () => {
        const response = await api.get<{ success: boolean; data: DashboardStatsDTO }>(
          '/dashboard/stats'
        );
        return response.data.data;
      },
    });
  }

  return {
    useStats,
  };
}
