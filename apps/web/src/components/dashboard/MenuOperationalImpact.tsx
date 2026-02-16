interface CategoryPrepTime {
  category: string;
  avgPrepMinutes: number;
  ordersCount: number;
  totalQuantity: number;
}

interface ItemDelayRate {
  itemId: string;
  itemName: string;
  itemCategory: string;
  totalOrders: number;
  delayedOrders: number;
  delayPercentage: number;
}

interface MenuOperationalImpactProps {
  categoryPrepTime: CategoryPrepTime[];
  itemDelayRate: ItemDelayRate[];
}

export default function MenuOperationalImpact({ categoryPrepTime, itemDelayRate }: MenuOperationalImpactProps) {
  const SLA_MINUTES = 20;

  return (
    <div className="space-y-6">
      {/* Tempo Médio por Categoria */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">⏱ Tempo Médio de Preparo por Categoria</h3>
          <p className="text-sm text-gray-500 mt-1">
            Ajuda a identificar categorias que pressionam a operação da cozinha
          </p>
        </div>

        {categoryPrepTime.length > 0 ? (
          <>
            <div className="space-y-3">
              {categoryPrepTime.map((cat, idx) => {
                const isSlow = cat.avgPrepMinutes > SLA_MINUTES * 1.2;
                const isWarning = cat.avgPrepMinutes > SLA_MINUTES && !isSlow;
                
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg ${
                      isSlow ? 'bg-red-50 border-2 border-red-300' :
                      isWarning ? 'bg-orange-50 border border-orange-200' :
                      'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-gray-900">{cat.category}</div>
                          {isSlow && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              🚨 Lento
                            </span>
                          )}
                          {isWarning && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              ⚠ Atenção
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-sm text-gray-600">
                          {cat.totalQuantity} vendas • {cat.ordersCount} pedidos
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${
                          isSlow ? 'text-red-700' :
                          isWarning ? 'text-orange-700' :
                          'text-green-700'
                        }`}>
                          {cat.avgPrepMinutes.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-500">min médio</div>
                      </div>
                    </div>

                    {/* Barra de comparação com SLA */}
                    <div className="mt-3">
                      <div className="relative pt-1">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>0 min</span>
                          <span className="text-blue-600">SLA: {SLA_MINUTES} min</span>
                          <span>{Math.max(cat.avgPrepMinutes, SLA_MINUTES * 1.5).toFixed(0)} min</span>
                        </div>
                        <div className="overflow-hidden h-2 text-xs flex rounded-full bg-gray-200">
                          <div
                            style={{ 
                              width: `${Math.min((cat.avgPrepMinutes / (SLA_MINUTES * 1.5)) * 100, 100)}%` 
                            }}
                            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${
                              isSlow ? 'bg-red-500' :
                              isWarning ? 'bg-orange-500' :
                              'bg-green-500'
                            }`}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Insights */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-green-800 mb-1">⚡ Categoria Mais Rápida</div>
                <div className="text-lg font-bold text-green-900">
                  {(() => {
                    const fastest = [...categoryPrepTime].sort((a, b) => a.avgPrepMinutes - b.avgPrepMinutes)[0];
                    return fastest?.category || '-';
                  })()}
                </div>
                <div className="text-xs text-green-700">
                  {(() => {
                    const fastest = [...categoryPrepTime].sort((a, b) => a.avgPrepMinutes - b.avgPrepMinutes)[0];
                    return fastest ? `${fastest.avgPrepMinutes.toFixed(1)} min` : '-';
                  })()}
                </div>
              </div>

              <div className="p-4 bg-red-50 rounded-lg">
                <div className="text-sm text-red-800 mb-1">🐌 Categoria Mais Lenta</div>
                <div className="text-lg font-bold text-red-900">
                  {(() => {
                    const slowest = [...categoryPrepTime].sort((a, b) => b.avgPrepMinutes - a.avgPrepMinutes)[0];
                    return slowest?.category || '-';
                  })()}
                </div>
                <div className="text-xs text-red-700">
                  {(() => {
                    const slowest = [...categoryPrepTime].sort((a, b) => b.avgPrepMinutes - a.avgPrepMinutes)[0];
                    return slowest ? `${slowest.avgPrepMinutes.toFixed(1)} min` : '-';
                  })()}
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-800 mb-1">📊 Variação</div>
                <div className="text-lg font-bold text-blue-900">
                  {(() => {
                    if (categoryPrepTime.length < 2) return '-';
                    const times = categoryPrepTime.map(c => c.avgPrepMinutes);
                    const min = Math.min(...times);
                    const max = Math.max(...times);
                    return `${((max - min) / min * 100).toFixed(0)}%`;
                  })()}
                </div>
                <div className="text-xs text-blue-700">entre categorias</div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-400">
            Sem dados de tempo de preparo por categoria
          </div>
        )}
      </div>

      {/* Percentual de Atraso por Item */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">⚠ Percentual de Atraso por Item</h3>
          <p className="text-sm text-gray-500 mt-1">
            Itens que frequentemente excedem o SLA de {SLA_MINUTES} minutos (mínimo 5 pedidos para análise)
          </p>
        </div>

        {itemDelayRate.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Pedidos</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Atrasados</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">% Atraso</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {itemDelayRate.map((item, idx) => {
                    const isCritical = item.delayPercentage > 50;
                    const isHigh = item.delayPercentage > 30 && !isCritical;
                    const isMedium = item.delayPercentage > 15 && !isHigh && !isCritical;
                    
                    return (
                      <tr 
                        key={idx}
                        className={
                          isCritical ? 'bg-red-50' :
                          isHigh ? 'bg-orange-50' :
                          'hover:bg-gray-50'
                        }
                      >
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.itemName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.itemCategory}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700">{item.totalOrders}</td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span className={`font-semibold ${
                            isCritical ? 'text-red-700' :
                            isHigh ? 'text-orange-700' :
                            'text-gray-700'
                          }`}>
                            {item.delayedOrders}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span className={`font-bold ${
                            isCritical ? 'text-red-700' :
                            isHigh ? 'text-orange-700' :
                            isMedium ? 'text-yellow-700' :
                            'text-gray-700'
                          }`}>
                            {item.delayPercentage.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isCritical ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              🚨 Crítico
                            </span>
                          ) : isHigh ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              ⚠ Alto
                            </span>
                          ) : isMedium ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              💡 Médio
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              ✓ Baixo
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {itemDelayRate.filter(i => i.delayPercentage > 30).length > 0 && (
              <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="text-sm text-orange-800">
                  <strong>⚠️ Atenção:</strong> {itemDelayRate.filter(i => i.delayPercentage > 30).length} item(ns) 
                  com taxa de atraso acima de 30%. Considere:
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>Revisar processo de preparo</li>
                    <li>Treinar equipe específica</li>
                    <li>Implementar pré-preparo</li>
                    <li>Ajustar tempo estimado comunicado ao cliente</li>
                  </ul>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-2">✅</div>
            <div className="font-medium">Excelente desempenho!</div>
            <div className="text-sm mt-1">Nenhum item com taxa de atraso significativa</div>
          </div>
        )}
      </div>
    </div>
  );
}
