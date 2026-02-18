import { useState, useRef } from 'react';
import { 
  ReturnCategory, 
  RETURN_CATEGORY_LABELS, 
  RETURN_SUBCATEGORIES 
} from '@resbar/shared';
import { useReturnRequest } from '../hooks/useReturnRequest';
import { api } from '../lib/api';

interface RequestReturnModalProps {
  orderId: string;
  orderName: string;
  onClose: () => void;
  tabId?: string;
  tableNumber?: number | string;
}

export default function RequestReturnModal({ 
  orderId, 
  orderName, 
  onClose,
  tabId,
  tableNumber,
}: RequestReturnModalProps) {
  const { createReturnRequest } = useReturnRequest();
  const [category, setCategory] = useState<ReturnCategory | ''>('');
  const [subcategory, setSubcategory] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (file: File) => {
    // Criar preview local
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // Fazer upload da imagem
    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post<{ data: { url: string } }>('/uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setImageUrl(response.data.data.url);
    } catch (error: any) {
      alert('Erro ao fazer upload da imagem');
      console.error(error);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageChange(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview('');
    setImageUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category || !subcategory) {
      alert('Por favor, selecione uma categoria e subcategoria');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Normalize sourceType/sourceId instead of prefixing description
      let sourceType: 'COMANDA' | 'MESA' | undefined = undefined;
      let sourceId: string | undefined = undefined;
      if (tabId) {
        sourceType = 'COMANDA';
        sourceId = tabId;
      } else if (tableNumber) {
        sourceType = 'MESA';
        sourceId = String(tableNumber);
      }

      await createReturnRequest.mutateAsync({
        orderId,
        category: category as ReturnCategory,
        subcategory,
        description: description || undefined,
        sourceType: sourceType as any,
        sourceId: sourceId as any,
        imageUrl: imageUrl || undefined,
      });
      
      alert('Solicitação de devolução criada com sucesso!');
      onClose();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao criar solicitação de devolução');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableSubcategories = category 
    ? RETURN_SUBCATEGORIES[category as ReturnCategory] 
    : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Solicitar Devolução
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Pedido: {orderName}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoria <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={category}
              onChange={(e) => {
                setCategory(e.target.value as ReturnCategory);
                setSubcategory(''); // Reset subcategory when category changes
              }}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
            >
              <option value="">Selecione uma categoria...</option>
              {Object.entries(RETURN_CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Subcategoria */}
          {category && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subcategoria <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              >
                <option value="">Selecione uma subcategoria...</option>
                {availableSubcategories.map((sub: string) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição do Problema
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva em detalhes o problema encontrado..."
              rows={4}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
            />
          </div>

          {/* Upload de Imagem */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Foto do Produto/Prato (opcional)
            </label>
            
            {!imagePreview ? (
              <div className="space-y-3">
                {/* Botão Tirar Foto */}
                <div>
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isUploadingImage}
                  />
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Tirar Foto
                  </button>
                </div>

                {/* Botão Escolher da Galeria */}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isUploadingImage}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="w-full px-4 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Escolher da Galeria
                  </button>
                </div>

                {isUploadingImage && (
                  <p className="text-sm text-blue-600 text-center">
                    Fazendo upload da imagem...
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Preview da Imagem */}
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-lg border-2 border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-2 hover:bg-red-700 shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-green-600 text-center font-medium">
                  ✓ Imagem carregada com sucesso
                </p>
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingImage}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium disabled:opacity-50"
            >
              {isSubmitting ? 'Enviando...' : 'Solicitar Devolução'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
