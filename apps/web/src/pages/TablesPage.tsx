import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTable } from '../hooks/useTable';
import { useTab } from '../hooks/useTab';
import { useAuthStore } from '../store/authStore';
import { TableStatus, TABLE_STATUS_LABELS, UserRole } from '@resbar/shared';

export default function TablesPage() {
  const { useTables, createTable, releaseTable } = useTable();
  const { data: tables, isLoading } = useTables();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { useTabs } = useTab();
  const { data: tabs } = useTabs();
  const { createTab } = useTab();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ number: '', location: '', capacity: '4' });
  const [showOpenCounterModal, setShowOpenCounterModal] = useState(false);
  const [counterPersonName, setCounterPersonName] = useState('');

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

  const handleReleaseTable = async (tableId: string, tableNumber: number, e: React.MouseEvent) => {
    e.preventDefault(); // Previne navegação do Link
    e.stopPropagation();

    if (!confirm(`Deseja liberar a Mesa ${tableNumber}?`)) {
      return;
    }

    try {
      await releaseTable.mutateAsync(tableId);
      alert('Mesa liberada com sucesso!');
    } catch (error: any) {
      alert(error.message || 'Erro ao liberar mesa');
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
      case TableStatus.PAID_PENDING_RELEASE:
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const isWaiterOrAdmin = user?.role === UserRole.WAITER || user?.role === UserRole.ADMIN;

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
          <button
            onClick={() => setShowOpenCounterModal(true)}
            className="ml-3 inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700"
          >
            Abrir Comanda (Balcão)
          </button>
        </div>
      </div>

        {showOpenCounterModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-bold mb-4">Abrir Comanda (Balcão)</h2>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const tab = await createTab.mutateAsync({ type: 'COUNTER', personName: counterPersonName || undefined });
                    setShowOpenCounterModal(false);
                    setCounterPersonName('');
                    navigate(`/tabs/${tab.id}/payment`);
                  } catch (err: any) {
                    alert(err.message || 'Erro ao abrir comanda de balcão');
                  }
                }}
              >
                <div>
                  <label className="block text-sm font-medium mb-2">Nome do cliente (opcional)</label>
                  <input
                    type="text"
                    value={counterPersonName}
                    onChange={(e) => setCounterPersonName(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button type="button" onClick={() => setShowOpenCounterModal(false)} className="px-4 py-2 border rounded">Cancelar</button>
                  <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Abrir</button>
                </div>
              </form>
            </div>
          </div>
        )}

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

              {table.allTabsPaidAt && (
                <div className="text-xs opacity-75 mt-2">
                  Pago em: {new Date(table.allTabsPaidAt).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              )}

              {table.releasedAt && (
                <div className="text-xs opacity-75 mt-2">
                  Liberado em: {new Date(table.releasedAt).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              )}
            </div>

            {/* Botão de Liberar Mesa (apenas para garçons e quando mesa está paga) */}
            {isWaiterOrAdmin && table.status === TableStatus.PAID_PENDING_RELEASE && (
              <button
                onClick={(e) => handleReleaseTable(table.id, table.number, e)}
                disabled={releaseTable.isPending}
                className="mt-4 w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 text-sm font-medium"
              >
                {releaseTable.isPending ? 'Liberando...' : '✓ Liberar Mesa'}
              </button>
            )}
          </Link>
        ))}
      </div>

      {/* Seção separada para Comandas Abertas */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Comandas Abertas</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tabs && tabs.length > 0 ? (
            tabs.filter((t: any) => t.status === 'OPEN').map((tab: any) => (
              <div
                key={tab.id}
                className={`bg-white rounded-lg shadow p-4 ${!tab.table ? 'border-2 border-black' : 'border border-gray-200'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{tab.person?.name || 'Sem nome'}</div>
                    <div className="text-sm text-gray-600">{tab.table ? `Mesa ${tab.table.number}` : 'Balcão'}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">R$ {(tab.total || 0).toFixed(2)}</div>
                    <button
                      onClick={() => navigate(`/tabs/${tab.id}/payment`)}
                      className="mt-2 inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-1 text-sm text-white"
                    >
                      Abrir
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-500">Nenhuma comanda aberta</div>
          )}
        </div>
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
