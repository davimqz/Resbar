import BarChart from './BarChart';

interface TemporalData {
  avgTimeByHour: Array<{ hour: number; avgPrepMinutes: number; ordersCount: number }>;
  volumeByHour: Array<{ hour: number; ordersCount: number }>;
}

interface KitchenTemporalProps {
  temporal: TemporalData;
  slaMinutes: number;
}

export default function KitchenTemporal({ temporal, slaMinutes }: KitchenTemporalProps) {
  // Preparar dados para gráficos
  const volumeData = temporal.volumeByHour.map(item => ({
    label: `${item.hour}h`,
    value: item.ordersCount
  }));

  // Encontrar horários críticos
  const criticalHours = temporal.avgTimeByHour
    .filter(item => item.avgPrepMinutes > slaMinutes * 1.2)
    .map(item => item.hour);

  const peakHours = temporal.volumeByHour
    .filter(item => item.ordersCount >= Math.max(...temporal.volumeByHour.map(v => v.ordersCount)) * 0.8)
    .map(item => item.hour);

  return (
    <div className="space-y-6">
      {/* Volume de Pedidos por Hora */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold mb-4">🔥 Volume de Pedidos por Hora</h3>
        {volumeData.length > 0 ? (
          <>
            <BarChart data={volumeData} dataKey="value" xKey="label" color="#f97316" />
            {peakHours.length > 0 && (
              <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                <p className="text-sm text-orange-800">
                  🔥 <strong>Horários de Pico:</strong> {peakHours.map(h => `${h}h`).join(', ')}
                  <span className="block mt-1 text-xs">
                    Prepare a cozinha para maior capacidade nesses períodos.
                  </span>
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-gray-400">Sem dados de volume por hora</div>
        )}
      </div>

      {/* Tempo Médio por Faixa Horária */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold mb-4">⏱ Tempo Médio de Preparo por Hora</h3>
        {temporal.avgTimeByHour.length > 0 ? (
          <>
            {criticalHours.length > 0 && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  ⚠️ <strong>Horários Críticos:</strong> {criticalHours.map(h => `${h}h`).join(', ')}
                  <span className="block mt-1 text-xs">
                    Tempo de preparo acima do SLA ({slaMinutes} min) — possível gargalo operacional.
                  </span>
                </p>
              </div>
            )}
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horário</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tempo Médio</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pedidos</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">vs SLA</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {temporal.avgTimeByHour.map((item, idx) => {
                    const isCritical = item.avgPrepMinutes > slaMinutes * 1.2;
                    const isWarning = item.avgPrepMinutes > slaMinutes && !isCritical;
                    const variance = ((item.avgPrepMinutes / slaMinutes - 1) * 100);
                    
                    return (
                      <tr 
                        key={idx}
                        className={
                          isCritical ? 'bg-red-50' :
                          isWarning ? 'bg-orange-50' :
                          'hover:bg-gray-50'
                        }
                      >
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {item.hour}h
                          {peakHours.includes(item.hour) && (
                            <span className="ml-2 text-xs">🔥</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span className={
                            isCritical ? 'text-red-600 font-bold' :
                            isWarning ? 'text-orange-600 font-semibold' :
                            'text-gray-700'
                          }>
                            {item.avgPrepMinutes.toFixed(1)} min
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700">
                          {item.ordersCount}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span className={
                            variance > 20 ? 'text-red-600 font-bold' :
                            variance > 0 ? 'text-orange-600' :
                            'text-green-600'
                          }>
                            {variance > 0 ? '+' : ''}{variance.toFixed(0)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {isCritical ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              🚨 Crítico
                            </span>
                          ) : isWarning ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              ⚠ Atenção
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✓ OK
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Insights */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium text-blue-800 mb-1">⚡ Hora Mais Rápida</div>
                <div className="text-lg font-bold text-blue-900">
                  {(() => {
                    const fastest = [...temporal.avgTimeByHour].sort(
                      (a, b) => a.avgPrepMinutes - b.avgPrepMinutes
                    )[0];
                    return `${fastest.hour}h`;
                  })()}
                </div>
                <div className="text-xs text-blue-700">
                  {(() => {
                    const fastest = [...temporal.avgTimeByHour].sort(
                      (a, b) => a.avgPrepMinutes - b.avgPrepMinutes
                    )[0];
                    return `${fastest.avgPrepMinutes.toFixed(1)} min média`;
                  })()}
                </div>
              </div>

              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="text-sm font-medium text-orange-800 mb-1">🐌 Hora Mais Lenta</div>
                <div className="text-lg font-bold text-orange-900">
                  {(() => {
                    const slowest = [...temporal.avgTimeByHour].sort(
                      (a, b) => b.avgPrepMinutes - a.avgPrepMinutes
                    )[0];
                    return `${slowest.hour}h`;
                  })()}
                </div>
                <div className="text-xs text-orange-700">
                  {(() => {
                    const slowest = [...temporal.avgTimeByHour].sort(
                      (a, b) => b.avgPrepMinutes - a.avgPrepMinutes
                    )[0];
                    return `${slowest.avgPrepMinutes.toFixed(1)} min média`;
                  })()}
                </div>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-sm font-medium text-purple-800 mb-1">📊 Variação</div>
                <div className="text-lg font-bold text-purple-900">
                  {(() => {
                    const times = temporal.avgTimeByHour.map(h => h.avgPrepMinutes);
                    const min = Math.min(...times);
                    const max = Math.max(...times);
                    return `${((max - min) / min * 100).toFixed(0)}%`;
                  })()}
                </div>
                <div className="text-xs text-purple-700">entre melhor e pior hora</div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-400">Sem dados de tempo por hora</div>
        )}
      </div>
    </div>
  );
}
