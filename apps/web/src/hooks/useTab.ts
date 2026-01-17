import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { TabCalculation, TableCalculation, CloseTabDTO } from '@resbar/shared';

export const useTab = () => {
  const queryClient = useQueryClient();

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

  const useCloseTab = () => {
    return useMutation({
      mutationFn: async ({ tabId, payment }: { tabId: string; payment: CloseTabDTO }) => {
        const { data } = await api.patch(`/tabs/${tabId}/close`, payment);
        return data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['tabs'] });
        queryClient.invalidateQueries({ queryKey: ['tables'] });
      },
    });
  };

  return {
    useTabCalculation,
    useTableCalculation,
    useCloseTab,
  };
};
