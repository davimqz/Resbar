import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { TabCalculation, TableCalculation } from '@resbar/shared';

export const useTab = () => {
  const useTabCalculation = (tabId: string) => {
    return useQuery({
      queryKey: ['tabs', tabId, 'calculate'],
      queryFn: async () => {
        const { data } = await api.get<{ data: TabCalculation }>(`/tabs/${tabId}/calculate`);
        return data.data;
      },
      enabled: !!tabId,
    });
  };

  const useTableCalculation = (tableId: string) => {
    return useQuery({
      queryKey: ['tables', tableId, 'calculate'],
      queryFn: async () => {
        const { data } = await api.get<{ data: TableCalculation }>(
          `/tabs/table/${tableId}/calculate`
        );
        return data.data;
      },
      enabled: !!tableId,
    });
  };

  return {
    useTabCalculation,
    useTableCalculation,
  };
};
