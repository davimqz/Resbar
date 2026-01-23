import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTab } from '../hooks/useTab';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '@resbar/shared';
import { useMenuItem } from '../hooks/useMenuItem';
import { useOrder } from '../hooks/useOrder';
import { PaymentMethod, PAYMENT_METHOD_LABELS, DEFAULT_SERVICE_CHARGE_RATE, MenuCategory, MENU_CATEGORY_LABELS } from '@resbar/shared';

export function PaymentPage() {
  const { tabId } = useParams<{ tabId: string }>();
  const navigate = useNavigate();
  const { useTabCalculation, useCloseTab } = useTab();
  const { deleteTab } = useTab();
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

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // hide service charge UI; default backend creates tabs without service charge
  const [serviceChargeIncluded] = useState(false);
  const [serviceChargePaidSeparately] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const subtotal = calculation?.subtotal || 0;
  const serviceCharge = subtotal * DEFAULT_SERVICE_CHARGE_RATE;
  const total = subtotal + (serviceChargeIncluded && !serviceChargePaidSeparately ? serviceCharge : 0);
  const change = paidAmount ? Math.max(0, parseFloat(paidAmount) - total) : 0;

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tabId) return;

    const amount = parseFloat(paidAmount) || total;

    if (paymentMethod === PaymentMethod.CASH && amount < total) {
      alert('Valor pago insuficiente!');
      return;
    }

    try {
      console.log('Enviando pagamento:', {
        tabId,
        paymentMethod,
        paidAmount: amount,
        serviceChargeIncluded,
        serviceChargePaidSeparately,
      });
      await closeTab.mutateAsync({
        tabId,
        paymentMethod,
        paidAmount: amount,
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
                      R$ {item.totalPrice.toFixed(2)}
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
                    <span className="font-semibold text-gray-900">R$ {subtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-lg sm:text-xl font-bold text-gray-900">Total:</span>
                    <span className="text-xl sm:text-2xl font-bold text-green-600">
                      R$ {total.toFixed(2)}
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
        <div className="mt-4 mb-4 flex gap-2">
          <button
            onClick={() => setShowAddOrder(true)}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            + Adicionar Pedido
          </button>
          {user?.role === UserRole.ADMIN && (
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
              Excluir Comanda (ADM)
            </button>
          )}
        </div>

        {/* Formulário de pagamento */}
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 w-full">

          <div className="w-full">
            <label className="block text-sm font-medium mb-2">
              Método de Pagamento
            </label>
            
            {/* Dropdown Custom */}
            <div ref={dropdownRef} className="relative w-full">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full max-w-full border rounded px-3 py-2 text-sm sm:text-base bg-white text-left flex items-center justify-between"
              >
                <span className="truncate pr-2">
                  {PAYMENT_METHOD_LABELS[paymentMethod]}
                </span>
                <svg 
                  className={`w-4 h-4 transition-transform flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(value as PaymentMethod);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm sm:text-base hover:bg-gray-100 truncate ${
                        paymentMethod === value ? 'bg-blue-50 font-medium' : ''
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {paymentMethod === PaymentMethod.CASH && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Valor Recebido
              </label>
              <input
                type="number"
                step="0.01"
                min={total}
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder={`Mínimo: R$ ${total.toFixed(2)}`}
                className="w-full border rounded px-3 py-2 text-sm sm:text-base"
                required
              />
              {paidAmount && change > 0 && (
                <p className="mt-2 text-green-600 font-semibold text-sm sm:text-base">
                  Troco: R$ {change.toFixed(2)}
                </p>
              )}
            </div>
          )}

          {paymentMethod !== PaymentMethod.CASH && (
            <div className="p-3 bg-blue-50 rounded text-xs sm:text-sm">
              <p className="font-medium">Valor a cobrar: R$ {total.toFixed(2)}</p>
            </div>
          )}

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

      </div>
    </div>
  </div>
  );
}
