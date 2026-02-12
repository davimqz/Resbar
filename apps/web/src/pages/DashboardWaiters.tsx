import useMetrics from '../hooks/useMetrics';
import { useDashboard } from '../hooks/useDashboard';
import BarChart from '../components/dashboard/BarChart';
import formatCurrency from '../lib/formatCurrency';
import { FaUserTie, FaDollarSign, FaChartBar, FaClipboardList, FaLightbulb } from 'react-icons/fa';

export default function DashboardWaiters() {
  const { useWaitersRanking } = useMetrics();
  const { useStats } = useDashboard();
  const { data: rankingData, isLoading: rankingLoading } = useWaitersRanking();
  const { data: statsData, isLoading: statsLoading } = useStats();
  const data = rankingData;
  const isLoading = rankingLoading || statsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
          <p className="text-gray-600">Carregando ranking dos garçons...</p>
        </div>
      </div>
    );
  }

  // Calcular KPIs gerais
  // totalWaiters (for KPIs) — prefer activeWaiters count if available, otherwise fall back to ranking length
  const totalWaiters = Array.isArray(statsData?.activeWaiters) ? statsData.activeWaiters.length : (Array.isArray(data) ? data.length : 0);
  const totalRevenue = Array.isArray(data) ? data.reduce((sum, w) => sum + Number(w.revenue || 0), 0) : 0;
  const totalTables = Array.isArray(data) ? data.reduce((sum, w) => sum + Number(w.tables_served || 0), 0) : 0;
  const avgRevenuePerWaiter = totalWaiters > 0 ? totalRevenue / totalWaiters : 0;
  const avgTablesPerWaiter = totalWaiters > 0 ? totalTables / totalWaiters : 0;

  // Preparar dados para gráfico
  const chartData = Array.isArray(data) 
    ? data.slice(0, 10).map((w: any) => ({
        name: w.waiter_name,
        receita: Number(w.revenue || 0)
      }))
    : [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Garçons</h1>
        <p className="text-gray-500 mt-1">Ranking e desempenho da equipe de atendimento</p>
      </div>

      {/* KPIs Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-500 text-sm font-medium">Garçons Ativos</h3>
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <FaUserTie className="w-5 h-5 text-gray-700" />
            </div>
          </div>
          <p className="text-3xl font-bold text-indigo-600">{totalWaiters}</p>
          <p className="text-sm text-gray-500 mt-2">Equipe do período</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-500 text-sm font-medium">Receita Total</h3>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FaDollarSign className="w-5 h-5 text-gray-700" />
            </div>
          </div>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
          <p className="text-sm text-gray-500 mt-2">Gerada pela equipe</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-500 text-sm font-medium">Ticket Médio/Garçom</h3>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaChartBar className="w-5 h-5 text-gray-700" />
            </div>
          </div>
          <p className="text-3xl font-bold text-blue-600">{formatCurrency(avgRevenuePerWaiter)}</p>
          <p className="text-sm text-gray-500 mt-2">Por profissional</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-500 text-sm font-medium">Comandas/Garçom</h3>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <FaClipboardList className="w-5 h-5 text-gray-700" />
            </div>
          </div>
          <p className="text-3xl font-bold text-purple-600">{avgTablesPerWaiter.toFixed(1)}</p>
          <p className="text-sm text-gray-500 mt-2">Média de atendimento</p>
        </div>
      </div>

      {/* Gráfico e Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Receita Top 10 */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-4">Top 10 por Receita</h2>
            <BarChart 
              data={chartData} 
              dataKey="receita" 
              xKey="name" 
              title=""
              color="#4F46E5"
            />
          </div>
        )}

        {/* Tabela de Ranking */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4">Ranking Completo</h2>
          {Array.isArray(data) && data.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Posição</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Nome</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Comandas</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Receita</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((w: any, idx: number) => (
                    <tr key={w.waiter_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                          idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-500' : 'bg-blue-500'
                        }`}>
                          {idx + 1}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">{w.waiter_name}</td>
                      <td className="text-right py-3 px-4 text-gray-700">{w.tables_served}</td>
                      <td className="text-right py-3 px-4 font-semibold text-green-600">
                      {formatCurrency(Number(w.revenue || 0))}
                    </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">Nenhum dado disponível</div>
          )}
        </div>
      </div>

      {/* Dica */}
      <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
        <p className="text-sm text-indigo-800">
          <strong><FaLightbulb className="inline-block mr-2 w-4 h-4 text-indigo-700" />Análise:</strong> Compare o desempenho individual com as médias da equipe. 
          Garçons com ticket médio acima de {formatCurrency(avgRevenuePerWaiter)} estão performando acima da média.
        </p>
      </div>
    </div>
  );
}
