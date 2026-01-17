import { useState } from 'react';
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

  const total = calculation?.total || 0;
  const change = paidAmount ? Math.max(0, parseFloat(paidAmount) - total) : 0;

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
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Fechar Conta</h1>

        {/* Resumo da comanda */}
        <div className="mb-6 p-4 bg-gray-50 rounded">
          <h2 className="font-semibold text-lg mb-3">{calculation.personName}</h2>
          
          <div className="space-y-2 mb-4">
            {calculation.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.quantity}x {item.menuItem?.name}
                </span>
                <span>R$ {item.totalPrice.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Formulário de pagamento */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Método de Pagamento
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full border rounded px-3 py-2"
            >
              {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
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
                className="w-full border rounded px-3 py-2"
                required
              />
              {paidAmount && change > 0 && (
                <p className="mt-2 text-green-600 font-semibold">
                  Troco: R$ {change.toFixed(2)}
                </p>
              )}
            </div>
          )}

          {paymentMethod !== PaymentMethod.CASH && (
            <div className="p-3 bg-blue-50 rounded text-sm">
              <p className="font-medium">Valor a cobrar: R$ {total.toFixed(2)}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={closeTab.isPending}
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
            >
              {closeTab.isPending ? 'Processando...' : 'Confirmar Pagamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
