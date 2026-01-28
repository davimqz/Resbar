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

  const useTabs = () => {
    return useQuery({
      queryKey: ['tabs:all'],
      queryFn: async () => {
        const { data } = await api.get<{ data: any[] }>('/tabs');
        return data.data;
      },
    });
  };

  const useCloseTab = () => {
    return useMutation({
      mutationFn: async ({
        tabId,
        paymentMethod,
        paidAmount,
        serviceChargeIncluded,
        serviceChargePaidSeparately
      }: {
        tabId: string;
        paymentMethod: CloseTabDTO['paymentMethod'];
        paidAmount: number;
        serviceChargeIncluded?: boolean;
        serviceChargePaidSeparately?: boolean;
      }) => {
        const { data } = await api.patch(`/tabs/${tabId}/close`, {
          paymentMethod,
          paidAmount,
          serviceChargeIncluded,
          serviceChargePaidSeparately,
        });
        return data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['tabs'] });
        queryClient.invalidateQueries({ queryKey: ['tables'] });
      },
    });
  };

  const toggleServiceCharge = useMutation({
    mutationFn: async ({ tabId, serviceChargeIncluded }: { tabId: string; serviceChargeIncluded: boolean }) => {
      const { data } = await api.patch(`/tabs/${tabId}/toggle-service-charge`, {
        serviceChargeIncluded,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tabs'] });
    },
  });

  const requestBill = useMutation({
    mutationFn: async (tabId: string) => {
      const { data } = await api.post(`/tabs/${tabId}/request-bill`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tabs'] });
    },
  });

  const createTab = useMutation({
    mutationFn: async (data: { tableId?: string | null; type?: string; personName?: string }) => {
      const { data: resp } = await api.post<{ data: any }>('/tabs', data);
      return resp.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tabs'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });

  const deleteTab = useMutation({
    mutationFn: async (tabId: string) => {
      await api.delete(`/tabs/${tabId}`);
    },
    onSuccess: () => {
      // Invalidate both the summary list and any table-specific caches
      queryClient.invalidateQueries({ queryKey: ['tabs:all'] });
      queryClient.invalidateQueries({ queryKey: ['tabs'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });

  const transferAccount = useMutation({
    mutationFn: async ({ fromTabId, toTabId }: { fromTabId: string; toTabId?: string }) => {
      const { data } = await api.post(`/tabs/${fromTabId}/transfer`, { toTabId });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tabs'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });

  return {
    useTabCalculation,
    useTableCalculation,
    useCloseTab,
    toggleServiceCharge,
    requestBill,
    useTabs,
    createTab,
    deleteTab,
    transferAccount,
  };
};
