import useMetrics from '../hooks/useMetrics';

export default function DashboardMenu() {
  const { useTopMenuItems } = useMetrics();
  const { data, isLoading } = useTopMenuItems({ limit: 10 });

  if (isLoading) return <div className="p-6">Carregando...</div>;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Cardápio</h2>
        <p className="text-gray-600 mt-2">Itens mais vendidos e receita gerada</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-700 mb-4">Top 10 itens mais vendidos</h3>
        {Array.isArray(data) && data.length > 0 ? (
          <div className="space-y-3">
            {data.map((i: any, idx: number) => (
              <div key={i.menu_item_id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                    idx < 3 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-gray-400'
                  }`}>
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{i.name}</div>
                    <div className="text-sm text-gray-500">
                      <span className="font-medium text-blue-600">{i.qty}</span> unidades vendidas
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    R$ {Number(i.revenue || 0).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">receita total</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">Nenhum dado de vendas</div>
        )}
      </div>
    </div>
  );
}
