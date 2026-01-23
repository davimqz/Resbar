import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useGoogleLogin, useCompleteProfile } from '../hooks/useAuth';
import { Gender, GENDER_LABELS, CUSTOM_GENDER_OPTIONS } from '@resbar/shared';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function ProfileCompletionModal({ onClose, onComplete }: { onClose: () => void; onComplete: () => void }) {
  const [name, setName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [gender, setGender] = useState<Gender>(Gender.MALE);
  const [customGender, setCustomGender] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const completeProfile = useCompleteProfile();

  const filteredGenderOptions = CUSTOM_GENDER_OPTIONS.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !birthdate || !gender) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (gender === Gender.OTHER && !customGender) {
      alert('Por favor, especifique sua identidade de gênero');
      return;
    }

    try {
      await completeProfile.mutateAsync({
        name,
        birthdate: new Date(birthdate),
        gender,
        customGender: gender === Gender.OTHER ? customGender : undefined,
      });

      onComplete();
    } catch (error) {
      console.error('Erro ao completar perfil:', error);
      alert('Erro ao salvar perfil. Tente novamente.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Complete seu Perfil</h2>
        <p className="text-gray-600 mb-6">
          Para continuar, precisamos de algumas informações básicas.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Data de Nascimento *
            </label>
            <input
              type="date"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Gênero *
            </label>
            <select
              value={gender}
              onChange={(e) => {
                setGender(e.target.value as Gender);
                if (e.target.value !== Gender.OTHER) {
                  setCustomGender('');
                  setSearchTerm('');
                }
              }}
              className="w-full border rounded px-3 py-2"
              required
            >
              {Object.entries(GENDER_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {gender === Gender.OTHER && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Especifique sua identidade de gênero *
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Digite para buscar..."
                className="w-full border rounded px-3 py-2 mb-2"
              />
              
              {searchTerm && (
                <div className="border rounded max-h-40 overflow-y-auto">
                  {filteredGenderOptions.length > 0 ? (
                    filteredGenderOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setCustomGender(option);
                          setSearchTerm(option);
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-gray-100 ${
                          customGender === option ? 'bg-blue-50' : ''
                        }`}
                      >
                        {option}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-gray-500">
                      Nenhuma opção encontrada. Você pode digitar sua própria identidade.
                    </div>
                  )}
                </div>
              )}

              {searchTerm && (
                <p className="text-sm text-gray-500 mt-2">
                  {customGender ? `Selecionado: ${customGender}` : 'Selecione uma opção acima ou continue digitando'}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
              disabled={completeProfile.isPending}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
              disabled={completeProfile.isPending}
            >
              {completeProfile.isPending ? 'Salvando...' : 'Continuar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const googleLogin = useGoogleLogin();
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      // Decodificar o JWT do Google para obter informações do usuário
      const credential = credentialResponse.credential;
      if (!credential) {
        throw new Error('Credencial não recebida');
      }

      // Parse JWT payload (simples, sem verificação - o backend fará isso)
      const payload = JSON.parse(atob(credential.split('.')[1]));

      const result = await googleLogin.mutateAsync({
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        avatar: payload.picture,
      });

      // Se precisa completar perfil, mostra modal
      if (result.needsProfileCompletion) {
        setShowProfileModal(true);
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      alert('Erro ao fazer login. Tente novamente.');
    }
  };

  const handleProfileComplete = () => {
    setShowProfileModal(false);
    navigate('/');
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">ResBar</h1>
            <p className="text-gray-600">Sistema de Gestão de Restaurante</p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  console.error('Erro no login do Google');
                  alert('Erro ao fazer login com Google');
                }}
                useOneTap
                theme="filled_blue"
                size="large"
                text="continue_with"
              />
            </div>

            <div className="text-center text-sm text-gray-500">
              Faça login com sua conta Google para continuar
            </div>
          </div>

          <div className="mt-8 pt-8 border-t text-center text-sm text-gray-500">
            <p>Ao fazer login, você concorda com nossos Termos de Serviço e Política de Privacidade</p>
          </div>
        </div>

        {showProfileModal && (
          <ProfileCompletionModal
            onClose={() => setShowProfileModal(false)}
            onComplete={handleProfileComplete}
          />
        )}
      </div>
    </GoogleOAuthProvider>
  );
}
