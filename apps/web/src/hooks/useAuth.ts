import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import type {
  UserDTO,
  LoginResponseDTO,
  GoogleCallbackDTO,
  CompleteProfileDTO,
} from '@resbar/shared';

// Hook para login com Google
export function useGoogleLogin() {
  const { setAuth } = useAuthStore();

  return useMutation({
    mutationFn: async (data: GoogleCallbackDTO) => {
      const response = await api.post<{
        success: boolean;
        data: LoginResponseDTO & { needsProfileCompletion: boolean };
      }>('/auth/google', data);
      return response.data.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
    },
  });
}

// Hook para completar perfil
export function useCompleteProfile() {
  const { updateUser } = useAuthStore();

  return useMutation({
    mutationFn: async (data: CompleteProfileDTO) => {
      const response = await api.post<{ success: boolean; data: UserDTO }>(
        '/auth/complete-profile',
        data
      );
      return response.data.data;
    },
    onSuccess: (user) => {
      updateUser(user);
    },
  });
}

// Hook para obter usuário atual
export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: UserDTO }>('/auth/me');
      return response.data.data;
    },
    retry: false,
  });
}

// Hook para logout
export function useLogout() {
  const { clearAuth } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout');
    },
    retry: 0,
    onSuccess: () => {
      clearAuth();
    },
    onError: (err: any) => {
      console.error('Logout error', err?.response ?? err);
    },
  });
}
