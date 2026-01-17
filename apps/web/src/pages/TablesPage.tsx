import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTable } from '../hooks/useTable';
import { TableStatus, TABLE_STATUS_LABELS } from '@resbar/shared';

export default function TablesPage() {
  const { useTables, createTable } = useTable();
  const { data: tables, isLoading } = useTables();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ number: '', location: '', capacity: '4' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTable.mutateAsync({
        number: parseInt(formData.number),
        location: formData.location || undefined,
        capacity: parseInt(formData.capacity),
      });
      setFormData({ number: '', location: '', capacity: '4' });
      setShowForm(false);
    } catch (error: any) {
      alert(error.message || 'Erro ao criar mesa');
    }
  };

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case TableStatus.AVAILABLE:
        return 'bg-green-100 text-green-800 border-green-300';
      case TableStatus.OCCUPIED:
        return 'bg-red-100 text-red-800 border-red-300';
      case TableStatus.RESERVED:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Carregando mesas...</div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-3xl font-bold text-gray-900">Mesas</h1>
          <p className="mt-2 text-sm text-gray-700">
            Visualize e gerencie as mesas do estabelecimento
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {showForm ? 'Cancelar' : 'Nova Mesa'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="mt-6 bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Criar Nova Mesa</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Número da Mesa *
                </label>
                <input
                  type="number"
                  required
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Localização</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Ex: Salão principal"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Capacidade</label>
                <input
                  type="number"
                  required
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={createTable.isPending}
                className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {createTable.isPending ? 'Criando...' : 'Criar Mesa'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tables?.map((table: any) => (
          <Link
            key={table.id}
            to={`/tables/${table.id}`}
            className={`relative rounded-lg border-2 p-6 hover:shadow-lg transition-shadow ${getStatusColor(
              table.status
            )}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">Mesa {table.number}</h3>
                {table.location && (
                  <p className="text-sm mt-1 opacity-75">{table.location}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-wide">
                  {TABLE_STATUS_LABELS[table.status as TableStatus]}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="opacity-75">Capacidade:</span>
                <span className="font-medium">{table.capacity} pessoas</span>
              </div>

              {table.waiter && (
                <div className="flex items-center justify-between text-sm">
                  <span className="opacity-75">Garçom:</span>
                  <span className="font-medium">{table.waiter.name}</span>
                </div>
              )}

              {table.tabs && table.tabs.length > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="opacity-75">Pessoas:</span>
                  <span className="font-medium">{table.tabs.length}</span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {tables?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Nenhuma mesa cadastrada</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Criar primeira mesa
          </button>
        </div>
      )}
    </div>
  );
}
