import formatCurrency from '../../lib/formatCurrency';

interface OperationalKPIsProps {
  avgDeliveryTime: number;
  avgTimeToPayment: number;
  closedTabsCount: number;
  throughputPerHour: number;
  utilizationRate: number;
  tableTurnoverRate: number;
}

export default function OperationalKPIs({
  avgDeliveryTime,
  avgTimeToPayment,
  closedTabsCount,
  throughputPerHour,
  utilizationRate,
  tableTurnoverRate
}: OperationalKPIsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {/* Tempo Médio até Entrega */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">⚡ Tempo Médio Entrega</span>
        </div>
        <div className="text-2xl font-bold text-gray-900">
          {avgDeliveryTime > 0 ? `${Math.round(avgDeliveryTime)} min` : '-'}
        </div>
        <div className="text-xs text-gray-500 mt-1">da cozinha ao cliente</div>
      </div>

      {/* Tempo Médio até Pagamento */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">⏱ Tempo Médio Pagamento</span>
        </div>
        <div className="text-2xl font-bold text-gray-900">
          {avgTimeToPayment > 0 ? `${Math.round(avgTimeToPayment)} min` : '-'}
        </div>
        <div className="text-xs text-gray-500 mt-1">cliente sentou → pagamento</div>
      </div>

      {/* Throughput */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">🔄 Throughput</span>
        </div>
        <div className="text-2xl font-bold text-gray-900">
          {throughputPerHour.toFixed(1)}/h
        </div>
        <div className="text-xs text-gray-500 mt-1">{closedTabsCount} comandas fechadas</div>
      </div>

      {/* Taxa de Utilização */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">🪑 Utilização Mesas</span>
        </div>
        <div className="text-2xl font-bold text-gray-900">
          {utilizationRate.toFixed(1)}%
        </div>
        <div className="text-xs text-gray-500 mt-1">tempo ocupado / total</div>
      </div>

      {/* Taxa de Rotatividade */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">🔁 Rotatividade</span>
        </div>
        <div className="text-2xl font-bold text-gray-900">
          {tableTurnoverRate.toFixed(1)}x
        </div>
        <div className="text-xs text-gray-500 mt-1">comandas por mesa</div>
      </div>

      {/* Status Geral */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">📊 Status Geral</span>
        </div>
        <div className="text-2xl font-bold text-green-600">
          {avgDeliveryTime < 15 && utilizationRate > 60 ? '✓ Eficiente' : '⚠ Atenção'}
        </div>
        <div className="text-xs text-gray-500 mt-1">indicadores operacionais</div>
      </div>
    </div>
  );
}
