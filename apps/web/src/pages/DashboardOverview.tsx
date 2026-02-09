import { useMemo, useState } from 'react';
import KPICards from '../components/dashboard/KPICards';
import TimeSeriesChart from '../components/dashboard/TimeSeriesChart';
import useOverviewHook from '../hooks/useOverview';
import { useDashboard } from '../hooks/useDashboard';
import { FaDollarSign, FaUtensils, FaUserTie, FaCog, FaFire } from 'react-icons/fa';
import formatCurrency from '../lib/formatCurrency';

function toISO(d: Date) {
  return d.toISOString();
}

export default function DashboardOverview() {
  const { useOverviewData, useRevenue } = useOverviewHook();
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
  const revenueQ = useRevenue({ start, end, groupBy: 'day' });
  const statsQ = useStats();

  // If any query errored, surface the error to the user
  if (overviewQ.isError || revenueQ.isError || statsQ.isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-red-800 mb-2">Erro ao carregar Visão Geral</h2>
        {overviewQ.isError && <div className="text-red-600 mb-1">Overview: {(overviewQ.error as any)?.message ?? String(overviewQ.error)}</div>}
        {revenueQ.isError && <div className="text-red-600 mb-1">Receita: {(revenueQ.error as any)?.message ?? String(revenueQ.error)}</div>}
        {statsQ.isError && <div className="text-red-600 mb-1">Stats: {(statsQ.error as any)?.message ?? String(statsQ.error)}</div>}
        <div className="mt-3 text-sm text-red-700">Verifique a API ou suas permissões de administrador.</div>
      </div>
    );
  }

  const loading = overviewQ.isLoading || revenueQ.isLoading || statsQ.isLoading;

  const kpis = [] as { label: string; value: string | number; sub?: string }[];

  if (overviewQ.data) {
    const rev = overviewQ.data.revenue;
    const todayRev = typeof rev === 'object' ? rev.today ?? 0 : rev ?? 0;
    const last7 = typeof rev === 'object' ? rev.last7d ?? 0 : 0;
    const last30 = typeof rev === 'object' ? rev.last30d ?? 0 : 0;
    const ticket = overviewQ.data.avgTicket ?? overviewQ.data.ticket ?? 0;
    const tablesOccupied = (overviewQ.data.tables && overviewQ.data.tables.occupied) ?? overviewQ.data.tablesOccupied ?? 0;
    const occupancyRate = overviewQ.data.tables?.occupancyRate ?? 0;
    const openTabs = overviewQ.data.openTabs ?? 0;

    kpis.push({ label: 'Receita (hoje)', value: formatCurrency(todayRev), sub: '↑ Hoje' });
    kpis.push({ label: 'Receita (7 dias)', value: formatCurrency(last7), sub: 'Últimos 7 dias' });
    kpis.push({ label: 'Receita (30 dias)', value: formatCurrency(last30), sub: 'Últimos 30 dias' });
    kpis.push({ label: 'Ticket Médio', value: formatCurrency(ticket), sub: 'Por comanda' });
    kpis.push({ label: 'Taxa de Ocupação', value: `${Math.round(occupancyRate)}%`, sub: `${tablesOccupied} mesas ocupadas` });
    kpis.push({ label: 'Comandas Abertas', value: openTabs, sub: 'Em atendimento' });
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Visão Geral</h1>
          <p className="text-sm text-gray-500">Métricas consolidadas e visão do dia</p>
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

      <div>{loading ? <div>Carregando...</div> : <KPICards items={kpis} />}</div>

      <div className="mt-6">
        <h2 className="text-lg font-medium mb-4">Receita — Evolução</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <TimeSeriesChart data={overviewQ.data?.revenueSeries ?? revenueQ.data ?? []} dataKey="revenue" xKey={overviewQ.data?.revenueSeries ? 'day' : 'bucket'} />
        </div>

        <div className="mt-8 mb-4">
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
    </div>
  );
}
