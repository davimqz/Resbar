import { useMemo, useState } from 'react';
import TimeSeriesChart from '../components/dashboard/TimeSeriesChart';
import useOverviewHook from '../hooks/useOverview';
import { useDashboard } from '../hooks/useDashboard';
import { FaDollarSign, FaUtensils, FaUserTie, FaCog, FaFire, FaClock, FaCheckCircle } from 'react-icons/fa';
import formatCurrency from '../lib/formatCurrency';

function toISO(d: Date) {
  return d.toISOString();
}

export default function DashboardOverview() {
  const { useOverviewData, useOverviewWaiters, useOverviewFinance, useOverviewOperations, useOverviewKitchen, useOverviewMenu, useRevenue } = useOverviewHook();
  const { useStats } = useDashboard();

  const [preset, setPreset] = useState<'today' | '7d' | '30d' | 'custom'>('today');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  const { start, end } = useMemo(() => {
    const now = new Date();
    const startToday = new Date(now); startToday.setHours(0,0,0,0);
    const start7 = new Date(now); start7.setDate(start7.getDate() - 6); start7.setHours(0,0,0,0);
    const start30 = new Date(now); start30.setDate(start30.getDate() - 29); start30.setHours(0,0,0,0);
    
    if (preset === 'today') return { start: toISO(startToday), end: toISO(now) };
    if (preset === '7d') return { start: toISO(start7), end: toISO(now) };
    if (preset === '30d') return { start: toISO(start30), end: toISO(now) };
    // custom
    return { start: customStart || toISO(startToday), end: customEnd || toISO(now) };
  }, [preset, customStart, customEnd]);

  const overviewQ = useOverviewData({ start, end });
  const financeQ = useOverviewFinance({ start, end });
  const waitersQ = useOverviewWaiters({ start, end });
  const operationsQ = useOverviewOperations({ start, end });
  const kitchenQ = useOverviewKitchen({ start, end });
  const menuQ = useOverviewMenu({ start, end });
  const revenueQ = useRevenue({ start, end, groupBy: 'day' });
  const statsQ = useStats();

  // If any query errored, surface the error to the user
  if (overviewQ.isError || revenueQ.isError || statsQ.isError || waitersQ.isError || financeQ.isError || operationsQ.isError || kitchenQ.isError || menuQ.isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-red-800 mb-2">Erro ao carregar Visão Geral</h2>
        {financeQ.isError && <div className="text-red-600 mb-1">Finanças: {(financeQ.error as any)?.message ?? String(financeQ.error)}</div>}
        {overviewQ.isError && <div className="text-red-600 mb-1">Overview: {(overviewQ.error as any)?.message ?? String(overviewQ.error)}</div>}
        {waitersQ.isError && <div className="text-red-600 mb-1">Garçons: {(waitersQ.error as any)?.message ?? String(waitersQ.error)}</div>}
        {operationsQ.isError && <div className="text-red-600 mb-1">Operacional: {(operationsQ.error as any)?.message ?? String(operationsQ.error)}</div>}
        {kitchenQ.isError && <div className="text-red-600 mb-1">Cozinha: {(kitchenQ.error as any)?.message ?? String(kitchenQ.error)}</div>}
        {menuQ.isError && <div className="text-red-600 mb-1">Cardápio: {(menuQ.error as any)?.message ?? String(menuQ.error)}</div>}
        {revenueQ.isError && <div className="text-red-600 mb-1">Receita: {(revenueQ.error as any)?.message ?? String(revenueQ.error)}</div>}
        {statsQ.isError && <div className="text-red-600 mb-1">Stats: {(statsQ.error as any)?.message ?? String(statsQ.error)}</div>}
        <div className="mt-3 text-sm text-red-700">Verifique a API ou suas permissões de administrador.</div>
      </div>
    );
  }

  const loading = overviewQ.isLoading || revenueQ.isLoading || statsQ.isLoading || waitersQ.isLoading || financeQ.isLoading || operationsQ.isLoading || kitchenQ.isLoading || menuQ.isLoading;

  return (
    <div className="p-4 space-y-6">
      {/* Header com filtros */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Visão Geral Executiva</h1>
          <p className="text-sm text-gray-500 mt-1">Principais métricas consolidadas de todas as áreas</p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setPreset('today')} className={`px-3 py-1 rounded ${preset==='today'? 'bg-slate-800 text-white':'bg-white border'}`}>Hoje</button>
          <button onClick={() => setPreset('7d')} className={`px-3 py-1 rounded ${preset==='7d'? 'bg-slate-800 text-white':'bg-white border'}`}>7 dias</button>
          <button onClick={() => setPreset('30d')} className={`px-3 py-1 rounded ${preset==='30d'? 'bg-slate-800 text-white':'bg-white border'}`}>30 dias</button>
          <button onClick={() => setPreset('custom')} className={`px-3 py-1 rounded ${preset==='custom'? 'bg-slate-800 text-white':'bg-white border'}`}>Custom</button>
        </div>
      </div>

      {preset === 'custom' && (
        <div className="flex gap-2 mb-4">
          <input type="datetime-local" value={customStart} onChange={e => setCustomStart(e.target.value)} className="border p-2 rounded" />
          <input type="datetime-local" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="border p-2 rounded" />
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Carregando dados...</p>
        </div>
      ) : (
        <>
          {/* KPIs Consolidados de Todas as Áreas */}
          <div>
            <h2 className="text-xl font-semibold mb-4">📊 KPIs Principais</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Financeiro - Receita Total */}
              {financeQ.data && (
                <div className="bg-gradient-to-br from-green-50 to-white rounded-lg shadow-sm border border-green-200 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-green-700">💰 Receita Total</div>
                    <FaDollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-900">
                    {formatCurrency(financeQ.data.kpis.totalRevenue)}
                  </div>
                  <div className="text-xs text-green-600 mt-1">Período selecionado</div>
                </div>
              )}

              {/* Financeiro - Ticket Médio */}
              {financeQ.data && (
                <div className="bg-gradient-to-br from-green-50 to-white rounded-lg shadow-sm border border-green-200 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-green-700">🎟 Ticket Médio</div>
                    <FaDollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-900">
                    {formatCurrency(financeQ.data.kpis.avgTicket)}
                  </div>
                  <div className="text-xs text-green-600 mt-1">Por comanda paga</div>
                </div>
              )}

              {/* Waiters - Total de Garçons */}
              {waitersQ.data && (
                <div className="bg-gradient-to-br from-indigo-50 to-white rounded-lg shadow-sm border border-indigo-200 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-indigo-700">👔 Receita (Garçons)</div>
                    <FaUserTie className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="text-2xl font-bold text-indigo-900">
                    {formatCurrency(waitersQ.data.kpis.totalRevenue)}
                  </div>
                  <div className="text-xs text-indigo-600 mt-1">{waitersQ.data.kpis.closedTabs} comandas fechadas</div>
                </div>
              )}

              {/* Operations - Tempo Médio Entrega */}
              {operationsQ.data && (
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-sm border border-blue-200 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-blue-700">⚙️ Tempo Entrega</div>
                    <FaClock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-blue-900">
                    {operationsQ.data.kpis.avgDeliveryTime > 0 ? 
                      `${operationsQ.data.kpis.avgDeliveryTime.toFixed(1)} min` : 
                      '-'}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">Média cozinha → cliente</div>
                </div>
              )}

              {/* Operations - Throughput */}
              {operationsQ.data && (
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-sm border border-blue-200 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-blue-700">⚡ Throughput</div>
                    <FaCog className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-blue-900">
                    {operationsQ.data.kpis.throughputPerHour.toFixed(1)}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">Comandas/hora</div>
                </div>
              )}

              {/* Kitchen - Tempo Preparo */}
              {kitchenQ.data && (
                <div className={`bg-gradient-to-br from-orange-50 to-white rounded-lg shadow-sm border ${
                  kitchenQ.data.kpis.avgPrepTime <= kitchenQ.data.kpis.slaMinutes 
                    ? 'border-green-200' 
                    : 'border-orange-200'
                } p-5`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`text-sm font-medium ${
                      kitchenQ.data.kpis.avgPrepTime <= kitchenQ.data.kpis.slaMinutes 
                        ? 'text-green-700' 
                        : 'text-orange-700'
                    }`}>🔥 Tempo Preparo</div>
                    <FaFire className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className={`text-2xl font-bold ${
                    kitchenQ.data.kpis.avgPrepTime <= kitchenQ.data.kpis.slaMinutes 
                      ? 'text-green-900' 
                      : 'text-orange-900'
                  }`}>
                    {kitchenQ.data.kpis.avgPrepTime.toFixed(1)} min
                  </div>
                  <div className={`text-xs mt-1 flex items-center gap-1 ${
                    kitchenQ.data.kpis.avgPrepTime <= kitchenQ.data.kpis.slaMinutes 
                      ? 'text-green-600' 
                      : 'text-orange-600'
                  }`}>
                    {kitchenQ.data.kpis.avgPrepTime <= kitchenQ.data.kpis.slaMinutes ? (
                      <><FaCheckCircle className="w-3 h-3" /> Dentro do SLA</>
                    ) : (
                      <>⚠ SLA: {kitchenQ.data.kpis.slaMinutes} min</>
                    )}
                  </div>
                </div>
              )}

              {/* Kitchen - Taxa Atraso */}
              {kitchenQ.data && (
                <div className="bg-gradient-to-br from-orange-50 to-white rounded-lg shadow-sm border border-orange-200 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-orange-700">📊 Taxa Atraso</div>
                    <FaFire className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className={`text-2xl font-bold ${
                    kitchenQ.data.kpis.delayedPercentage > 25 
                      ? 'text-red-900' 
                      : 'text-orange-900'
                  }`}>
                    {kitchenQ.data.kpis.delayedPercentage.toFixed(1)}%
                  </div>
                  <div className="text-xs text-orange-600 mt-1">
                    {kitchenQ.data.kpis.delayedCount} pedidos atrasados
                  </div>
                </div>
              )}

              {/* Menu - Total Items */}
              {menuQ.data && (
                <div className="bg-gradient-to-br from-purple-50 to-white rounded-lg shadow-sm border border-purple-200 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-purple-700">🍽 Receita Cardápio</div>
                    <FaUtensils className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-purple-900">
                    {formatCurrency(menuQ.data.kpis.totalRevenue)}
                  </div>
                  <div className="text-xs text-purple-600 mt-1">
                    {menuQ.data.kpis.totalItems} itens ativos
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Evolução da Receita */}
          <div>
            <h2 className="text-xl font-semibold mb-4">📈 Evolução da Receita</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <TimeSeriesChart 
                data={overviewQ.data?.revenueSeries ?? revenueQ.data ?? []} 
                dataKey="revenue" 
                xKey={overviewQ.data?.revenueSeries ? 'day' : 'bucket'} 
              />
            </div>
          </div>

          {/* Links para outras seções */}
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-2">Detalhes por Seção</h2>
              <p className="text-sm text-gray-500">Clique para ver análises detalhadas</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <a href="/dashboard/finance" className="group block p-6 bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-200 hover:shadow-lg transition-all hover:scale-105">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <FaDollarSign className="w-6 h-6 text-green-700" />
                  </div>
                  <div className="text-sm font-medium text-green-700">Análise Financeira</div>
                </div>
                <div className="text-sm text-gray-600">Receita detalhada, formas de pagamento e breakdowns</div>
              </a>

              <a href="/dashboard/operations" className="group block p-6 bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-200 hover:shadow-lg transition-all hover:scale-105">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <FaCog className="w-6 h-6 text-blue-700" />
                  </div>
                  <div className="text-sm font-medium text-blue-700">Operações</div>
                </div>
                <div className="text-sm text-gray-600">Eficiência operacional, tempo de atendimento e fluxo</div>
              </a>

              <a href="/dashboard/kitchen" className="group block p-6 bg-gradient-to-br from-orange-50 to-white rounded-xl border border-orange-200 hover:shadow-lg transition-all hover:scale-105">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                    <FaFire className="w-6 h-6 text-orange-700" />
                  </div>
                  <div className="text-sm font-medium text-orange-700">Cozinha</div>
                </div>
                <div className="text-sm text-gray-600">Performance, SLA e tempo de preparo</div>
              </a>

              <a href="/dashboard/menu" className="group block p-6 bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-200 hover:shadow-lg transition-all hover:scale-105">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <FaUtensils className="w-6 h-6 text-purple-700" />
                  </div>
                  <div className="text-sm font-medium text-purple-700">Cardápio</div>
                </div>
                <div className="text-sm text-gray-600">Top items, receita por produto e categorias</div>
              </a>

              <a href="/dashboard/waiters" className="group block p-6 bg-gradient-to-br from-indigo-50 to-white rounded-xl border border-indigo-200 hover:shadow-lg transition-all hover:scale-105">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                    <FaUserTie className="w-6 h-6 text-indigo-700" />
                  </div>
                  <div className="text-sm font-medium text-indigo-700">Garçons</div>
                </div>
                <div className="text-sm text-gray-600">Ranking, receita e performance individual</div>
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
