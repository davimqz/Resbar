import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { 
  TabCancellationRequestDTO, 
  CreateTabCancellationRequestDTO,
  UpdateTabCancellationRequestDTO 
} from '@resbar/shared';

export const useTabCancellation = () => {
  const queryClient = useQueryClient();

  // Listar todas as solicitações de cancelamento
  const useTabCancellationRequests = () => {
    return useQuery({
      queryKey: ['tab-cancellation-requests'],
      queryFn: async () => {
        const { data } = await api.get<{ data: TabCancellationRequestDTO[] }>('/tab-cancellation');
        return data.data;
      },
    });
  };

  // Obter solicitação por ID
  const useTabCancellationRequestById = (id: string) => {
    return useQuery({
      queryKey: ['tab-cancellation-requests', id],
      queryFn: async () => {
        const { data } = await api.get<{ data: TabCancellationRequestDTO }>(`/tab-cancellation/${id}`);
        return data.data;
      },
      enabled: !!id,
    });
  };

  // Obter solicitações por comanda
  const useTabCancellationRequestsByTabId = (tabId: string) => {
    return useQuery({
      queryKey: ['tab-cancellation-requests', 'tab', tabId],
      queryFn: async () => {
        const { data } = await api.get<{ data: TabCancellationRequestDTO[] }>(`/tab-cancellation/tab/${tabId}`);
        return data.data;
      },
      enabled: !!tabId,
    });
  };

  // Criar solicitação de cancelamento
  const createTabCancellationRequest = useMutation({
    mutationFn: async (data: CreateTabCancellationRequestDTO) => {
      const response = await api.post<{ data: TabCancellationRequestDTO }>('/tab-cancellation', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tab-cancellation-requests'] });
      queryClient.invalidateQueries({ queryKey: ['tabs'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });

  // Atualizar status da solicitação (aprovar/rejeitar)
  const updateTabCancellationRequest = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTabCancellationRequestDTO }) => {
      const response = await api.put<{ data: TabCancellationRequestDTO }>(`/tab-cancellation/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tab-cancellation-requests'] });
      queryClient.invalidateQueries({ queryKey: ['tabs'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
    },
  });

  // Deletar solicitação
  const deleteTabCancellationRequest = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tab-cancellation/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tab-cancellation-requests'] });
    },
  });

  return {
    useTabCancellationRequests,
    useTabCancellationRequestById,
    useTabCancellationRequestsByTabId,
    createTabCancellationRequest,
    updateTabCancellationRequest,
    deleteTabCancellationRequest,
  };
};
