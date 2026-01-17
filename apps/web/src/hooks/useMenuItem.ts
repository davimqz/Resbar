import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { MenuItemDTO, CreateMenuItemDTO, UpdateMenuItemDTO } from '@resbar/shared';

export const useMenuItem = () => {
  const queryClient = useQueryClient();

  const useMenuItems = (params?: { category?: string; available?: boolean }) => {
    return useQuery({
      queryKey: ['menuItems', params],
      queryFn: async () => {
        const { data } = await api.get<{ data: MenuItemDTO[] }>('/menu-items', { params });
        return data.data;
      },
    });
  };

  const createMenuItem = useMutation({
    mutationFn: async (data: CreateMenuItemDTO) => {
      const response = await api.post<{ data: MenuItemDTO }>('/menu-items', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
    },
  });

  const updateMenuItem = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateMenuItemDTO }) => {
      const response = await api.put<{ data: MenuItemDTO }>(`/menu-items/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
    },
  });

  const toggleAvailability = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch<{ data: MenuItemDTO }>(`/menu-items/${id}/availability`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
    },
  });

  const deleteMenuItem = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/menu-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
    },
  });

  return {
    useMenuItems,
    createMenuItem,
    updateMenuItem,
    toggleAvailability,
    deleteMenuItem,
  };
};
