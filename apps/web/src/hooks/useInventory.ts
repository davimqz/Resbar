import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { InventoryItemDTO, CreateInventoryItemDTO, UpdateInventoryItemDTO } from '@resbar/shared';

export function useInventory() {
  const queryClient = useQueryClient();

  function useInventoryItems() {
    return useQuery({
      queryKey: ['inventory'],
      queryFn: async () => {
        const response = await api.get<{ success: boolean; data: InventoryItemDTO[] }>(
          '/inventory'
        );
        return response.data.data;
      },
    });
  }

  function useInventoryItem(id: string) {
    return useQuery({
      queryKey: ['inventory', id],
      queryFn: async () => {
        const response = await api.get<{ success: boolean; data: InventoryItemDTO }>(
          `/inventory/${id}`
        );
        return response.data.data;
      },
      enabled: !!id,
    });
  }

  function useCreateInventoryItem() {
    return useMutation({
      mutationFn: async (data: CreateInventoryItemDTO) => {
        const response = await api.post<{ success: boolean; data: InventoryItemDTO }>(
          '/inventory',
          data
        );
        return response.data.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
      },
    });
  }

  function useUpdateInventoryItem(id: string) {
    return useMutation({
      mutationFn: async (data: UpdateInventoryItemDTO) => {
        const response = await api.put<{ success: boolean; data: InventoryItemDTO }>(
          `/inventory/${id}`,
          data
        );
        return response.data.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
        queryClient.invalidateQueries({ queryKey: ['inventory', id] });
      },
    });
  }

  function useDeleteInventoryItem() {
    return useMutation({
      mutationFn: async (id: string) => {
        await api.delete(`/inventory/${id}`);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
      },
    });
  }

  return {
    useInventoryItems,
    useInventoryItem,
    useCreateInventoryItem,
    useUpdateInventoryItem,
    useDeleteInventoryItem,
  };
}
