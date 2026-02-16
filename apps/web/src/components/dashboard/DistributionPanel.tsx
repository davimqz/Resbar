import BarChart from './BarChart';
import { FaExchangeAlt } from 'react-icons/fa';

interface TabsDistribution {
  waiterId: string;
  waiterName: string;
  tabsCount: number;
  percentage: number;
}

interface AvgTimeData {
  waiterId: string;
  waiterName: string;
  avgDeliveryMinutes: number;
}

interface HistoryData {
  tabId: string;
  assignmentsCount: number;
  uniqueWaiters: number;
  avgAssignmentMinutes: number;
}

interface Props {
  tabsDistribution: TabsDistribution[];
  avgTimeByWaiter: AvgTimeData[];
  waiterHistory: HistoryData[];
}

export default function DistributionPanel({ tabsDistribution, avgTimeByWaiter, waiterHistory }: Props) {

  // Detectar desequilíbrio (se algum garçom tem mais de 40% das comandas)
  const hasImbalance = tabsDistribution.some(w => w.percentage > 40);

  return (
    <div className="space-y-6">
      {/* Distribuição de Comandas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Comandas por Garçom</h3>
          {hasImbalance && (
            <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded">
              ⚠️ Desequilíbrio Detectado
            </span>
          )}
        </div>
        
        <div className="space-y-3">
          {tabsDistribution.map((waiter) => (
            <div key={waiter.waiterId} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">{waiter.waiterName}</span>
                <span className="text-gray-600">
                  {waiter.tabsCount} comandas ({waiter.percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    waiter.percentage > 40 ? 'bg-orange-500' : 'bg-indigo-600'
                  }`}
                  style={{ width: `${waiter.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {hasImbalance && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
              <strong>Atenção:</strong> Um ou mais garçons estão com mais de 40% das comandas.
              Considere redistribuir a carga de trabalho.
            </p>
          </div>
        )}
      </div>

      {/* Tempo Médio por Garçom */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold mb-4">Tempo Médio de Entrega por Garçom</h3>
        
        {avgTimeByWaiter.length > 0 ? (
          <BarChart 
            data={avgTimeByWaiter
              .filter(w => w.avgDeliveryMinutes > 0)
              .map(w => ({
                name: w.waiterName,
                value: Math.round(w.avgDeliveryMinutes)
              }))
            }
            dataKey="value"
            xKey="name"
            color="#6366f1"
          />
        ) : (
          <p className="text-sm text-gray-500 text-center py-8">
            Dados insuficientes para exibir o gráfico
          </p>
        )}
      </div>

      {/* Histórico de Trocas */}
      {waiterHistory.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <FaExchangeAlt className="text-orange-600" />
            <h3 className="text-lg font-semibold">Comandas com Múltiplas Trocas</h3>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Comandas que tiveram mais de um garçom responsável podem indicar instabilidade operacional.
          </p>

          <div className="space-y-2">
            {waiterHistory.slice(0, 5).map((history) => (
              <div
                key={history.tabId}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-900">
                    Comanda {history.tabId.substring(0, 8)}...
                  </div>
                  <div className="text-xs text-gray-600">
                    {history.assignmentsCount} trocas • {history.uniqueWaiters} garçons diferentes
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-700">
                    ~{Math.round(history.avgAssignmentMinutes)} min
                  </div>
                  <div className="text-xs text-gray-500">por responsável</div>
                </div>
              </div>
            ))}
          </div>

          {waiterHistory.length > 5 && (
            <p className="text-xs text-gray-500 mt-3">
              E mais {waiterHistory.length - 5} comandas com múltiplas trocas...
            </p>
          )}

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Insight:</strong> Muitas trocas podem indicar problema na organização do salão
              ou redistribuição frequente de mesas.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
