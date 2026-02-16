interface TableEfficiencyItem {
  tableId: string;
  tableNumber: number;
  tabsCount: number;
  avgOccupiedMinutes: number;
  totalOccupiedHours: number;
  turnoverRate: number;
}

interface TableEfficiencyProps {
  data: TableEfficiencyItem[];
}

export default function TableEfficiency({ data }: TableEfficiencyProps) {
  // Ordenar por número de comandas (descendente)
  const sortedData = [...data].sort((a, b) => b.tabsCount - a.tabsCount);
  
  // Pegar top 15 mesas
  const topTables = sortedData.slice(0, 15);
  
  // Calcular médias
  const avgTabsCount = data.length > 0 ? data.reduce((sum, t) => sum + t.tabsCount, 0) / data.length : 0;
  const avgOccupiedMinutes = data.length > 0 ? data.reduce((sum, t) => sum + t.avgOccupiedMinutes, 0) / data.length : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">🏗 Eficiência por Mesa</h3>
        <div className="text-sm text-gray-500">
          Média: {avgTabsCount.toFixed(1)} comandas | {avgOccupiedMinutes.toFixed(0)} min ocupada
        </div>
      </div>

      {topTables.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mesa</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Comandas</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tempo Médio</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Ocupado</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rotatividade</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Performance</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topTables.map((table, idx) => {
                const isHighPerformance = table.tabsCount > avgTabsCount * 1.2;
                const isLowPerformance = table.tabsCount < avgTabsCount * 0.5 && table.tabsCount > 0;
                const isLongOccupied = table.avgOccupiedMinutes > avgOccupiedMinutes * 1.5;
                
                return (
                  <tr 
                    key={table.tableId} 
                    className={
                      isHighPerformance ? 'bg-green-50' : 
                      isLowPerformance ? 'bg-yellow-50' : ''
                    }
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">
                          Mesa {table.tableNumber}
                        </span>
                        {idx < 3 && (
                          <span className="ml-2 text-xs">
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                      {table.tabsCount}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className={isLongOccupied ? 'text-orange-600 font-semibold' : 'text-gray-700'}>
                        {table.avgOccupiedMinutes.toFixed(0)} min
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700">
                      {table.totalOccupiedHours.toFixed(1)}h
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700">
                      {table.turnoverRate.toFixed(1)}x
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {isHighPerformance ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ⭐ Alta
                        </span>
                      ) : isLowPerformance ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          ⚠ Baixa
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          ✓ Normal
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          Sem dados de eficiência de mesas no período
        </div>
      )}

      {/* Insights */}
      {topTables.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-sm font-medium text-green-800 mb-1">🥇 Mais Produtiva</div>
            <div className="text-lg font-bold text-green-900">
              Mesa {topTables[0].tableNumber}
            </div>
            <div className="text-xs text-green-700">{topTables[0].tabsCount} comandas</div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-sm font-medium text-blue-800 mb-1">⚡ Mais Rápida</div>
            <div className="text-lg font-bold text-blue-900">
              {(() => {
                const fastest = [...topTables].sort((a, b) => 
                  a.avgOccupiedMinutes - b.avgOccupiedMinutes
                )[0];
                return `Mesa ${fastest.tableNumber}`;
              })()}
            </div>
            <div className="text-xs text-blue-700">
              {(() => {
                const fastest = [...topTables].sort((a, b) => 
                  a.avgOccupiedMinutes - b.avgOccupiedMinutes
                )[0];
                return `${fastest.avgOccupiedMinutes.toFixed(0)} min média`;
              })()}
            </div>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-sm font-medium text-purple-800 mb-1">🔄 Maior Rotatividade</div>
            <div className="text-lg font-bold text-purple-900">
              {(() => {
                const highestTurnover = [...topTables].sort((a, b) => 
                  b.turnoverRate - a.turnoverRate
                )[0];
                return `Mesa ${highestTurnover.tableNumber}`;
              })()}
            </div>
            <div className="text-xs text-purple-700">
              {(() => {
                const highestTurnover = [...topTables].sort((a, b) => 
                  b.turnoverRate - a.turnoverRate
                )[0];
                return `${highestTurnover.turnoverRate.toFixed(1)}x`;
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
