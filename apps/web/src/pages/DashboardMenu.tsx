import useMetrics from '../hooks/useMetrics';
import BarChart from '../components/dashboard/BarChart';
import formatCurrency from '../lib/formatCurrency';
import { GiKnifeFork, GiTrophy } from 'react-icons/gi';
import { FiPackage } from 'react-icons/fi';
import { FaDollarSign, FaBullseye, FaMedal, FaLightbulb } from 'react-icons/fa';

export default function DashboardMenu() {
  const { useTopMenuItems } = useMetrics();
  const { data, isLoading } = useTopMenuItems({ limit: 20 });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
          <p className="text-gray-600">Carregando análise do cardápio...</p>
        </div>
      </div>
    );
  }

  // Calcular KPIs gerais
  const totalItems = Array.isArray(data) ? data.length : 0;
  const totalQuantity = Array.isArray(data) ? data.reduce((sum, i) => sum + Number(i.qty || 0), 0) : 0;
  const totalRevenue = Array.isArray(data) ? data.reduce((sum, i) => sum + Number(i.revenue || 0), 0) : 0;
  const avgPricePerItem = totalQuantity > 0 ? totalRevenue / totalQuantity : 0;
  
  // Top 3 performers
  const top3 = Array.isArray(data) ? data.slice(0, 3) : [];
  
  // Preparar dados para gráfico (top 10)
  const chartData = Array.isArray(data) 
    ? data.slice(0, 10).map((i: any) => ({
        name: i.name.length > 15 ? i.name.substring(0, 15) + '...' : i.name,
        quantidade: Number(i.qty || 0),
        receita: Number(i.revenue || 0)
      }))
    : [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Cardápio</h1>
        <p className="text-gray-500 mt-1">Performance dos itens e análise de vendas</p>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-500 text-sm font-medium">Itens no Ranking</h3>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <GiKnifeFork className="w-5 h-5 text-gray-700" />
            </div>
          </div>
          <p className="text-3xl font-bold text-purple-600">{totalItems}</p>
          <p className="text-sm text-gray-500 mt-2">Itens com vendas</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-500 text-sm font-medium">Unidades Vendidas</h3>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiPackage className="w-5 h-5 text-gray-700" />
            </div>
          </div>
          <p className="text-3xl font-bold text-blue-600">{totalQuantity}</p>
          <p className="text-sm text-gray-500 mt-2">Total do período</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-500 text-sm font-medium">Receita Total</h3>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FaDollarSign className="w-5 h-5 text-gray-700" />
            </div>
          </div>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
          <p className="text-sm text-gray-500 mt-2">Gerada pelo cardápio</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-500 text-sm font-medium">Ticket Médio/Item</h3>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <FaBullseye className="w-5 h-5 text-gray-700" />
            </div>
          </div>
          <p className="text-3xl font-bold text-orange-600">{formatCurrency(avgPricePerItem)}</p>
          <p className="text-sm text-gray-500 mt-2">Preço médio realizado</p>
        </div>
      </div>

      {/* Top 3 Destaques */}
      {top3.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4"><GiTrophy className="inline-block mr-2 w-5 h-5 text-yellow-500" />Top 3 Itens Mais Vendidos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {top3.map((item: any, idx: number) => (
              <div
                key={item.menu_item_id}
                className={`rounded-xl shadow-sm border p-6 hover:shadow-lg transition-all ${
                  idx === 0 ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200' :
                  idx === 1 ? 'bg-gradient-to-br from-gray-50 to-slate-100 border-gray-200' :
                  'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                    idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                    idx === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-500' :
                    'bg-gradient-to-br from-orange-400 to-amber-500'
                  }`}>
                    {idx + 1}
                  </div>
                  <span className="text-3xl">
                    {idx === 0 ? <FaMedal className="text-yellow-400" /> : idx === 1 ? <FaMedal className="text-slate-400" /> : <FaMedal className="text-orange-400" />}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">{item.name}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Quantidade:</span>
                    <span className="font-semibold text-blue-600">{item.qty} un</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Receita:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(Number(item.revenue || 0))}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Gráfico de Quantidade */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-4">Top 10 por Quantidade</h2>
            <BarChart 
              data={chartData} 
              dataKey="quantidade" 
              xKey="name" 
              title=""
              color="#3B82F6"
            />
          </div>
        )}

        {/* Gráfico de Receita */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-4">Top 10 por Receita ($)</h2>
            <BarChart 
              data={chartData} 
              dataKey="receita" 
              xKey="name" 
              title=""
              color="#10B981"
            />
          </div>
        )}
      </div>

      {/* Tabela Completa */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold mb-4">Ranking Completo dos Itens</h2>
        {Array.isArray(data) && data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Posição</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Item</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Quantidade</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Receita</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Ticket Médio</th>
                </tr>
              </thead>
              <tbody>
                {data.map((i: any, idx: number) => {
                  const ticketMedio = Number(i.qty) > 0 ? Number(i.revenue) / Number(i.qty) : 0;
                  return (
                    <tr key={i.menu_item_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                          idx < 3 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-gray-400'
                        }`}>
                          {idx + 1}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">{i.name}</td>
                      <td className="text-right py-3 px-4 text-blue-600 font-semibold">{i.qty}</td>
                      <td className="text-right py-3 px-4 text-green-600 font-semibold">
                        {formatCurrency(Number(i.revenue || 0))}
                      </td>
                      <td className="text-right py-3 px-4 text-gray-700">
                        {formatCurrency(ticketMedio)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">Nenhum dado de vendas</div>
        )}
      </div>

      {/* Link para Finance */}
      <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="text-sm text-purple-800">
          <strong><FaLightbulb className="inline-block mr-2 w-4 h-4 text-purple-600" />Dica:</strong> Para análise financeira detalhada por forma de pagamento e períodos, 
          acesse o <a href="/dashboard/finance" className="font-semibold underline hover:text-purple-900">Dashboard Financeiro</a>.
        </p>
      </div>
    </div>
  );
}
