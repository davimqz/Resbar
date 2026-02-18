import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTable } from '../hooks/useTable';
import { usePerson } from '../hooks/usePerson';
import { useOrder } from '../hooks/useOrder';
import { useAuthStore } from '../store/authStore';
import formatCurrency from '../lib/formatCurrency';
import { UserRole } from '@resbar/shared';
import { useMenuItem } from '../hooks/useMenuItem';
import { useWaiter } from '../hooks/useWaiter';
import { useTab } from '../hooks/useTab';
import { useTabCancellation } from '../hooks/useTabCancellation';
import { TableStatus, MenuCategory, MENU_CATEGORY_LABELS, TabCancellationCategory, TAB_CANCELLATION_CATEGORY_LABELS } from '@resbar/shared';
import RequestReturnModal from '../components/RequestReturnModal';

export default function TableDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { useTableById, assignWaiter, updateTableStatus } = useTable();
  const { createPerson } = usePerson();
  const { createOrder, updateOrder, deleteOrder } = useOrder();
  const { useMenuItems } = useMenuItem();
  const { useWaiters } = useWaiter();
  const { useTableCalculation, deleteTab, transferAccount } = useTab();
  const { createTabCancellationRequest, updateTabCancellationRequest } = useTabCancellation();
  const { user } = useAuthStore();

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
  const [showEditOrder, setShowEditOrder] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editingQuantity, setEditingQuantity] = useState<number>(1);
  const [editingNotes, setEditingNotes] = useState<string>('');
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnOrderId, setReturnOrderId] = useState<string>('');
  const [returnOrderName, setReturnOrderName] = useState<string>('');
  const [returnTabId, setReturnTabId] = useState<string | undefined>(undefined);
  const [returnTableNumber, setReturnTableNumber] = useState<number | string | undefined>(undefined);
  const [showCancelRequestModal, setShowCancelRequestModal] = useState(false);
  const [cancelRequestTabId, setCancelRequestTabId] = useState<string>('');
  const [cancelCategory, setCancelCategory] = useState<TabCancellationCategory>(TabCancellationCategory.OUTROS);
  const [cancelReason, setCancelReason] = useState<string>('');


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

  const handleRequestCancellation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await createTabCancellationRequest.mutateAsync({
        tabId: cancelRequestTabId,
        category: cancelCategory,
        reason: cancelReason || undefined,
      });

      // If current user is admin, auto-approve the request (creates history with reason)
        if (user?.role === UserRole.ADMIN) {
        try {
          await updateTabCancellationRequest.mutateAsync({ id: created.id, data: { status: 'APPROVED' as any } });
          alert('Solicitação criada e aprovada. Comanda cancelada.');
        } catch (err: any) {
          alert(err.message || 'Erro ao aprovar solicitação de cancelamento');
        }
      } else {
        alert('Solicitação de cancelamento enviada para aprovação do administrador');
      }

      setShowCancelRequestModal(false);
      setCancelRequestTabId('');
      setCancelCategory(TabCancellationCategory.OUTROS);
      setCancelReason('');
    } catch (error: any) {
      alert(error.message || 'Erro ao solicitar cancelamento');
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
              {formatCurrency(calculation.grandTotal)}
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
                    <button
                      onClick={async () => {
                        if (!confirm(
                          `Transferir todos os pedidos de "${tab.person?.name || 'Sem nome'}" para uma comanda única?\n\nEsta ação não pode ser desfeita.`
                        )) return;

                        try {
                          await transferAccount.mutateAsync({ fromTabId: tab.id });
                          alert('Conta transferida com sucesso!');
                        } catch (err: any) {
                          alert(err.message || 'Erro ao transferir conta');
                        }
                      }}
                      className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
                    >
                      Transferir Conta
                    </button>
                    {/* Garçom pode solicitar cancelamento (precisa aprovação admin) */}
                    {user?.role === UserRole.WAITER && (
                      <button
                        onClick={() => {
                          setCancelRequestTabId(tab.id);
                          setShowCancelRequestModal(true);
                        }}
                        className="px-3 py-1 bg-orange-500 text-white text-sm rounded hover:brightness-95"
                      >
                        Solicitar Cancelamento
                      </button>
                    )}
                    {/* Admin pode cancelar direto (sem aprovação) */}
                    {user?.role === UserRole.ADMIN && (
                      <button
                        onClick={() => {
                          setCancelRequestTabId(tab.id);
                          setShowCancelRequestModal(true);
                        }}
                        className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:brightness-95"
                      >
                        Cancelar Comanda (ADM)
                      </button>
                    )}
                    {(user?.role === UserRole.ADMIN || user?.role === UserRole.WAITER) && (
                      <button
                        onClick={async () => {
                          if (!confirm('Excluir comanda? Esta ação é irreversível.')) return;
                          try {
                            await deleteTab.mutateAsync(tab.id);
                            alert('Comanda excluída');
                          } catch (err: any) {
                            alert(err.message || 'Erro ao excluir comanda');
                          }
                        }}
                        className="px-3 py-1 bg-red-700 text-white text-sm rounded hover:bg-red-800"
                      >
                        Excluir Comanda
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
                          <div className="flex items-center gap-3">
                            <p className="text-lg font-bold text-gray-900 ml-4">
                              R$ {order.totalPrice.toFixed(2)}
                            </p>
                            {(user?.role === UserRole.ADMIN || user?.role === UserRole.WAITER) && (
                              <div className="flex flex-col gap-2">
                                {/* Botão de Solicitar Devolução (Admin e Garçom) */}
                                <button
                                  onClick={() => {
                                    setReturnOrderId(order.id);
                                    setReturnOrderName(order.menuItem.name);
                                    setReturnTabId(tab.id);
                                    setReturnTableNumber((table as any).number || undefined);
                                    setShowReturnModal(true);
                                  }}
                                  className="px-2 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600"
                                >
                                  Solicitar Devolução
                                </button>
                                
                                {/* Botões de Editar e Excluir (somente Admin) */}
                                {user?.role === UserRole.ADMIN && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setEditingOrderId(order.id);
                                        setEditingQuantity(order.quantity);
                                        setEditingNotes(order.notes || '');
                                        setShowEditOrder(true);
                                      }}
                                      className="px-2 py-1 text-xs bg-yellow-400 text-black rounded hover:brightness-95"
                                    >
                                      Editar
                                    </button>
                                    <button
                                      onClick={async () => {
                                        if (!confirm('Excluir pedido?')) return;
                                        try {
                                          await deleteOrder.mutateAsync(order.id);
                                          alert('Pedido excluído');
                                        } catch (err: any) {
                                          alert(err.message || 'Erro ao excluir pedido');
                                        }
                                      }}
                                      className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                                    >
                                      Excluir
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
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
                            {item.name} - {formatCurrency(item.price)}
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

      {showEditOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Editar Pedido</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!editingOrderId) return;
                try {
                  await updateOrder.mutateAsync({ id: editingOrderId, data: { quantity: editingQuantity, notes: editingNotes || undefined } });
                  setShowEditOrder(false);
                  setEditingOrderId(null);
                } catch (err: any) {
                  alert(err.message || 'Erro ao atualizar pedido');
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-2">Quantidade</label>
                <input
                  type="number"
                  min={1}
                  value={editingQuantity}
                  onChange={(e) => setEditingQuantity(parseInt(e.target.value || '1'))}
                  className="w-full rounded-md border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Observações</label>
                <textarea
                  value={editingNotes}
                  onChange={(e) => setEditingNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border-gray-300 px-3 py-2"
                />
              </div>

              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-yellow-400 text-black px-4 py-2 rounded">Salvar</button>
                <button type="button" onClick={() => setShowEditOrder(false)} className="px-4 py-2 border rounded">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Solicitação de Devolução */}
      {showReturnModal && (
        <RequestReturnModal
          orderId={returnOrderId}
          orderName={returnOrderName}
          tabId={returnTabId}
          tableNumber={returnTableNumber}
          onClose={() => {
            setShowReturnModal(false);
            setReturnOrderId('');
            setReturnOrderName('');
            setReturnTabId(undefined);
            setReturnTableNumber(undefined);
          }}
        />
      )}

      {/* Modal de Solicitação de Cancelamento */}
      {showCancelRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Solicitar Cancelamento de Comanda</h2>
            <form onSubmit={handleRequestCancellation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Motivo do Cancelamento</label>
                <select
                  value={cancelCategory}
                  onChange={(e) => setCancelCategory(e.target.value as TabCancellationCategory)}
                  className="w-full rounded-md border-gray-300 px-3 py-2 border"
                  required
                >
                  {Object.entries(TAB_CANCELLATION_CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Descrição Detalhada (opcional)</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Descreva o motivo do cancelamento..."
                  rows={4}
                  className="w-full rounded-md border-gray-300 px-3 py-2 border"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ Esta solicitação será enviada para aprovação do administrador.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-orange-500 text-white px-4 py-2 rounded hover:brightness-95"
                >
                  Enviar Solicitação
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCancelRequestModal(false);
                    setCancelRequestTabId('');
                    setCancelCategory(TabCancellationCategory.OUTROS);
                    setCancelReason('');
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
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
