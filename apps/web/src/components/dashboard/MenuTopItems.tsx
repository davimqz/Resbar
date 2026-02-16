import formatCurrency from '../../lib/formatCurrency';

interface MenuItem {
  itemId: string;
  itemName: string;
  itemCategory: string;
  itemPrice: number;
  totalQuantity: number;
  totalRevenue: number;
  ordersCount: number;
}

interface CategoryData {
  category: string;
  totalRevenue: number;
  totalQuantity: number;
  ordersCount: number;
  itemsCount: number;
  revenuePercentage: number;
}

interface MenuTopItemsProps {
  byVolume: MenuItem[];
  byRevenue: MenuItem[];
  categoryDistribution: CategoryData[];
}

export default function MenuTopItems({ byVolume, byRevenue, categoryDistribution }: MenuTopItemsProps) {
  return (
    <div className="space-y-6">
      {/* Top 5 por Volume */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold mb-4">🏆 Top 5 Itens Mais Vendidos (Volume)</h3>
        {byVolume.length > 0 ? (
          <div className="space-y-3">
            {byVolume.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-700">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900">{item.itemName}</div>
                  <div className="text-sm text-gray-500">{item.itemCategory}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">{item.totalQuantity}</div>
                  <div className="text-xs text-gray-500">{item.ordersCount} pedidos</div>
                </div>
                <div className="text-right min-w-[100px]">
                  <div className="text-sm font-semibold text-green-700">
                    {formatCurrency(item.totalRevenue)}
                  </div>
                  <div className="text-xs text-gray-500">{formatCurrency(item.itemPrice)}/un</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">Sem dados de vendas no período</div>
        )}
      </div>

      {/* Top 5 por Receita */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold mb-4">💰 Top 5 Itens por Receita</h3>
        {byRevenue.length > 0 ? (
          <div className="space-y-3">
            {byRevenue.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-white rounded-lg hover:from-green-100 transition-colors"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center font-bold text-green-700">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900">{item.itemName}</div>
                  <div className="text-sm text-gray-500">{item.itemCategory}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-700">
                    {formatCurrency(item.totalRevenue)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.totalQuantity} unidades • {item.ordersCount} pedidos
                  </div>
                </div>
                <div className="text-right min-w-[80px]">
                  <div className="text-sm font-semibold text-gray-700">
                    {formatCurrency(item.itemPrice)}
                  </div>
                  <div className="text-xs text-gray-500">preço</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">Sem dados de receita no período</div>
        )}
      </div>

      {/* Receita por Categoria */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold mb-4">📊 Receita por Categoria</h3>
        {categoryDistribution.length > 0 ? (
          <div className="space-y-4">
            {categoryDistribution.map((cat, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="font-semibold text-gray-900">{cat.category}</div>
                    <div className="text-xs text-gray-500">
                      {cat.itemsCount} {cat.itemsCount === 1 ? 'item' : 'itens'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">{formatCurrency(cat.totalRevenue)}</div>
                    <div className="text-xs text-gray-500">
                      {cat.totalQuantity} vendas • {cat.revenuePercentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
                {/* Barra de progresso */}
                <div className="relative pt-1">
                  <div className="overflow-hidden h-2 text-xs flex rounded-full bg-gray-200">
                    <div
                      style={{ width: `${cat.revenuePercentage}%` }}
                      className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${
                        idx === 0
                          ? 'bg-green-500'
                          : idx === 1
                          ? 'bg-blue-500'
                          : idx === 2
                          ? 'bg-purple-500'
                          : 'bg-gray-400'
                      }`}
                    ></div>
                  </div>
                </div>
              </div>
            ))}

            {/* Insights */}
            {categoryDistribution.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-800">
                  <strong>💡 Insight:</strong> A categoria{' '}
                  <strong>"{categoryDistribution[0].category}"</strong> lidera com{' '}
                  {categoryDistribution[0].revenuePercentage.toFixed(1)}% da receita total (
                  {formatCurrency(categoryDistribution[0].totalRevenue)}).
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">Sem dados de categorias</div>
        )}
      </div>
    </div>
  );
}
