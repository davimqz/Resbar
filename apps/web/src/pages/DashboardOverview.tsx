import { useMemo, useState } from 'react';
import KPICards from '../components/dashboard/KPICards';
import TimeSeriesChart from '../components/dashboard/TimeSeriesChart';
import WaiterRankingTable from '../components/dashboard/WaiterRankingTable';
import AlertsList from '../components/dashboard/AlertsList';
import PeriodComparison from '../components/dashboard/PeriodComparison';
import DistributionPanel from '../components/dashboard/DistributionPanel';
import FinanceKPIs from '../components/dashboard/FinanceKPIs';
import FinanceAlerts from '../components/dashboard/FinanceAlerts';
import RevenueDistributionCharts from '../components/dashboard/RevenueDistributionCharts';
import BehavioralMetrics from '../components/dashboard/BehavioralMetrics';
import FinanceTrendComparison from '../components/dashboard/FinanceTrendComparison';
import OperationalKPIs from '../components/dashboard/OperationalKPIs';
import OperationalFlow from '../components/dashboard/OperationalFlow';
import TableEfficiency from '../components/dashboard/TableEfficiency';
import OperationalAlerts from '../components/dashboard/OperationalAlerts';
import OperationalStatus from '../components/dashboard/OperationalStatus';
import useOverviewHook from '../hooks/useOverview';
import { useDashboard } from '../hooks/useDashboard';
import { FaDollarSign, FaUtensils, FaUserTie, FaCog, FaFire } from 'react-icons/fa';
import formatCurrency from '../lib/formatCurrency';

function toISO(d: Date) {
  return d.toISOString();
}

export default function DashboardOverview() {
  const { useOverviewData, useOverviewWaiters, useOverviewFinance, useOverviewOperations, useRevenue } = useOverviewHook();
  const { useStats } = useDashboard();

  const [preset, setPreset] = useState<'today' | '7d' | '30d' | 'custom'>('today');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [activeSection, setActiveSection] = useState<'finance' | 'waiters' | 'operations'>('finance');

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
  const revenueQ = useRevenue({ start, end, groupBy: 'day' });
  const statsQ = useStats();

  // If any query errored, surface the error to the user
  if (overviewQ.isError || revenueQ.isError || statsQ.isError || waitersQ.isError || financeQ.isError || operationsQ.isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-red-800 mb-2">Erro ao carregar Visão Geral</h2>
        {financeQ.isError && <div className="text-red-600 mb-1">Finanças: {(financeQ.error as any)?.message ?? String(financeQ.error)}</div>}
        {overviewQ.isError && <div className="text-red-600 mb-1">Overview: {(overviewQ.error as any)?.message ?? String(overviewQ.error)}</div>}
        {waitersQ.isError && <div className="text-red-600 mb-1">Garçons: {(waitersQ.error as any)?.message ?? String(waitersQ.error)}</div>}
        {operationsQ.isError && <div className="text-red-600 mb-1">Operacional: {(operationsQ.error as any)?.message ?? String(operationsQ.error)}</div>}
        {revenueQ.isError && <div className="text-red-600 mb-1">Receita: {(revenueQ.error as any)?.message ?? String(revenueQ.error)}</div>}
        {statsQ.isError && <div className="text-red-600 mb-1">Stats: {(statsQ.error as any)?.message ?? String(statsQ.error)}</div>}
        <div className="mt-3 text-sm text-red-700">Verifique a API ou suas permissões de administrador.</div>
      </div>
    );
  }

  const loading = overviewQ.isLoading || revenueQ.isLoading || statsQ.isLoading || waitersQ.isLoading || financeQ.isLoading || operationsQ.isLoading;

  const kpis = [] as { label: string; value: string | number; sub?: string }[];

  // KPIs Executivos focados em garçons
  if (waitersQ.data?.kpis) {
    const kpisData = waitersQ.data.kpis;
    kpis.push({ 
      label: '💰 Receita Total (Garçons)', 
      value: formatCurrency(kpisData.totalRevenue), 
      sub: 'No período selecionado' 
    });
    kpis.push({ 
      label: '🎟 Ticket Médio Geral', 
      value: formatCurrency(kpisData.avgTicket), 
      sub: 'Por comanda paga' 
    });
    kpis.push({ 
      label: '⚡ Tempo Médio Entrega', 
      value: kpisData.avgDeliveryTime > 0 ? `${Math.round(kpisData.avgDeliveryTime)} min` : '-', 
      sub: 'Da cozinha ao cliente' 
    });
    kpis.push({ 
      label: '🧾 Comandas Fechadas', 
      value: kpisData.closedTabs, 
      sub: 'Pagas no período' 
    });
    kpis.push({ 
      label: '🕒 Receita/Hora Média', 
      value: formatCurrency(kpisData.revenuePerHour), 
      sub: 'Por hora trabalhada' 
    });
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header com filtros */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Executiva</h1>
          <p className="text-sm text-gray-500">Métricas consolidadas e análise de desempenho</p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setPreset('today')} className={`px-3 py-1 rounded ${preset==='today'? 'bg-slate-800 text-white':'bg-white'}`}>Hoje</button>
          <button onClick={() => setPreset('7d')} className={`px-3 py-1 rounded ${preset==='7d'? 'bg-slate-800 text-white':'bg-white'}`}>7 dias</button>
          <button onClick={() => setPreset('30d')} className={`px-3 py-1 rounded ${preset==='30d'? 'bg-slate-800 text-white':'bg-white'}`}>30 dias</button>
          <button onClick={() => setPreset('custom')} className={`px-3 py-1 rounded ${preset==='custom'? 'bg-slate-800 text-white':'bg-white'}`}>Custom</button>
        </div>
      </div>

      {preset === 'custom' && (
        <div className="flex gap-2 mb-4">
          <input type="datetime-local" value={customStart} onChange={e => setCustomStart(e.target.value)} className="border p-2 rounded" />
          <input type="datetime-local" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="border p-2 rounded" />
        </div>
      )}

      {/* Tabs de Seleção */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveSection('finance')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeSection === 'finance'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            💰 Financeiro
          </button>
          <button
            onClick={() => setActiveSection('waiters')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeSection === 'waiters'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            👔 Garçons
          </button>
          <button
            onClick={() => setActiveSection('operations')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeSection === 'operations'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            ⚙️ Operacional
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Carregando dados...</p>
        </div>
      ) : (
        <>
          {/* SEÇÃO FINANCEIRO */}
          {activeSection === 'finance' && financeQ.data && (
            <>
              {/* 1️⃣ KPIs EXECUTIVOS FINANCEIROS */}
              <div className="mb-8">
                <FinanceKPIs
                  totalRevenue={financeQ.data.kpis.totalRevenue}
                  avgTicket={financeQ.data.kpis.avgTicket}
                  paidTabsCount={financeQ.data.kpis.paidTabsCount}
                  totalServiceCharge={financeQ.data.kpis.totalServiceCharge}
                  revenueByPayment={financeQ.data.kpis.revenueByPayment}
                />
              </div>

              {/* 5️⃣ TENDÊNCIAS FINANCEIRAS */}
              {financeQ.data.comparison && (
                <div className="mb-8">
                  <FinanceTrendComparison data={financeQ.data.comparison} />
                </div>
              )}

              {/* 4️⃣ ALERTAS FINANCEIROS */}
              {financeQ.data.alerts && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">🚨 Alertas Financeiros</h2>
                  <FinanceAlerts alerts={financeQ.data.alerts} />
                </div>
              )}

              {/* 2️⃣ DISTRIBUIÇÕES FINANCEIRAS */}
              {financeQ.data.distributions && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">📊 Distribuições de Receita</h2>
                  <RevenueDistributionCharts
                    revenueByDay={financeQ.data.distributions.revenueByDay}
                    revenueByShift={financeQ.data.distributions.revenueByShift}
                    revenueByWaiter={financeQ.data.distributions.revenueByWaiter}
                  />
                </div>
              )}

              {/* 3️⃣ INDICADORES COMPORTAMENTAIS */}
              {financeQ.data.behavioral && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">📈 Indicadores Comportamentais</h2>
                  <BehavioralMetrics
                    avgTimeToPayment={financeQ.data.behavioral.avgTimeToPayment}
                    tabTypeDistribution={financeQ.data.behavioral.tabTypeDistribution}
                    avgItemPrice={financeQ.data.behavioral.avgItemPrice}
                    avgQuantity={financeQ.data.behavioral.avgQuantity}
                  />
                </div>
              )}
            </>
          )}

          {/* SEÇÃO GARÇONS */}
          {activeSection === 'waiters' && waitersQ.data && (
            <>
              {/* 1️⃣ KPIs EXECUTIVOS */}
              <div>
                <KPICards items={kpis} />
              </div>

              {/* 5️⃣ COMPARAÇÃO COM PERÍODO ANTERIOR */}
              {waitersQ.data?.comparison && (
                <PeriodComparison data={waitersQ.data.comparison} />
              )}

              {/* 4️⃣ ALERTAS INTELIGENTES */}
              {waitersQ.data?.alerts && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">🚨 Alertas Inteligentes</h2>
                  <AlertsList alerts={waitersQ.data.alerts} />
                </div>
              )}

              {/* 2️⃣ RANKING DE GARÇONS */}
              {waitersQ.data?.waiterRanking && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">📊 Ranking de Garçons</h2>
                  <WaiterRankingTable data={waitersQ.data.waiterRanking} />
                </div>
              )}

              {/* 3️⃣ DISTRIBUIÇÃO E EQUILÍBRIO */}
              {waitersQ.data?.distribution && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">📈 Distribuição e Equilíbrio</h2>
                  <DistributionPanel 
                    tabsDistribution={waitersQ.data.distribution.tabsDistribution}
                    avgTimeByWaiter={waitersQ.data.distribution.avgTimeByWaiter}
                    waiterHistory={waitersQ.data.distribution.waiterHistory}
                  />
                </div>
              )}
            </>
          )}

          {/* SEÇÃO OPERACIONAL */}
          {activeSection === 'operations' && operationsQ.data && (
            <>
              {/* 1️⃣ KPIs OPERACIONAIS */}
              <div className="mb-8">
                <OperationalKPIs
                  avgDeliveryTime={operationsQ.data.kpis.avgDeliveryTime}
                  avgTimeToPayment={operationsQ.data.kpis.avgTimeToPayment}
                  closedTabsCount={operationsQ.data.kpis.closedTabsCount}
                  throughputPerHour={operationsQ.data.kpis.throughputPerHour}
                  utilizationRate={operationsQ.data.kpis.utilizationRate}
                  tableTurnoverRate={operationsQ.data.kpis.tableTurnoverRate}
                />
              </div>

              {/* 4️⃣ ALERTAS OPERACIONAIS */}
              {operationsQ.data.alerts && (
                <div className="mb-8">
                  <OperationalAlerts alerts={operationsQ.data.alerts} />
                </div>
              )}

              {/* 2️⃣ FLUXO OPERACIONAL */}
              {operationsQ.data.flow && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">📊 Fluxo Operacional</h2>
                  <OperationalFlow flow={operationsQ.data.flow} />
                </div>
              )}

              {/* 3️⃣ EFICIÊNCIA POR MESA */}
              {operationsQ.data.tableEfficiency && (
                <div className="mb-8">
                  <TableEfficiency data={operationsQ.data.tableEfficiency} />
                </div>
              )}

              {/* 5️⃣ ANÁLISE DE STATUS */}
              {operationsQ.data.status && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">📈 Análise de Status</h2>
                  <OperationalStatus
                    orderStatusDistribution={operationsQ.data.status.orderStatusDistribution}
                    tabStatusDistribution={operationsQ.data.status.tabStatusDistribution}
                  />
                </div>
              )}
            </>
          )}

          {/* Evolução da Receita */}
          <div>
            <h2 className="text-lg font-medium mb-4">Receita — Evolução</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <TimeSeriesChart data={overviewQ.data?.revenueSeries ?? revenueQ.data ?? []} dataKey="revenue" xKey={overviewQ.data?.revenueSeries ? 'day' : 'bucket'} />
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
