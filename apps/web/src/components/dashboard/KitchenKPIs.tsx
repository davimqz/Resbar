interface KitchenKPIsProps {
  avgPrepTime: number;
  avgTotalTime: number;
  delayedPercentage: number;
  delayedCount: number;
  ordersVolume: number;
  peakSimultaneous: number;
  slaMinutes: number;
}

export default function KitchenKPIs({
  avgPrepTime,
  avgTotalTime,
  delayedPercentage,
  delayedCount,
  ordersVolume,
  peakSimultaneous,
  slaMinutes
}: KitchenKPIsProps) {
  const getSLAStatus = () => {
    if (avgPrepTime <= slaMinutes * 0.7) return { color: 'text-green-600', icon: '✅', label: 'Excelente' };
    if (avgPrepTime <= slaMinutes) return { color: 'text-blue-600', icon: '✓', label: 'Dentro do SLA' };
    if (avgPrepTime <= slaMinutes * 1.2) return { color: 'text-orange-600', icon: '⚠', label: 'Atenção' };
    return { color: 'text-red-600', icon: '🚨', label: 'Crítico' };
  };

  const slaStatus = getSLAStatus();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {/* Tempo Médio de Preparo */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">⏱ Tempo Médio Preparo</span>
        </div>
        <div className={`text-2xl font-bold ${slaStatus.color}`}>
          {avgPrepTime > 0 ? `${Math.round(avgPrepTime)} min` : '-'}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          SLA: {slaMinutes} min • {slaStatus.icon} {slaStatus.label}
        </div>
      </div>

      {/* Tempo Total até Entrega */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">⚡ Tempo Total Entrega</span>
        </div>
        <div className="text-2xl font-bold text-gray-900">
          {avgTotalTime > 0 ? `${Math.round(avgTotalTime)} min` : '-'}
        </div>
        <div className="text-xs text-gray-500 mt-1">da cozinha ao cliente</div>
      </div>

      {/* Percentual de Atraso */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">📊 % Pedidos Atrasados</span>
        </div>
        <div className={`text-2xl font-bold ${
          delayedPercentage > 25 ? 'text-red-600' :
          delayedPercentage > 15 ? 'text-orange-600' :
          'text-green-600'
        }`}>
          {delayedPercentage.toFixed(1)}%
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {delayedCount} de {ordersVolume} pedidos
        </div>
      </div>

      {/* Volume de Pedidos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">🧾 Volume de Pedidos</span>
        </div>
        <div className="text-2xl font-bold text-gray-900">
          {ordersVolume}
        </div>
        <div className="text-xs text-gray-500 mt-1">no período selecionado</div>
      </div>

      {/* Pico Simultâneo */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">🔥 Pico Simultâneo</span>
        </div>
        <div className="text-2xl font-bold text-orange-600">
          {peakSimultaneous}
        </div>
        <div className="text-xs text-gray-500 mt-1">pedidos ao mesmo tempo</div>
      </div>

      {/* Status Geral da Cozinha */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">🎯 Status Geral</span>
        </div>
        <div className={`text-2xl font-bold ${
          delayedPercentage < 10 && avgPrepTime <= slaMinutes ? 'text-green-600' :
          delayedPercentage < 20 && avgPrepTime <= slaMinutes * 1.1 ? 'text-blue-600' :
          'text-red-600'
        }`}>
          {delayedPercentage < 10 && avgPrepTime <= slaMinutes ? '✅ Ótimo' :
           delayedPercentage < 20 && avgPrepTime <= slaMinutes * 1.1 ? '✓ Bom' :
           '⚠ Atenção'}
        </div>
        <div className="text-xs text-gray-500 mt-1">performance geral</div>
      </div>
    </div>
  );
}
