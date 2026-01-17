import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTab } from '../hooks/useTab';
import { PaymentMethod, PAYMENT_METHOD_LABELS } from '@resbar/shared';

export function PaymentPage() {
  const { tabId } = useParams<{ tabId: string }>();
  const navigate = useNavigate();
  const { useTabCalculation, useCloseTab } = useTab();
  
  const { data: calculation, isLoading } = useTabCalculation(tabId!);
  const closeTab = useCloseTab();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const total = calculation?.total || 0;
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
      await closeTab.mutateAsync({
        tabId,
        payment: {
          paymentMethod,
          paidAmount: amount,
        },
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
                  </div>
                ))}
              </div>

              <div className="border-t-2 pt-2 sm:pt-3 mt-2 sm:mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg sm:text-xl font-bold text-gray-900">Total:</span>
                  <span className="text-xl sm:text-2xl font-bold text-green-600">
                    R$ {total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4 text-sm sm:text-base">Nenhum item na comanda</p>
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
      </div>
    </div>
  </div>
  );
}
