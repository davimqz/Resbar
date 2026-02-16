import { FaClock, FaUsers, FaShoppingCart } from 'react-icons/fa';
import formatCurrency from '../../lib/formatCurrency';

interface TabTypeDistribution {
  type: string;
  count: number;
  revenue: number;
  percentage: number;
}

interface Props {
  avgTimeToPayment: number;
  tabTypeDistribution: TabTypeDistribution[];
  avgItemPrice: number;
  avgQuantity: number;
}

export default function BehavioralMetrics({ 
  avgTimeToPayment, 
  tabTypeDistribution, 
  avgItemPrice, 
  avgQuantity 
}: Props) {
  const getTimeQuality = (minutes: number) => {
    if (minutes < 30) return { label: 'Excelente', color: 'text-green-600', bg: 'bg-green-50' };
    if (minutes < 45) return { label: 'Bom', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (minutes < 60) return { label: 'Atenção', color: 'text-orange-600', bg: 'bg-orange-50' };
    return { label: 'Lento', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const timeQuality = getTimeQuality(avgTimeToPayment);

  return (
    <div className="space-y-6">
      {/* Tempo Médio até Pagamento */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <FaClock className="w-6 h-6 text-blue-700" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">⏳ Tempo Médio até Pagamento</h3>
            <p className="text-sm text-gray-600">Do cliente sentar até fechar a conta</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-4xl font-bold text-gray-900">
              {Math.round(avgTimeToPayment)} min
            </div>
            <div className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${timeQuality.bg} ${timeQuality.color}`}>
              {timeQuality.label}
            </div>
          </div>
          
          <div className="text-right space-y-2">
            <div className="text-sm text-gray-600">
              {avgTimeToPayment < 30 && '✅ Rotatividade alta'}
              {avgTimeToPayment >= 30 && avgTimeToPayment < 45 && '👍 Fluxo adequado'}
              {avgTimeToPayment >= 45 && avgTimeToPayment < 60 && '⚠️ Impacta fluxo de caixa'}
              {avgTimeToPayment >= 60 && '❌ Rotatividade baixa'}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            <strong>Insight:</strong> {
              avgTimeToPayment >= 60 
                ? 'Tempo muito alto pode indicar atendimento lento ou clientes demorando para fechar a conta.'
                : avgTimeToPayment >= 45
                ? 'Tempo moderado. Considere otimizar o processo de fechamento de conta.'
                : 'Tempo adequado indicando boa eficiência operacional.'
            }
          </p>
        </div>
      </div>

      {/* Comandas Unificadas vs Individuais */}
      {tabTypeDistribution.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FaUsers className="w-6 h-6 text-purple-700" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">🧾 Comandas Unificadas vs Individuais</h3>
              <p className="text-sm text-gray-600">Perfil de consumo dos clientes</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tabTypeDistribution.map((type) => (
              <div key={type.type} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{type.type}</span>
                  <span className="text-sm text-gray-600">{type.percentage.toFixed(1)}%</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Comandas:</span>
                    <span className="font-medium text-gray-900">{type.count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Receita:</span>
                    <span className="font-medium text-gray-900">{formatCurrency(type.revenue)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Ticket Médio:</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(type.count > 0 ? type.revenue / type.count : 0)}
                    </span>
                  </div>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full"
                    style={{ width: `${type.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Insight:</strong> {
                (tabTypeDistribution.find(t => t.type === 'Unificada')?.percentage ?? 0) > 60
                  ? 'Alta proporção de comandas unificadas indica grupos maiores e consumo coletivo.'
                  : 'Perfil equilibrado entre comandas individuais e unificadas.'
              }
            </p>
          </div>
        </div>
      )}

      {/* Valor Médio por Item */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <FaShoppingCart className="w-6 h-6 text-green-700" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">📌 Análise de Itens</h3>
            <p className="text-sm text-gray-600">Padrão de consumo por item</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gradient-to-br from-green-50 to-white rounded-lg border border-green-200">
            <div className="text-sm text-gray-600 mb-1">Valor Médio por Item</div>
            <div className="text-3xl font-bold text-gray-900">
              {formatCurrency(avgItemPrice)}
            </div>
            <div className="mt-2 text-xs text-gray-600">
              Preço médio dos itens pedidos
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-blue-50 to-white rounded-lg border border-blue-200">
            <div className="text-sm text-gray-600 mb-1">Quantidade Média por Pedido</div>
            <div className="text-3xl font-bold text-gray-900">
              {avgQuantity.toFixed(1)}
            </div>
            <div className="mt-2 text-xs text-gray-600">
              Unidades por item do pedido
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>Insight:</strong> {
              avgItemPrice > 50
                ? 'Itens de alto valor médio indicam cardápio premium ou foco em pratos principais.'
                : avgItemPrice > 30
                ? 'Faixa de preço intermediária, equilibrando acessibilidade e margem.'
                : 'Itens de menor valor podem indicar foco em acompanhamentos ou bebidas.'
            }
          </p>
        </div>
      </div>
    </div>
  );
}
