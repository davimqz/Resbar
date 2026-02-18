interface MenuItem {
  itemId: string;
  itemName: string;
  itemCategory?: string;
  avgPrepMinutes: number;
  ordersCount?: number;
  totalQuantity: number;
}

import { MENU_CATEGORY_LABELS } from '@resbar/shared';

interface KitchenItemsAnalysisProps {
  byPrepTime: MenuItem[];
  topSelling: MenuItem[];
  critical: MenuItem[];
}

export default function KitchenItemsAnalysis({ byPrepTime, topSelling, critical }: KitchenItemsAnalysisProps) {
  const avgPrepTime = byPrepTime.length > 0 
    ? byPrepTime.reduce((sum, item) => sum + item.avgPrepMinutes, 0) / byPrepTime.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Itens Críticos (Alto Tempo + Alto Volume) */}
      {critical.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-4">
            🚨 Itens Críticos (Alta Pressão na Cozinha)
          </h3>
          <p className="text-sm text-red-700 mb-4">
            Estes itens têm <strong>alto tempo de preparo</strong> e <strong>alto volume</strong> — são os principais gargalos.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {critical.slice(0, 6).map((item, idx) => (
              <div key={idx} className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-sm">{item.itemName}</h4>
                    {item.itemCategory && (
                      <p className="text-xs text-gray-500">{(MENU_CATEGORY_LABELS as any)[item.itemCategory] || item.itemCategory}</p>
                    )}
                  </div>
                  <span className="text-2xl">⚠️</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tempo:</span>
                    <span className="font-semibold text-red-600">
                      {item.avgPrepMinutes.toFixed(1)} min
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Volume:</span>
                    <span className="font-semibold text-gray-900">
                      {item.totalQuantity} unid.
                    </span>
                  </div>
                  <div className="text-xs text-red-600 mt-2">
                    {((item.avgPrepMinutes / avgPrepTime - 1) * 100).toFixed(0)}% acima da média
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Duas Colunas: Por Tempo e Por Volume */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Itens com Maior Tempo de Preparo */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-4">⏱ Maior Tempo de Preparo</h3>
          <p className="text-sm text-gray-600 mb-4">
            Itens que demoram mais para serem preparados (potenciais gargalos)
          </p>
          <div className="space-y-3">
            {byPrepTime.slice(0, 10).map((item, idx) => {
              const isAboveAverage = item.avgPrepMinutes > avgPrepTime * 1.2;
              
              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isAboveAverage ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-lg font-bold text-gray-400 w-6">#{idx + 1}</span>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-gray-900">{item.itemName}</h4>
                      {item.itemCategory && (
                        <p className="text-xs text-gray-500">{(MENU_CATEGORY_LABELS as any)[item.itemCategory] || item.itemCategory}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      isAboveAverage ? 'text-orange-600' : 'text-gray-900'
                    }`}>
                      {item.avgPrepMinutes.toFixed(1)} min
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.totalQuantity} vendidos
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Itens Mais Vendidos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-4">🔥 Mais Vendidos (Pressão)</h3>
          <p className="text-sm text-gray-600 mb-4">
            Itens com maior volume — pressionam mais a cozinha
          </p>
          <div className="space-y-3">
            {topSelling.slice(0, 10).map((item, idx) => {
              const isSlowItem = item.avgPrepMinutes > avgPrepTime * 1.2;
              
              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isSlowItem ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-lg font-bold text-gray-400 w-6">#{idx + 1}</span>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-gray-900">{item.itemName}</h4>
                      {item.itemCategory && (
                        <p className="text-xs text-gray-500">{(MENU_CATEGORY_LABELS as any)[item.itemCategory] || item.itemCategory}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {item.totalQuantity} unid.
                    </div>
                    <div className={`text-xs ${
                      isSlowItem ? 'text-red-600 font-semibold' : 'text-gray-500'
                    }`}>
                      {item.avgPrepMinutes.toFixed(1)} min prep
                      {isSlowItem && ' ⚠'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
