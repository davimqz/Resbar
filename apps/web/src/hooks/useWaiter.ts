import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { WaiterDTO, CreateWaiterDTO, UpdateWaiterDTO } from '@resbar/shared';

export const useWaiter = () => {
  const queryClient = useQueryClient();

  const useWaiters = () => {
    return useQuery({
      queryKey: ['waiters'],
      queryFn: async () => {
        const { data } = await api.get<{ data: WaiterDTO[] }>('/waiters');
        return data.data;
      },
    });
  };

  const createWaiter = useMutation({
    mutationFn: async (data: CreateWaiterDTO) => {
      const response = await api.post<{ data: WaiterDTO }>('/waiters', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waiters'] });
    },
  });

  const updateWaiter = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateWaiterDTO }) => {
      const response = await api.put<{ data: WaiterDTO }>(`/waiters/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waiters'] });
    },
  });

  const deleteWaiter = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/waiters/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waiters'] });
    },
  });

  return {
    useWaiters,
    createWaiter,
    updateWaiter,
    deleteWaiter,
  };
};
