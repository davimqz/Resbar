import formatCurrency from '../../lib/formatCurrency';

interface LowVolumeItem {
  itemId: string;
  itemName: string;
  itemCategory: string;
  itemPrice: number;
  totalQuantity: number;
  totalRevenue: number;
  ordersCount: number;
}

interface UnavailableItem {
  itemId: string;
  itemName: string;
  itemCategory: string;
  itemPrice: number;
  historicalVolume: number;
}

interface MenuPerformanceProps {
  lowVolumeItems: LowVolumeItem[];
  unavailableItems: UnavailableItem[];
}

export default function MenuPerformance({ lowVolumeItems, unavailableItems }: MenuPerformanceProps) {
  return (
    <div className="space-y-6">
      {/* Itens com Baixo Volume */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">❄ Itens com Baixo Volume</h3>
          <p className="text-sm text-gray-500 mt-1">
            Produtos com vendas abaixo da média — podem indicar falta de visibilidade, preço inadequado ou baixa atratividade
          </p>
        </div>

        {lowVolumeItems.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Preço</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Volume</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Receita</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lowVolumeItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.itemName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.itemCategory}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">
                        {formatCurrency(item.itemPrice)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <span className="font-semibold text-orange-600">{item.totalQuantity}</span>
                        <span className="text-xs text-gray-500 ml-1">vendas</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                        {formatCurrency(item.totalRevenue)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {item.totalQuantity === 0 ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Sem vendas
                          </span>
                        ) : item.totalQuantity < 3 ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Muito baixo
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Baixo
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-sm text-yellow-800">
                <strong>💡 Sugestões:</strong>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>Destacar esses itens em promoções ou combos</li>
                  <li>Revisar preço ou posicionamento no cardápio</li>
                  <li>Considerar substituição por itens mais atrativos</li>
                  <li>Avaliar qualidade ou apresentação do prato</li>
                </ul>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-2">✅</div>
            <div className="font-medium">Todos os itens com bom desempenho</div>
            <div className="text-sm mt-1">Nenhum item identificado com volume crítico</div>
          </div>
        )}
      </div>

      {/* Itens Indisponíveis */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">🚫 Itens Indisponíveis</h3>
          <p className="text-sm text-gray-500 mt-1">
            Produtos marcados como indisponíveis — impactam diretamente a experiência do cliente
          </p>
        </div>

        {unavailableItems.length > 0 ? (
          <>
            <div className="space-y-3">
              {unavailableItems.map((item, idx) => {
                const isHighDemand = item.historicalVolume > 10;
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-2 ${
                      isHighDemand
                        ? 'bg-red-50 border-red-300'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-gray-900">{item.itemName}</div>
                          {isHighDemand && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              ⚠️ Alta Demanda
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">{item.itemCategory}</div>
                        <div className="mt-2 flex items-center gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Preço:</span>
                            <span className="ml-1 font-semibold text-gray-900">
                              {formatCurrency(item.itemPrice)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Volume histórico (30d):</span>
                            <span
                              className={`ml-1 font-semibold ${
                                isHighDemand ? 'text-red-700' : 'text-gray-900'
                              }`}
                            >
                              {item.historicalVolume} vendas
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {isHighDemand && (
                      <div className="mt-3 pt-3 border-t border-red-200">
                        <div className="text-xs text-red-800">
                          🚨 <strong>URGENTE:</strong> Este item tinha alta procura. Priorize reabastecimento ou comunicação aos clientes.
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Resumo */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="text-sm text-red-600 mb-1">Total Indisponíveis</div>
                <div className="text-2xl font-bold text-red-700">{unavailableItems.length}</div>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="text-sm text-orange-600 mb-1">Alta Demanda</div>
                <div className="text-2xl font-bold text-orange-700">
                  {unavailableItems.filter(i => i.historicalVolume > 10).length}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Baixa Demanda</div>
                <div className="text-2xl font-bold text-gray-700">
                  {unavailableItems.filter(i => i.historicalVolume <= 10).length}
                </div>
              </div>
            </div>

            {unavailableItems.filter(i => i.historicalVolume > 10).length > 0 && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-sm text-red-800">
                  <strong>⚠️ Ação Necessária:</strong> Você tem{' '}
                  {unavailableItems.filter(i => i.historicalVolume > 10).length} item(ns) indisponível(is) 
                  com alta demanda histórica. Isso pode causar frustração nos clientes e perda de receita.
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-2">✅</div>
            <div className="text-green-700 font-medium">Todos os itens disponíveis!</div>
            <div className="text-sm text-gray-500 mt-1">
              Excelente — nenhum item está marcado como indisponível
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
