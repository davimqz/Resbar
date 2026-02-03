import { useDashboard } from '../hooks/useDashboard';
import { ORDER_STATUS_LABELS } from '@resbar/shared';

export function DashboardPage() {
  const { useStats } = useDashboard();
  const { data: stats, isLoading, error } = useStats();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
          <div className="text-center py-12">Carregando...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
          <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
            Erro ao carregar dashboard. Tente novamente.
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Visão Geral</h1>
        <p className="text-gray-500 mt-1">Acompanhe as principais métricas do seu negócio</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Receita do Dia */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-500 text-sm font-medium">Receita do Dia</h3>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">💰</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            R$ {stats.dailyRevenue.toFixed(2)}
          </p>
          <p className="text-sm text-green-600 mt-2">↑ Hoje</p>
        </div>

        {/* Mesas Ocupadas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-500 text-sm font-medium">Mesas Ocupadas</h3>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">🪑</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {stats.tablesOccupied}
          </p>
          <p className="text-sm text-blue-600 mt-2">Agora</p>
        </div>

        {/* Total de Pedidos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-500 text-sm font-medium">Pedidos Ativos</h3>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">📋</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {stats.ordersCount.pending + stats.ordersCount.preparing + stats.ordersCount.ready}
          </p>
          <p className="text-sm text-purple-600 mt-2">Em andamento</p>
        </div>

        {/* Pedidos Entregues */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-500 text-sm font-medium">Pedidos Entregues</h3>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">✅</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {stats.ordersCount.delivered}
          </p>
          <p className="text-sm text-gray-600 mt-2">Hoje</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status dos Pedidos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Status dos Pedidos</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
                <span className="font-medium">{ORDER_STATUS_LABELS.PENDING}</span>
                <span className="text-xl font-bold text-yellow-600">{stats.ordersCount.pending}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded">
                <span className="font-medium">{ORDER_STATUS_LABELS.PREPARING}</span>
                <span className="text-xl font-bold text-orange-600">{stats.ordersCount.preparing}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                <span className="font-medium">{ORDER_STATUS_LABELS.READY}</span>
                <span className="text-xl font-bold text-blue-600">{stats.ordersCount.ready}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                <span className="font-medium">{ORDER_STATUS_LABELS.DELIVERED}</span>
                <span className="text-xl font-bold text-green-600">{stats.ordersCount.delivered}</span>
              </div>
            </div>
          </div>

        {/* Itens Mais Vendidos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Itens Mais Vendidos Hoje</h2>
            {stats.popularItems.length > 0 ? (
              <div className="space-y-3">
                {stats.popularItems.map((item, index) => (
                  <div key={item.itemId} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                      <div>
                        <p className="font-medium">{item.itemName}</p>
                        <p className="text-sm text-gray-500">{item.totalSold} vendidos</p>
                      </div>
                    </div>
                    <span className="font-bold text-green-600">
                      R$ {item.revenue.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Nenhuma venda hoje</p>
            )}
          </div>

        {/* Performance dos Garçons */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Performance dos Garçons Hoje</h2>
            {stats.waiterPerformance.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Garçom</th>
                      <th className="text-right py-3 px-4">Comandas Atendidas</th>
                      <th className="text-right py-3 px-4">Receita Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.waiterPerformance.map((waiter) => (
                      <tr key={waiter.waiterId} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{waiter.waiterName}</td>
                        <td className="py-3 px-4 text-right">{waiter.tablesServed}</td>
                        <td className="py-3 px-4 text-right font-bold text-green-600">
                          R$ {waiter.totalRevenue.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Nenhum atendimento registrado hoje</p>
            )}
          </div>
      </div>
    </div>
  );
}
