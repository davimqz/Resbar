import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTable } from '../hooks/useTable';
import { usePerson } from '../hooks/usePerson';
import { useOrder } from '../hooks/useOrder';
import { useMenuItem } from '../hooks/useMenuItem';
import { useWaiter } from '../hooks/useWaiter';
import { useTab } from '../hooks/useTab';
import { TableStatus, MenuCategory, MENU_CATEGORY_LABELS } from '@resbar/shared';

export default function TableDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { useTableById, assignWaiter, updateTableStatus } = useTable();
  const { createPerson, deletePerson } = usePerson();
  const { createOrder } = useOrder();
  const { useMenuItems } = useMenuItem();
  const { useWaiters } = useWaiter();
  const { useTableCalculation } = useTab();

  const { data: table, isLoading } = useTableById(id!);
  const { data: menuItems } = useMenuItems({ available: true });
  const { data: waiters } = useWaiters();
  const { data: calculation } = useTableCalculation(id!);

  const [showAddPerson, setShowAddPerson] = useState(false);
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [personName, setPersonName] = useState('');
  const [selectedTabId, setSelectedTabId] = useState('');
  const [selectedMenuItemId, setSelectedMenuItemId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const handleAddPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPerson.mutateAsync({
        name: personName,
        tableId: id!,
      });
      setPersonName('');
      setShowAddPerson(false);
    } catch (error: any) {
      alert(error.message || 'Erro ao adicionar pessoa');
    }
  };

  const handleAddOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createOrder.mutateAsync({
        tabId: selectedTabId,
        menuItemId: selectedMenuItemId,
        quantity,
        notes: notes || undefined,
      });
      setSelectedMenuItemId('');
      setQuantity(1);
      setNotes('');
      setShowAddOrder(false);
    } catch (error: any) {
      alert(error.message || 'Erro ao adicionar pedido');
    }
  };

  const handleAssignWaiter = async (waiterId: string) => {
    try {
      await assignWaiter.mutateAsync({ id: id!, waiterId: waiterId || null });
    } catch (error: any) {
      alert(error.message || 'Erro ao atribuir garçom');
    }
  };

  const handleCloseTable = async () => {
    if (window.confirm('Deseja realmente liberar esta mesa?')) {
      try {
        await updateTableStatus.mutateAsync({ id: id!, status: TableStatus.AVAILABLE });
        navigate('/tables');
      } catch (error: any) {
        alert(error.message || 'Erro ao liberar mesa');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Carregando mesa...</div>
      </div>
    );
  }

  if (!table) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Mesa não encontrada</p>
        <Link to="/tables" className="mt-4 text-blue-600 hover:text-blue-700 font-medium">
          Voltar para mesas
        </Link>
      </div>
    );
  }

  const openTabs = (table as any).tabs?.filter((t: any) => t.status === 'OPEN') || [];

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link to="/tables" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          ← Voltar para mesas
        </Link>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mesa {table.number}</h1>
            {table.location && <p className="text-gray-600 mt-1">{table.location}</p>}
          </div>
          <div>
            <select
              value={table.waiterId || ''}
              onChange={(e) => handleAssignWaiter(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
            >
              <option value="">Sem garçom</option>
              {waiters?.map((waiter) => (
                <option key={waiter.id} value={waiter.id}>
                  {waiter.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setShowAddPerson(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            Adicionar Pessoa
          </button>
          <button
            onClick={handleCloseTable}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            Liberar Mesa
          </button>
        </div>

        {showAddPerson && (
          <form onSubmit={handleAddPerson} className="mb-6 p-4 bg-gray-50 rounded-md">
            <h3 className="font-medium mb-2">Adicionar Pessoa à Mesa</h3>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder="Nome da pessoa"
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Adicionar
              </button>
              <button
                type="button"
                onClick={() => setShowAddPerson(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Total da Mesa - movido para o topo */}
      {openTabs.length > 0 && calculation && (
        <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-400 rounded-lg p-6 mb-6 shadow-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Total da Mesa</h2>
            <div className="text-4xl font-bold text-green-700">
              R$ {calculation.grandTotal.toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {openTabs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-500">Nenhuma pessoa na mesa</p>
          <button
            onClick={() => setShowAddPerson(true)}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Adicionar primeira pessoa
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {openTabs.map((tab: any) => (
              <div key={tab.id} className="bg-white shadow-lg rounded-lg p-6 border-2 border-gray-100">
                {/* Cabeçalho com nome do cliente */}
                <div className="mb-4 pb-4 border-b-2 border-gray-200">
                  <h3 className="text-2xl font-bold text-black mb-2">
                    {tab.person?.name || 'Sem nome'}
                  </h3>
                  <div className="flex gap-2">
                    <Link
                      to={`/tabs/${tab.id}/payment`}
                      className="px-3 py-1 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700"
                    >
                      Fechar Conta
                    </Link>
                    {tab.person && (
                      <button
                        onClick={() => deletePerson.mutate(tab.person.id)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedTabId(tab.id);
                    setShowAddOrder(true);
                  }}
                  className="w-full mb-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
                >
                  + Adicionar Pedido
                </button>

                {/* Pedidos */}
                {tab.orders && tab.orders.length > 0 ? (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-3">
                      {tab.orders.map((order: any) => (
                        <div key={order.id} className="flex justify-between items-center bg-white p-3 rounded border">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{order.menuItem.name}</p>
                            <p className="text-sm text-gray-600 mt-1">Quantidade: {order.quantity}</p>
                          </div>
                          <p className="text-lg font-bold text-gray-900 ml-4">
                            R$ {order.totalPrice.toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t-2 border-gray-300">
                      <span className="text-lg font-bold text-gray-900">Total:</span>
                      <span className="text-2xl font-bold text-green-600">
                        R$ {tab.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <p className="text-gray-500">Nenhum pedido ainda</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {showAddOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold mb-4">Adicionar Pedido</h2>
            <form onSubmit={handleAddOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecione o item
                </label>
                <select
                  required
                  value={selectedMenuItemId}
                  onChange={(e) => setSelectedMenuItemId(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                >
                  <option value="">Escolha um item...</option>
                  {Object.values(MenuCategory).map((category) => {
                    const items = menuItems?.filter((item) => item.category === category);
                    if (!items || items.length === 0) return null;
                    return (
                      <optgroup key={category} label={MENU_CATEGORY_LABELS[category]}>
                        {items.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} - R$ {item.price.toFixed(2)}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantidade</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Sem cebola"
                  rows={3}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={createOrder.isPending}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {createOrder.isPending ? 'Adicionando...' : 'Adicionar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddOrder(false);
                    setSelectedMenuItemId('');
                    setQuantity(1);
                    setNotes('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
