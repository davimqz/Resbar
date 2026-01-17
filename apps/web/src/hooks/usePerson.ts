import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { CreatePersonDTO, PersonDTO } from '@resbar/shared';

export const usePerson = () => {
  const queryClient = useQueryClient();

  const createPerson = useMutation({
    mutationFn: async (data: CreatePersonDTO) => {
      const response = await api.post<{ data: PersonDTO }>('/persons', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['tabs'] });
    },
  });

  const deletePerson = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/persons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['tabs'] });
    },
  });

  return {
    createPerson,
    deletePerson,
  };
};
