import useMetrics from '../hooks/useMetrics';
import BarChart from '../components/dashboard/BarChart';
import { FaStopwatch, FaChartBar, FaClipboardList, FaFire, FaCheckCircle, FaLightbulb } from 'react-icons/fa';
import { AiOutlineWarning } from 'react-icons/ai';

export default function DashboardKitchen() {
  const { useKitchen } = useMetrics();
  const slaMinutes = 12;
  const { data, isLoading } = useKitchen({ slaMinutes });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
          <p className="text-gray-600">Carregando métricas da cozinha...</p>
        </div>
      </div>
    );
  }

  // Calcular taxa de SLA (estimativa simples: pedidos não atrasados / total)
  const totalOrders = data?.statusCounts?.reduce((sum: number, s: any) => sum + s.count, 0) || 0;
  const delayedCount = data?.delayed?.length || 0;
  const slaRate = totalOrders > 0 ? ((totalOrders - delayedCount) / totalOrders) * 100 : 100;

  // Normalize average prep minutes to a number and guard against invalid values
  const avgPrep = Number(data?.avgPrepMinutes ?? NaN);
  const hasAvgPrep = Number.isFinite(avgPrep);

  // Preparar dados para gráfico de status
  const statusChartData = data?.statusCounts?.map((s: any) => ({
    name: s.status === 'PENDING' ? 'Pendente' : 
          s.status === 'PREPARING' ? 'Preparando' : 
          s.status === 'READY' ? 'Pronto' : 
          s.status === 'DELIVERED' ? 'Entregue' : s.status,
    quantidade: s.count
  })) || [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Cozinha</h1>
        <p className="text-gray-500 mt-1">Performance, SLA e fluxo de preparo</p>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-500 text-sm font-medium">Tempo Médio de Preparo</h3>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              hasAvgPrep && avgPrep < slaMinutes ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <FaStopwatch className="w-5 h-5 text-gray-700" />
            </div>
          </div>
          <p className={`text-3xl font-bold ${hasAvgPrep && avgPrep < slaMinutes ? 'text-green-600' : 'text-red-600'}`}>
            {hasAvgPrep ? `${avgPrep.toFixed(1)} min` : '—'}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {hasAvgPrep && avgPrep < slaMinutes
              ? (<span className="inline-flex items-center gap-2"><FaCheckCircle className="text-green-500" />Dentro do SLA</span>)
              : (<span className="inline-flex items-center gap-2"><AiOutlineWarning className="text-yellow-600" />Acima do SLA</span>)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-500 text-sm font-medium">Taxa de Atendimento SLA</h3>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaChartBar className="w-5 h-5 text-gray-700" />
            </div>
          </div>
          <p className="text-3xl font-bold text-blue-600">
            {slaRate.toFixed(0)}%
          </p>
          <p className="text-sm text-gray-500 mt-2">Meta: {slaMinutes} min</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-500 text-sm font-medium">Pedidos Atrasados</h3>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              delayedCount > 0 ? 'bg-red-100' : 'bg-green-100'
            }`}>
              {delayedCount > 0 ? <AiOutlineWarning className="w-5 h-5 text-red-600" /> : <FaCheckCircle className="w-5 h-5 text-green-600" />}
            </div>
          </div>
          <p className={`text-3xl font-bold ${delayedCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {delayedCount}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {delayedCount > 0 ? 'Requer atenção' : 'Tudo no prazo'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-500 text-sm font-medium">Pedidos na Fila</h3>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <FaClipboardList className="w-5 h-5 text-gray-700" />
            </div>
          </div>
          <p className="text-3xl font-bold text-yellow-600">
            {data?.statusCounts?.find((s: any) => s.status === 'PENDING')?.count || 0}
          </p>
          <p className="text-sm text-gray-500 mt-2">Aguardando preparo</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-500 text-sm font-medium">Em Preparo Agora</h3>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <FaFire className="w-5 h-5 text-gray-700" />
            </div>
          </div>
          <p className="text-3xl font-bold text-orange-600">
            {data?.statusCounts?.find((s: any) => s.status === 'PREPARING')?.count || 0}
          </p>
          <p className="text-sm text-gray-500 mt-2">Cozinha ativa</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-500 text-sm font-medium">Prontos Aguardando</h3>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">✓</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-blue-600">
            {data?.statusCounts?.find((s: any) => s.status === 'READY')?.count || 0}
          </p>
          <p className="text-sm text-gray-500 mt-2">Aguardando entrega</p>
        </div>
      </div>

      {/* Gráficos e Detalhes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Gráfico de Status */}
        {statusChartData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-4">Distribuição de Pedidos por Etapa</h2>
            <BarChart 
              data={statusChartData} 
              dataKey="quantidade" 
              xKey="name" 
              title=""
              color="#F59E0B"
            />
          </div>
        )}

        {/* Lista de pedidos atrasados */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4">Pedidos Atrasados (SLA: {slaMinutes} min)</h2>
          {data?.delayed && data.delayed.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data.delayed.map((d: any) => (
                <div key={d.id} className="p-4 border-l-4 border-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900">Pedido #{d.id.substring(0, 8)}</div>
                      <div className="text-sm text-gray-600 mt-1">Comanda: {d.tabId.substring(0, 8)}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Iniciado: {d.startedPreparingAt ? new Date(d.startedPreparingAt).toLocaleTimeString('pt-BR') : '-'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-600">{Math.round(d.secondsSinceStart / 60)} min</div>
                      <div className="text-xs text-gray-500">desde início</div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      d.status === 'PREPARING' ? 'bg-orange-200 text-orange-800' : 'bg-yellow-200 text-yellow-800'
                    }`}>
                      {d.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-6xl mb-4"><FaCheckCircle className="text-green-600" /></div>
              <div className="text-lg font-semibold text-green-600">Nenhum atraso!</div>
              <div className="text-sm text-gray-500 mt-2">Todos os pedidos estão dentro do SLA</div>
            </div>
          )}
        </div>
      </div>

      {/* Dica */}
      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <p className="text-sm text-orange-800">
          <strong><FaLightbulb className="inline-block mr-2 w-4 h-4 text-orange-600" />Dica:</strong> O SLA atual é de {slaMinutes} minutos. Pedidos que ultrapassam esse tempo aparecem como atrasados. 
          Mantenha o tempo médio abaixo de {slaMinutes} min para garantir alta qualidade de serviço.
        </p>
      </div>
    </div>
  );
}
