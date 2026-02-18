import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTab } from '../hooks/useTab';
import { useTabCancellation } from '../hooks/useTabCancellation';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '@resbar/shared';
import { useMenuItem } from '../hooks/useMenuItem';
import { useOrder } from '../hooks/useOrder';
import { PaymentMethod, PAYMENT_METHOD_LABELS, DEFAULT_SERVICE_CHARGE_RATE, MenuCategory, MENU_CATEGORY_LABELS, TabCancellationCategory, TAB_CANCELLATION_CATEGORY_LABELS, TabCancellationRequestStatus, PaymentEntry } from '@resbar/shared';
import formatCurrency from '../lib/formatCurrency';

interface AddedPayment extends PaymentEntry {
  id: string; // ID temporário para gerenciar a lista
}

export function PaymentPage() {
  const { tabId } = useParams<{ tabId: string }>();
  const navigate = useNavigate();
  const { useTabCalculation, useCloseTab, deleteTab } = useTab();
  const { createTabCancellationRequest, updateTabCancellationRequest } = useTabCancellation();
  const { user } = useAuthStore();

  const { data: calculation, isLoading } = useTabCalculation(tabId!);
  const closeTab = useCloseTab();
  const { useMenuItems } = useMenuItem();
  const { data: menuItems } = useMenuItems({ available: true });
  const { createOrder, updateOrder, deleteOrder } = useOrder();

  const [showAddOrder, setShowAddOrder] = useState(false);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [showEditOrder, setShowEditOrder] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editingQuantity, setEditingQuantity] = useState<number>(1);
  const [editingNotes, setEditingNotes] = useState<string>('');
  const [showCancelRequestModal, setShowCancelRequestModal] = useState(false);
  const [cancelCategory, setCancelCategory] = useState<TabCancellationCategory>(TabCancellationCategory.OUTROS);
  const [cancelReason, setCancelReason] = useState<string>('');

  // Estado para múltiplos pagamentos
  const [addedPayments, setAddedPayments] = useState<AddedPayment[]>([]);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [newPaymentMethod, setNewPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [newPaymentAmount, setNewPaymentAmount] = useState('');
  const [newPaymentReceived, setNewPaymentReceived] = useState('');

  const [serviceChargeIncluded, setServiceChargeIncluded] = useState(false);
  const [serviceChargePaidSeparately] = useState(false);

  const subtotal = calculation?.subtotal || 0;
  const serviceCharge = subtotal * DEFAULT_SERVICE_CHARGE_RATE;
  const total = subtotal + (serviceChargeIncluded && !serviceChargePaidSeparately ? serviceCharge : 0);

  // Calcular total alocado
  const totalAllocated = addedPayments.reduce((sum, payment) => sum + payment.amount, 0);

  const handleAddPayment = () => {
    const amount = parseFloat(newPaymentAmount);
    
    if (!amount || amount <= 0) {
      alert('Informe um valor válido maior que zero');
      return;
    }

    if (newPaymentMethod === PaymentMethod.CASH) {
      const received = parseFloat(newPaymentReceived);
      if (!received || received < amount) {
        alert('O valor recebido deve ser maior ou igual ao valor do pagamento');
        return;
      }

      const change = received - amount;
      setAddedPayments([...addedPayments, {
        id: `${Date.now()}`,
        paymentMethod: newPaymentMethod,
        amount,
        receivedAmount: received,
        changeAmount: change > 0 ? change : undefined,
      }]);
    } else {
      setAddedPayments([...addedPayments, {
        id: `${Date.now()}`,
        paymentMethod: newPaymentMethod,
        amount,
      }]);
    }

    // Resetar formulário
    setNewPaymentAmount('');
    setNewPaymentReceived('');
    setNewPaymentMethod(PaymentMethod.CASH);
    setShowAddPayment(false);
  };

  const handleRemovePayment = (id: string) => {
    setAddedPayments(addedPayments.filter(p => p.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tabId) return;

    if (addedPayments.length === 0) {
      alert('Adicione pelo menos um pagamento');
      return;
    }

    // Validar que a soma dos pagamentos é igual ao total
    const tolerance = 0.01; // Tolerância de 1 centavo
    if (Math.abs(totalAllocated - total) > tolerance) {
      alert(`A soma dos pagamentos (${formatCurrency(totalAllocated)}) deve ser igual ao total (${formatCurrency(total)})`);
      return;
    }

    // Construir array de PaymentEntry (removendo o id temporário)
    const paymentEntries: PaymentEntry[] = addedPayments.map(({ id, ...payment }) => payment);

    try {
      console.log('Enviando pagamentos:', {
        tabId,
        payments: paymentEntries,
        serviceChargeIncluded,
        serviceChargePaidSeparately,
      });
      await closeTab.mutateAsync({
        tabId,
        payments: paymentEntries,
        serviceChargeIncluded,
        serviceChargePaidSeparately,
      });

      alert('Pagamento realizado com sucesso!');
      navigate(-1);
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
    }
  };

  const handleRequestCancellation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tabId) return;
    try {
      const created = await createTabCancellationRequest.mutateAsync({
        tabId,
        category: cancelCategory,
        reason: cancelReason || undefined,
      });

      if (user?.role === UserRole.ADMIN) {
        try {
          await updateTabCancellationRequest.mutateAsync({ id: created.id, data: { status: TabCancellationRequestStatus.APPROVED } });
          alert('Solicitação criada e aprovada. Comanda cancelada.');
        } catch (err: any) {
          alert(err.message || 'Erro ao aprovar solicitação de cancelamento');
        }
      } else {
        alert('Solicitação de cancelamento enviada para aprovação do administrador');
      }

      setShowCancelRequestModal(false);
      setCancelCategory(TabCancellationCategory.OUTROS);
      setCancelReason('');
      navigate(-1);
    } catch (error: any) {
      alert(error.message || 'Erro ao solicitar cancelamento');
    }
  };

  if (isLoading) {
    return <div className="p-4">Carregando...</div>;
  }

  if (!calculation) {
    return <div className="p-4">Comanda não encontrada</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 w-full max-w-full">
      <div className="max-w-2xl mx-auto w-full">
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 w-full">
          <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Fechar Conta</h1>

          {/* Resumo da comanda */}
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded border-2 border-gray-200">
            <h2 className="font-bold text-lg sm:text-xl mb-3 sm:mb-4 text-black break-words">
              {calculation.personName || 'Cliente'}
            </h2>

            {calculation.items && calculation.items.length > 0 ? (
              <div>
                <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                  {calculation.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start sm:items-center bg-white p-2 sm:p-3 rounded border gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm sm:text-base text-gray-900 break-words">
                          {item.menuItem?.name || 'Item'}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Quantidade: {item.quantity}
                        </p>
                      </div>
                        <span className="font-bold text-sm sm:text-base text-gray-900 whitespace-nowrap ml-2">
                        {formatCurrency(item.totalPrice)}
                      </span>
                      {user?.role === UserRole.ADMIN && (
                        <div className="flex flex-col items-end ml-2">
                          <button
                            onClick={() => {
                              setEditingOrderId(item.id);
                              setEditingQuantity(item.quantity);
                              setEditingNotes(item.notes || '');
                              setShowEditOrder(true);
                            }}
                            className="mt-2 px-2 py-1 text-xs bg-yellow-400 text-black rounded hover:brightness-95"
                          >
                            Editar
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm('Excluir pedido?')) return;
                              try {
                                await deleteOrder.mutateAsync(item.id);
                                alert('Pedido excluído');
                              } catch (err: any) {
                                alert(err.message || 'Erro ao excluir pedido');
                              }
                            }}
                            className="mt-2 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Excluir
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="border-t-2 pt-2 sm:pt-3 mt-2 sm:mt-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">Subtotal:</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-lg sm:text-xl font-bold text-gray-900">Total:</span>
                      <span className="text-xl sm:text-2xl font-bold text-green-600">
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4 text-sm sm:text-base">Nenhum item na comanda</p>
            )}
          </div>

          {/* Actions: add order + Formulário de pagamento */}
          <div className="mt-4 mb-4 flex gap-2 flex-wrap">
            <button
              onClick={() => setShowAddOrder(true)}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              + Adicionar Pedido
            </button>
            {/* Garçom pode solicitar cancelamento (precisa aprovação admin) */}
            {user?.role === UserRole.WAITER && (
              <button
                onClick={() => setShowCancelRequestModal(true)}
                className="inline-flex items-center justify-center rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:brightness-95"
              >
                Solicitar Cancelamento
              </button>
            )}
            {/* Admin pode cancelar direto (sem aprovação) */}
            {user?.role === UserRole.ADMIN && (
              <button
                onClick={() => setShowCancelRequestModal(true)}
                className="inline-flex items-center justify-center rounded-md bg-yellow-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:brightness-95"
              >
                Cancelar Comanda (ADM)
              </button>
            )}
            {(user?.role === UserRole.ADMIN || user?.role === UserRole.WAITER) && (
              <button
                onClick={async () => {
                  if (!confirm('Excluir comanda? Esta ação é irreversível.')) return;
                  try {
                    await deleteTab.mutateAsync(tabId!);
                    alert('Comanda excluída');
                    navigate('/tables');
                  } catch (err: any) {
                    alert(err.message || 'Erro ao excluir comanda');
                  }
                }}
                className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700"
              >
                Excluir Comanda
              </button>
            )}
          </div>

          {/* Formulário de pagamento */}
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 w-full">

            {/* Indicador de progresso */}
            <div className="p-4 bg-gray-100 rounded-lg border-2 border-gray-300">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Total alocado:</span>
                <span className={`text-lg font-bold ${Math.abs(totalAllocated - total) < 0.01 ? 'text-green-600' : 'text-orange-600'}`}>
                  {formatCurrency(totalAllocated)} / {formatCurrency(total)}
                </span>
              </div>
              {Math.abs(totalAllocated - total) >= 0.01 && (
                <p className="text-xs text-orange-600">
                  {totalAllocated < total 
                    ? `Faltam ${formatCurrency(total - totalAllocated)} para completar o pagamento`
                    : `Excesso de ${formatCurrency(totalAllocated - total)}`
                  }
                </p>
              )}
              {Math.abs(totalAllocated - total) < 0.01 && totalAllocated > 0 && (
                <p className="text-xs text-green-600">✓ Pagamento completo</p>
              )}
            </div>

            {/* Taxa de Serviço - apenas para garçons e admins */}
            {(user?.role === UserRole.WAITER || user?.role === UserRole.ADMIN) && (
              <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="service-charge-checkbox"
                    checked={serviceChargeIncluded}
                    onChange={(e) => setServiceChargeIncluded(e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="service-charge-checkbox" className="text-sm font-medium text-gray-900">
                    Incluir taxa de serviço de 10% ({formatCurrency(serviceCharge)})
                  </label>
                </div>
                {serviceChargeIncluded && (
                  <p className="mt-2 text-xs text-gray-600">
                    Total com taxa: {formatCurrency(total)}
                  </p>
                )}
              </div>
            )}

            {/* Lista de Pagamentos Adicionados */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Pagamentos</h3>
                <button
                  type="button"
                  onClick={() => setShowAddPayment(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                >
                  + Adicionar Pagamento
                </button>
              </div>

              {addedPayments.length === 0 ? (
                <div className="p-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center">
                  <p className="text-gray-500">Nenhum pagamento adicionado</p>
                  <p className="text-xs text-gray-400 mt-1">Clique em "Adicionar Pagamento" para começar</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {addedPayments.map((payment) => (
                    <div key={payment.id} className="p-4 bg-white border-2 border-gray-200 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">
                              {PAYMENT_METHOD_LABELS[payment.paymentMethod]}
                            </span>
                            <span className="text-lg font-bold text-green-600">
                              {formatCurrency(payment.amount)}
                            </span>
                          </div>
                          {payment.paymentMethod === PaymentMethod.CASH && payment.receivedAmount && (
                            <div className="text-sm text-gray-600">
                              <p>Recebido: {formatCurrency(payment.receivedAmount)}</p>
                              {payment.changeAmount && payment.changeAmount > 0 && (
                                <p className="text-green-600 font-semibold">
                                  Troco: {formatCurrency(payment.changeAmount)}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePayment(payment.id)}
                          className="ml-3 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-full sm:flex-1 px-4 py-3 sm:py-2 border-2 border-gray-300 rounded hover:bg-gray-50 text-gray-700 font-medium text-sm sm:text-base"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={closeTab.isPending}
                className="w-full sm:flex-1 px-4 py-3 sm:py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 font-medium text-sm sm:text-base"
              >
                {closeTab.isPending ? 'Processando...' : 'Confirmar Pagamento'}
              </button>
            </div>
          </form>

          {showAddOrder && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                <h2 className="text-2xl font-bold mb-4">Adicionar Pedido</h2>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      await createOrder.mutateAsync({
                        tabId: tabId!,
                        menuItemId: selectedMenuItemId,
                        quantity,
                        notes: notes || undefined,
                      });
                      setSelectedMenuItemId('');
                      setQuantity(1);
                      setNotes('');
                      setShowAddOrder(false);
                    } catch (err: any) {
                      alert(err.message || 'Erro ao adicionar pedido');
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Selecione o item</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ex: Sem cebola"
                      rows={3}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                      Adicionar
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddOrder(false)}
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

          {/* Modal de Adicionar Pagamento */}
          {showAddPayment && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-md w-full p-6">
                <h2 className="text-xl font-bold mb-4">Adicionar Pagamento</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Método de Pagamento</label>
                    <select
                      value={newPaymentMethod}
                      onChange={(e) => setNewPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full rounded-md border-gray-300 px-3 py-2 border"
                    >
                      {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Valor do Pagamento</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={newPaymentAmount}
                      onChange={(e) => setNewPaymentAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-md border-gray-300 px-3 py-2 border"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Restante: {formatCurrency(Math.max(0, total - totalAllocated))}
                    </p>
                  </div>

                  {newPaymentMethod === PaymentMethod.CASH && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Valor Recebido em Dinheiro</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={newPaymentReceived}
                        onChange={(e) => setNewPaymentReceived(e.target.value)}
                        placeholder="0.00"
                        className="w-full rounded-md border-gray-300 px-3 py-2 border"
                        required
                      />
                      {parseFloat(newPaymentAmount) > 0 && parseFloat(newPaymentReceived) > 0 && (
                        <p className="mt-2 text-sm">
                          Troco: <span className="font-semibold text-green-600">
                            {formatCurrency(Math.max(0, parseFloat(newPaymentReceived) - parseFloat(newPaymentAmount)))}
                          </span>
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleAddPayment}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      Adicionar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddPayment(false);
                        setNewPaymentAmount('');
                        setNewPaymentReceived('');
                        setNewPaymentMethod(PaymentMethod.CASH);
                      }}
                      className="px-4 py-2 border rounded hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
