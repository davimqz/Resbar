import formatCurrency from '../../lib/formatCurrency';

interface MatrixItem {
  itemId: string;
  itemName: string;
  itemCategory: string;
  itemPrice: number;
  totalQuantity: number;
  totalRevenue: number;
  ordersCount: number;
  quadrant: 'star' | 'popular' | 'premium' | 'problematic';
}

interface StrategicMatrixData {
  star: MatrixItem[];
  popular: MatrixItem[];
  premium: MatrixItem[];
  problematic: MatrixItem[];
}

interface BottleneckItem {
  itemId: string;
  itemName: string;
  itemCategory: string;
  avgPrepMinutes: number;
  totalQuantity: number;
  ordersCount: number;
}

interface MenuStrategicMatrixProps {
  strategicMatrix: StrategicMatrixData;
  bottlenecks: BottleneckItem[];
}

export default function MenuStrategicMatrix({ strategicMatrix, bottlenecks }: MenuStrategicMatrixProps) {
  const getQuadrantConfig = (quadrant: string) => {
    switch (quadrant) {
      case 'star':
        return {
          title: '⭐ Itens Estrela',
          description: 'Alto volume + Alto preço',
          bg: 'bg-gradient-to-br from-yellow-50 to-amber-50',
          border: 'border-yellow-300',
          badge: 'bg-yellow-100 text-yellow-800',
          action: '💡 Destacar no cardápio e garantir disponibilidade'
        };
      case 'popular':
        return {
          title: '🔥 Itens Populares',
          description: 'Alto volume + Baixo preço',
          bg: 'bg-gradient-to-br from-blue-50 to-cyan-50',
          border: 'border-blue-300',
          badge: 'bg-blue-100 text-blue-800',
          action: '💡 Considerar aumento de preço ou criar combos'
        };
      case 'premium':
        return {
          title: '💎 Itens Premium',
          description: 'Baixo volume + Alto preço',
          bg: 'bg-gradient-to-br from-purple-50 to-pink-50',
          border: 'border-purple-300',
          badge: 'bg-purple-100 text-purple-800',
          action: '💡 Aumentar visibilidade ou manter como diferencial'
        };
      case 'problematic':
        return {
          title: '⚠️ Itens Problemáticos',
          description: 'Baixo volume + Baixo preço',
          bg: 'bg-gradient-to-br from-red-50 to-orange-50',
          border: 'border-red-300',
          badge: 'bg-red-100 text-red-800',
          action: '💡 Avaliar remoção, repricing ou reposicionamento'
        };
      default:
        return {
          title: 'Outros',
          description: '',
          bg: 'bg-gray-50',
          border: 'border-gray-300',
          badge: 'bg-gray-100 text-gray-800',
          action: ''
        };
    }
  };

  const renderQuadrant = (quadrant: 'star' | 'popular' | 'premium' | 'problematic', items: MatrixItem[]) => {
    const config = getQuadrantConfig(quadrant);
    
    return (
      <div className={`${config.bg} rounded-lg border-2 ${config.border} p-5`}>
        <div className="mb-3">
          <h4 className="font-semibold text-gray-900 mb-1">{config.title}</h4>
          <p className="text-xs text-gray-600">{config.description}</p>
        </div>

        {items.length > 0 ? (
          <>
            <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto">
              {items.slice(0, 10).map((item, idx) => (
                <div key={idx} className="bg-white bg-opacity-60 rounded p-3 text-sm">
                  <div className="font-medium text-gray-900">{item.itemName}</div>
                  <div className="text-xs text-gray-600 mt-1 flex items-center justify-between">
                    <span>{item.itemCategory}</span>
                    <span className={`${config.badge} px-2 py-0.5 rounded font-medium`}>
                      {item.totalQuantity} vendas
                    </span>
                  </div>
                  <div className="text-xs text-gray-700 mt-1 flex items-center justify-between">
                    <span>{formatCurrency(item.itemPrice)}/un</span>
                    <span className="font-semibold text-green-700">{formatCurrency(item.totalRevenue)}</span>
                  </div>
                </div>
              ))}
              {items.length > 10 && (
                <div className="text-xs text-gray-500 text-center py-2">
                  + {items.length - 10} itens adicionais
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-current border-opacity-20">
              <div className="text-xs text-gray-700 font-medium">{config.action}</div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm">Nenhum item neste quadrante</div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Matriz Volume x Preço */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">📈 Matriz Estratégica: Volume × Preço</h3>
          <p className="text-sm text-gray-500 mt-1">
            Classificação dos itens para decisões estratégicas de destaque, reposicionamento ou remoção
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderQuadrant('star', strategicMatrix.star)}
          {renderQuadrant('popular', strategicMatrix.popular)}
          {renderQuadrant('premium', strategicMatrix.premium)}
          {renderQuadrant('problematic', strategicMatrix.problematic)}
        </div>

        {/* Resumo da Matriz */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-yellow-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-700">{strategicMatrix.star.length}</div>
            <div className="text-xs text-yellow-600">Estrela</div>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-700">{strategicMatrix.popular.length}</div>
            <div className="text-xs text-blue-600">Popular</div>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-700">{strategicMatrix.premium.length}</div>
            <div className="text-xs text-purple-600">Premium</div>
          </div>
          <div className="p-3 bg-red-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-700">{strategicMatrix.problematic.length}</div>
            <div className="text-xs text-red-600">Problemático</div>
          </div>
        </div>
      </div>

      {/* Gargalos Estratégicos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">🔥 Gargalos Estratégicos</h3>
          <p className="text-sm text-gray-500 mt-1">
            Itens com alto volume de vendas + alto tempo de preparo que sobrecarregam a cozinha
          </p>
        </div>

        {bottlenecks.length > 0 ? (
          <>
            <div className="space-y-3">
              {bottlenecks.map((item, idx) => {
                const impact = item.totalQuantity * item.avgPrepMinutes;
                return (
                  <div
                    key={idx}
                    className="p-4 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center font-bold text-red-700">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900">{item.itemName}</div>
                        <div className="text-sm text-gray-600 mt-1">{item.itemCategory}</div>
                        <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-xs text-gray-500">Volume</div>
                            <div className="font-semibold text-orange-700">{item.totalQuantity} vendas</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Tempo Preparo</div>
                            <div className="font-semibold text-red-700">{item.avgPrepMinutes.toFixed(1)} min</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Impacto Total</div>
                            <div className="font-semibold text-red-800">{impact.toFixed(0)} min-vendas</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-orange-200">
                      <div className="text-xs text-orange-800">
                        💡 <strong>Ações sugeridas:</strong> Simplificar receita, implementar pré-preparo, ou aumentar preço para reduzir demanda
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {bottlenecks.length > 0 && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-sm text-red-800">
                  <strong>⚠️ Atenção:</strong> Estes {bottlenecks.length} itens representam gargalos estratégicos que impactam diretamente a 
                  capacidade operacional da cozinha. Priorize otimizações nesses itens para melhorar o fluxo geral.
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-2">✅</div>
            <div className="font-medium">Nenhum gargalo identificado</div>
            <div className="text-sm mt-1">Todos os itens estão com bom equilíbrio entre volume e tempo de preparo</div>
          </div>
        )}
      </div>
    </div>
  );
}
