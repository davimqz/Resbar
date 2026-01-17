import { useState } from 'react';
import { useWaiter } from '../hooks/useWaiter';

export default function WaitersPage() {
  const { useWaiters, createWaiter, updateWaiter, deleteWaiter } = useWaiter();
  const { data: waiters, isLoading } = useWaiters();
  const [showForm, setShowForm] = useState(false);
  const [editingWaiter, setEditingWaiter] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', active: true });

  const resetForm = () => {
    setFormData({ name: '', active: true });
    setEditingWaiter(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingWaiter) {
        await updateWaiter.mutateAsync({ id: editingWaiter.id, data: formData });
      } else {
        await createWaiter.mutateAsync(formData);
      }
      resetForm();
    } catch (error: any) {
      alert(error.message || 'Erro ao salvar garçom');
    }
  };

  const handleEdit = (waiter: any) => {
    setEditingWaiter(waiter);
    setFormData({ name: waiter.name, active: waiter.active });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Deseja realmente excluir este garçom?')) {
      try {
        await deleteWaiter.mutateAsync(id);
      } catch (error: any) {
        alert(error.message || 'Erro ao excluir garçom');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Carregando garçons...</div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-3xl font-bold text-gray-900">Garçons</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gerencie os garçons do estabelecimento
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            {showForm ? 'Cancelar' : 'Novo Garçom'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="mt-6 bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {editingWaiter ? 'Editar Garçom' : 'Criar Novo Garçom'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">Ativo</label>
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
                disabled={createWaiter.isPending || updateWaiter.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {editingWaiter ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mt-8">
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {waiters?.map((waiter) => (
                <tr key={waiter.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{waiter.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        waiter.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {waiter.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(waiter)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(waiter.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {waiters?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Nenhum garçom cadastrado</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Cadastrar primeiro garçom
          </button>
        </div>
      )}
    </div>
  );
}
