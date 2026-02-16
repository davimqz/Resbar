import { FaDollarSign, FaReceipt, FaCreditCard, FaMoneyBillWave } from 'react-icons/fa';
import formatCurrency from '../../lib/formatCurrency';

interface PaymentMethod {
  method: string;
  revenue: number;
  count: number;
  percentage: number;
}

interface Props {
  totalRevenue: number;
  avgTicket: number;
  paidTabsCount: number;
  totalServiceCharge: number;
  revenueByPayment: PaymentMethod[];
}

export default function FinanceKPIs({ 
  totalRevenue, 
  avgTicket, 
  paidTabsCount, 
  totalServiceCharge, 
  revenueByPayment 
}: Props) {
  const getPaymentMethodIcon = (method: string) => {
    const lower = method?.toLowerCase() || '';
    if (lower.includes('pix')) return '💚';
    if (lower.includes('card') || lower.includes('cartão') || lower.includes('credit') || lower.includes('debit')) return '💳';
    if (lower.includes('cash') || lower.includes('dinheiro')) return '💵';
    return '💰';
  };

  return (
    <div className="space-y-6">
      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receita Total */}
        <div className="bg-gradient-to-br from-green-50 to-white rounded-xl shadow-sm border border-green-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FaDollarSign className="w-6 h-6 text-green-700" />
            </div>
            <div className="text-sm font-medium text-green-700 uppercase tracking-wide">
              Receita Total
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {formatCurrency(totalRevenue)}
          </div>
          <div className="text-xs text-gray-600">No período selecionado</div>
        </div>

        {/* Ticket Médio */}
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-sm border border-blue-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaReceipt className="w-6 h-6 text-blue-700" />
            </div>
            <div className="text-sm font-medium text-blue-700 uppercase tracking-wide">
              Ticket Médio
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {formatCurrency(avgTicket)}
          </div>
          <div className="text-xs text-gray-600">Por comanda paga</div>
        </div>

        {/* Comandas Pagas */}
        <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl shadow-sm border border-purple-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FaCreditCard className="w-6 h-6 text-purple-700" />
            </div>
            <div className="text-sm font-medium text-purple-700 uppercase tracking-wide">
              Comandas Pagas
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {paidTabsCount}
          </div>
          <div className="text-xs text-gray-600">Volume operacional</div>
        </div>

        {/* Taxa de Serviço */}
        <div className="bg-gradient-to-br from-amber-50 to-white rounded-xl shadow-sm border border-amber-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <FaMoneyBillWave className="w-6 h-6 text-amber-700" />
            </div>
            <div className="text-sm font-medium text-amber-700 uppercase tracking-wide">
              Taxa de Serviço
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {formatCurrency(totalServiceCharge)}
          </div>
          <div className="text-xs text-gray-600">Arrecadada no período</div>
        </div>
      </div>

      {/* Receita por Método de Pagamento */}
      {revenueByPayment.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-4">💳 Receita por Método de Pagamento</h3>
          
          <div className="space-y-3">
            {revenueByPayment.map((method) => (
              <div key={method.method} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getPaymentMethodIcon(method.method)}</span>
                    <span className="font-medium text-gray-700">{method.method}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {formatCurrency(method.revenue)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {method.count} comandas • {method.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${method.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total Verificado:</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(revenueByPayment.reduce((sum, m) => sum + m.revenue, 0))}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
