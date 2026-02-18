import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type {
  CreateReturnRequestDTO,
  UpdateReturnRequestDTO,
} from '@resbar/shared';

export interface ReturnRequestDTO {
  id: string;
  orderId: string;
  category: string;
  subcategory: string;
  description: string | null;
  imageUrl: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  status: string;
  createdById: string;
  resolvedById: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  order?: any;
}

export const useReturnRequest = () => {
  const queryClient = useQueryClient();

  const useReturnRequests = () => {
    return useQuery({
      queryKey: ['return-requests'],
      queryFn: async () => {
        const { data } = await api.get<{ data: ReturnRequestDTO[] }>('/return-requests');
        return data.data;
      },
    });
  };

  const useReturnRequestById = (id: string) => {
    return useQuery({
      queryKey: ['return-requests', id],
      queryFn: async () => {
        const { data } = await api.get<{ data: ReturnRequestDTO }>(`/return-requests/${id}`);
        return data.data;
      },
      enabled: !!id,
    });
  };

  const useReturnRequestsByOrderId = (orderId: string) => {
    return useQuery({
      queryKey: ['return-requests', 'order', orderId],
      queryFn: async () => {
        const { data } = await api.get<{ data: ReturnRequestDTO[] }>(
          `/return-requests/order/${orderId}`
        );
        return data.data;
      },
      enabled: !!orderId,
    });
  };

  const createReturnRequest = useMutation({
    mutationFn: async (data: CreateReturnRequestDTO) => {
      const response = await api.post<{ data: ReturnRequestDTO }>('/return-requests', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['return-requests'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['tabs'] });
    },
  });

  const updateReturnRequest = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateReturnRequestDTO }) => {
      const response = await api.put<{ data: ReturnRequestDTO }>(
        `/return-requests/${id}`,
        data
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['return-requests'] });
    },
  });

  const deleteReturnRequest = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/return-requests/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['return-requests'] });
    },
  });

  return {
    useReturnRequests,
    useReturnRequestById,
    useReturnRequestsByOrderId,
    createReturnRequest,
    updateReturnRequest,
    deleteReturnRequest,
  };
};
