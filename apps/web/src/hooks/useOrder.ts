import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type {
  OrderDTO,
  CreateOrderDTO,
  UpdateOrderDTO,
  OrderStatus,
} from '@resbar/shared';

export const useOrder = () => {
  const queryClient = useQueryClient();

  const useOrders = () => {
    return useQuery({
      queryKey: ['orders'],
      queryFn: async () => {
        const { data } = await api.get<{ data: OrderDTO[] }>('/orders');
        return data.data;
      },
    });
  };

  const useKitchenOrders = () => {
    return useQuery({
      queryKey: ['orders', 'kitchen'],
      queryFn: async () => {
        const { data } = await api.get<{ data: OrderDTO[] }>('/orders/kitchen/pending');
        return data.data;
      },
      refetchInterval: 5000, // Refresh every 5 seconds
    });
  };

  const createOrder = useMutation({
    mutationFn: async (data: CreateOrderDTO) => {
      const response = await api.post<{ data: OrderDTO }>('/orders', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['tabs'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });

  const updateOrder = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateOrderDTO }) => {
      const response = await api.put<{ data: OrderDTO }>(`/orders/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['tabs'] });
    },
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const response = await api.patch<{ data: OrderDTO }>(`/orders/${id}/status`, { status });
      return response.data.data;
    },
    onSuccess: () => {
      // Delay para evitar rate limiting
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['tabs'] });
      }, 100);
    },
  });

  const deleteOrder = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/orders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['tabs'] });
    },
  });

  return {
    useOrders,
    useKitchenOrders,
    createOrder,
    updateOrder,
    updateOrderStatus,
    deleteOrder,
  };
};
