import { useState } from 'react';
import { useMenuItem } from '../hooks/useMenuItem';
import { MenuCategory, MENU_CATEGORY_LABELS, ALLERGEN_CODES } from '@resbar/shared';
import { api } from '../lib/api';

export default function MenuPage() {
  const { useMenuItems, createMenuItem, updateMenuItem, toggleAvailability, deleteMenuItem } =
    useMenuItem();
  const { data: menuItems, isLoading } = useMenuItems();
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: MenuCategory.MAIN_COURSE,
    available: true,
    imageUrl: '',
    allergens: [] as string[],
  });
  const [uploading, setUploading] = useState(false);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: MenuCategory.MAIN_COURSE,
      available: true,
      imageUrl: '',
      allergens: [] as string[],
    });
    setEditingItem(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        name: formData.name,
        description: formData.description || undefined,
        price: parseFloat(formData.price),
        category: formData.category,
        available: formData.available,
        imageUrl: formData.imageUrl || undefined,
        allergens: formData.allergens && formData.allergens.length ? formData.allergens : undefined,
      };

      if (editingItem) {
        await updateMenuItem.mutateAsync({ id: editingItem.id, data });
      } else {
        await createMenuItem.mutateAsync(data);
      }
      resetForm();
    } catch (error: any) {
      alert(error.message || 'Erro ao salvar item');
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      category: item.category,
      available: item.available,
      imageUrl: item.imageUrl || '',
      allergens: item.allergens || [],
    });
    setShowForm(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append('file', file);
      const resp = await api.post('/uploads', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = resp.data.data.url;
      setFormData((s: any) => ({ ...s, imageUrl: url }));
    } catch (err: any) {
      alert(err.message || 'Erro ao enviar imagem');
    } finally {
      setUploading(false);
    }
  };

  const toggleAllergen = (code: string) => {
    setFormData((s: any) => {
      const allergens = new Set(s.allergens || []);
      if (allergens.has(code)) allergens.delete(code); else allergens.add(code);
      return { ...s, allergens: Array.from(allergens) };
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Deseja realmente excluir este item?')) {
      try {
        await deleteMenuItem.mutateAsync(id);
      } catch (error: any) {
        alert(error.message || 'Erro ao excluir item');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Carregando cardápio...</div>
      </div>
    );
  }

  const groupedItems = menuItems?.reduce((acc: any, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-3xl font-bold text-gray-900">Cardápio</h1>
          <p className="mt-2 text-sm text-gray-700">Gerencie os itens do cardápio</p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            {showForm ? 'Cancelar' : 'Novo Item'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="mt-6 bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {editingItem ? 'Editar Item' : 'Criar Novo Item'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Preço (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Descrição</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Categoria *</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value as MenuCategory })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                >
                  {Object.values(MenuCategory).map((category) => (
                    <option key={category} value={category}>
                      {MENU_CATEGORY_LABELS[category]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center pt-6">
                <input
                  type="checkbox"
                  checked={formData.available}
                  onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">Disponível</label>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Imagem (upload)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="mt-1 block w-full text-sm text-gray-600"
                />
                {uploading && <p className="text-xs text-gray-500 mt-1">Enviando imagem...</p>}
                {formData.imageUrl && (
                  <img src={formData.imageUrl} alt="preview" className="mt-2 h-24 w-24 object-cover rounded" />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Alergias</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {Object.entries(ALLERGEN_CODES).map(([code, meta]) => (
                    <label key={code} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={formData.allergens.includes(code)}
                        onChange={() => toggleAllergen(code)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                      <span className="text-gray-700">{meta.symbol} {meta.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={createMenuItem.isPending || updateMenuItem.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {editingItem ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mt-8 space-y-8">
        {Object.entries(groupedItems || {}).map(([category, items]: [string, any]) => (
          <div key={category}>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {MENU_CATEGORY_LABELS[category as MenuCategory]}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item: any) => (
                <div
                  key={item.id}
                  className={`bg-white rounded-lg shadow-sm overflow-hidden ${!item.available ? 'opacity-60' : ''
                    }`}
                >
                  {/* Imagem do prato */}
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-48 object-cover"
                    />
                  )}

                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                      <span className="text-lg font-bold text-green-600">
                        R$ {item.price.toFixed(2)}
                      </span>
                    </div>

                    {item.description && (
                      <p className="text-sm text-gray-600 mb-4">{item.description}</p>
                    )}

                    {/* Alergênicos */}
                    {item.allergens && item.allergens.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {item.allergens.map((code: string) => (
                          <span
                            key={code}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                            title={(ALLERGEN_CODES as any)[code]?.name}
                          >
                            {(ALLERGEN_CODES as any)[code]?.symbol}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-4">
                      <button
                        onClick={() => toggleAvailability.mutate(item.id)}
                        className={`flex-1 px-3 py-1 rounded text-sm font-medium ${item.available
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                          }`}
                      >
                        {item.available ? 'Disponível' : 'Indisponível'}
                      </button>
                      <button
                        onClick={() => handleEdit(item)}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium hover:bg-blue-200"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm font-medium hover:bg-red-200"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {menuItems?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Nenhum item no cardápio</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Adicionar primeiro item
          </button>
        </div>
      )}
    </div>
  );
}
