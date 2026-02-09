import { useState } from 'react';
import useMetrics from '../hooks/useMetrics';
import useOperational from '../hooks/useOperational';
import { useDashboard } from '../hooks/useDashboard';
import PieChart from '../components/dashboard/PieChart';
import BarChart from '../components/dashboard/BarChart';
import { FaHourglassHalf, FaFire, FaCheckCircle, FaStopwatch, FaClipboardList, FaSyncAlt, FaChair } from 'react-icons/fa';
import { AiOutlineWarning } from 'react-icons/ai';

export default function DashboardOperations() {
  const [period, setPeriod] = useState<'today' | '7days'>('today');
  
  const { useOverview } = useMetrics();
  const { useOperationalMetrics } = useOperational();
  const { useStats } = useDashboard();
  
  const overviewQ = useOverview();
  const operationalQ = useOperationalMetrics();
  const statsQ = useStats();

  const loading = overviewQ.isLoading || operationalQ.isLoading || statsQ.isLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
          <p className="text-gray-600">Carregando métricas operacionais...</p>
        </div>
      </div>
    );
  }

  const data = overviewQ.data;
  const opMetrics = operationalQ.data;
  const stats = statsQ.data;

  // Preparar dados para gráfico de status de pedidos
  const orderStatusData = stats ? [
    { category: 'Pendente', value: stats.ordersCount.pending },
    { category: 'Preparando', value: stats.ordersCount.preparing },
    { category: 'Pronto', value: stats.ordersCount.ready },
    { category: 'Entregue', value: stats.ordersCount.delivered },
  ].filter(d => d.value > 0) : [];

  // Preparar dados para gráfico de receita por tipo
  const revenueByTypeData = opMetrics?.revenueByType?.map(r => ({
    name: r.type === 'TABLE' ? 'Mesa' : 'Balcão',
    receita: r.revenue,
    quantidade: r.count
  })) || [];

  // Preparar dados para ocupação por hora
  const occupancyByHourData = opMetrics?.occupancyByHour?.map(o => ({
    name: `${o.hour}h`,
    ocupacao: Math.round(o.occupancyRate),
    mesas: o.tablesUsed
  })) || [];

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Operação</h1>
          <p className="text-gray-500 mt-1">Métricas operacionais e eficiência</p>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setPeriod('today')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === 'today' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Hoje
          </button>
          <button 
            onClick={() => setPeriod('7days')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === '7days' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            7 Dias
          </button>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-500 text-sm font-medium">Pedidos Pendentes</h3>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <FaHourglassHalf className="w-5 h-5 text-gray-700" />
            </div>
          </div>
          <p className={`text-3xl font-bold ${stats && stats.ordersCount.pending > 10 ? 'text-red-600' : 'text-yellow-600'}`}>
            {stats?.ordersCount.pending || 0}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {stats && stats.ordersCount.pending > 10 ? (<span className="inline-flex items-center gap-2"><AiOutlineWarning className="text-yellow-600" />Volume alto</span>) : 'Normal'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-500 text-sm font-medium">Em Preparo</h3>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <FaFire className="w-5 h-5 text-gray-700" />
            </div>
          </div>
          <p className="text-3xl font-bold text-orange-600">
            {stats?.ordersCount.preparing || 0}
          </p>
          <p className="text-sm text-gray-500 mt-2">Cozinha ativa</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-500 text-sm font-medium">Prontos</h3>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaCheckCircle className="w-5 h-5 text-gray-700" />
            </div>
          </div>
          <p className={`text-3xl font-bold ${stats && stats.ordersCount.ready > 5 ? 'text-red-600' : 'text-blue-600'}`}>
            {stats?.ordersCount.ready || 0}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {stats && stats.ordersCount.ready > 5 ? (<span className="inline-flex items-center gap-2"><AiOutlineWarning className="text-yellow-600" />Aguardando entrega</span>) : 'Aguardando'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-500 text-sm font-medium">Tempo Médio Atendimento</h3>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <FaStopwatch className="w-5 h-5 text-gray-700" />
            </div>
          </div>
          <p className="text-3xl font-bold text-purple-600">
            {opMetrics?.avgServiceTime ? `${Math.round(opMetrics.avgServiceTime)} min` : '—'}
          </p>
          <p className="text-sm text-gray-500 mt-2">Sentou → Pagou</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-500 text-sm font-medium">Tempo Pedido → Pagamento</h3>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FaClipboardList className="w-5 h-5 text-gray-700" />
            </div>
          </div>
          <p className="text-3xl font-bold text-green-600">
            {opMetrics?.avgOrderToPayment ? `${Math.round(opMetrics.avgOrderToPayment)} min` : '—'}
          </p>
          <p className="text-sm text-gray-500 mt-2">Da ordem ao fim</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-500 text-sm font-medium">Rotatividade de Mesas</h3>
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <FaSyncAlt className="w-5 h-5 text-gray-700" />
            </div>
          </div>
          <p className="text-3xl font-bold text-indigo-600">
            {opMetrics?.tableTurnoverRate ? opMetrics.tableTurnoverRate.toFixed(1) : '—'}
          </p>
          <p className="text-sm text-gray-500 mt-2">comandas/mesa</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-500 text-sm font-medium">Mesas Ocupadas</h3>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaChair className="w-5 h-5 text-gray-700" />
            </div>
          </div>
          <p className="text-3xl font-bold text-blue-600">
            {data?.tablesOccupied || 0}
          </p>
          <p className="text-sm text-gray-500 mt-2">Ocupação atual</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-500 text-sm font-medium">Comandas Abertas</h3>
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
              <FaClipboardList className="w-5 h-5 text-gray-700" />
            </div>
          </div>
          <p className="text-3xl font-bold text-teal-600">
            {data?.openTabs || 0}
          </p>
          <p className="text-sm text-gray-500 mt-2">Em atendimento</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status dos Pedidos */}
        {orderStatusData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-4">Distribuição de Pedidos por Status</h2>
            <PieChart 
              data={orderStatusData} 
              dataKey="value" 
              nameKey="category" 
              title=""
            />
          </div>
        )}

        {/* Receita por Tipo */}
        {revenueByTypeData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-4">Receita: Mesa vs Balcão</h2>
            <BarChart 
              data={revenueByTypeData} 
              dataKey="receita" 
              xKey="name" 
              title=""
              color="#10B981"
            />
          </div>
        )}

        {/* Ocupação por Hora */}
        {occupancyByHourData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Taxa de Ocupação por Hora (%)</h2>
            <BarChart 
              data={occupancyByHourData} 
              dataKey="ocupacao" 
              xKey="name" 
              title=""
              color="#3B82F6"
            />
          </div>
        )}
      </div>

      {/* Link para outros dashboards */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Dica:</strong> Para análise de performance da cozinha,  veja o{' '}
          <a href="/dashboard/kitchen" className="underline hover:text-blue-600">Dashboard de Cozinha</a>.
          Para ver detalhes de garçons, acesse{' '}
          <a href="/dashboard/waiters" className="underline hover:text-blue-600">Dashboard de Garçons</a>.
        </p>
      </div>
    </div>
  );
}

