import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type {
  TableDTO,
  CreateTableDTO,
  UpdateTableDTO,
  TableStatus,
} from '@resbar/shared';

export const useTable = () => {
  const queryClient = useQueryClient();

  const useTables = () => {
    return useQuery({
      queryKey: ['tables'],
      queryFn: async () => {
        const { data } = await api.get<{ data: TableDTO[] }>('/tables');
        return data.data;
      },
    });
  };

  const useTableById = (id: string) => {
    return useQuery({
      queryKey: ['tables', id],
      queryFn: async () => {
        const { data } = await api.get<{ data: TableDTO }>(`/tables/${id}`);
        return data.data;
      },
      enabled: !!id,
    });
  };

  const createTable = useMutation({
    mutationFn: async (data: CreateTableDTO) => {
      const response = await api.post<{ data: TableDTO }>('/tables', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });

  const updateTable = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTableDTO }) => {
      const response = await api.put<{ data: TableDTO }>(`/tables/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });

  const updateTableStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TableStatus }) => {
      const response = await api.patch<{ data: TableDTO }>(`/tables/${id}/status`, { status });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });

  const assignWaiter = useMutation({
    mutationFn: async ({ id, waiterId }: { id: string; waiterId: string | null }) => {
      const response = await api.post<{ data: TableDTO }>(`/tables/${id}/assign-waiter`, {
        waiterId,
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });

  const deleteTable = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tables/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });

  return {
    useTables,
    useTableById,
    createTable,
    updateTable,
    updateTableStatus,
    assignWaiter,
    deleteTable,
  };
};
