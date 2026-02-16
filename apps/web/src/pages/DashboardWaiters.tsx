import { useState, useMemo } from 'react';
import { useOverview as useOverviewHook } from '../hooks/useOverview';
import KPICards from '../components/dashboard/KPICards';
import PeriodComparison from '../components/dashboard/PeriodComparison';
import AlertsList from '../components/dashboard/AlertsList';
import WaiterRankingTable from '../components/dashboard/WaiterRankingTable';
import DistributionPanel from '../components/dashboard/DistributionPanel';
import formatCurrency from '../lib/formatCurrency';

type Period = 'today' | '7d' | '30d';

function toISO(date: Date) {
  return date.toISOString();
}

export default function DashboardWaiters() {
  const [period, setPeriod] = useState<Period>('today');
  const { useOverviewWaiters } = useOverviewHook();

  const { start, end } = useMemo(() => {
    const now = new Date();
    const startToday = new Date(now);
    startToday.setHours(0, 0, 0, 0);
    const start7 = new Date(now);
    start7.setDate(start7.getDate() - 6);
    start7.setHours(0, 0, 0, 0);
    const start30 = new Date(now);
    start30.setDate(start30.getDate() - 29);
    start30.setHours(0, 0, 0, 0);

    if (period === 'today') return { start: toISO(startToday), end: toISO(now) };
    if (period === '7d') return { start: toISO(start7), end: toISO(now) };
    if (period === '30d') return { start: toISO(start30), end: toISO(now) };
    return { start: toISO(startToday), end: toISO(now) };
  }, [period]);

  const waitersQ = useOverviewWaiters({ start, end });

  if (waitersQ.isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-red-800 mb-2">Erro ao carregar Análise de Garçons</h2>
        <div className="text-red-600 mb-1">{(waitersQ.error as any)?.message ?? String(waitersQ.error)}</div>
        <div className="mt-3 text-sm text-red-700">Verifique a API ou suas permissões de administrador.</div>
      </div>
    );
  }

  if (waitersQ.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
          <p className="text-gray-600">Carregando análise de garçons...</p>
        </div>
      </div>
    );
  }

  const data = waitersQ.data!;

  // KPIs Executivos
  const kpis = [
    { 
      label: '💰 Receita Total', 
      value: formatCurrency(data.kpis.totalRevenue), 
      sub: 'No período selecionado' 
    },
    { 
      label: '🎟 Ticket Médio Geral', 
      value: formatCurrency(data.kpis.avgTicket), 
      sub: 'Por comanda paga' 
    },
    { 
      label: '⚡ Tempo Médio Entrega', 
      value: data.kpis.avgDeliveryTime > 0 ? `${Math.round(data.kpis.avgDeliveryTime)} min` : '-', 
      sub: 'Da cozinha ao cliente' 
    },
    { 
      label: '🧾 Comandas Fechadas', 
      value: data.kpis.closedTabs, 
      sub: 'Pagas no período' 
    },
    { 
      label: '🕒 Receita/Hora Média', 
      value: formatCurrency(data.kpis.revenuePerHour), 
      sub: 'Por hora trabalhada' 
    },
  ];

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">👔 Análise de Garçons</h1>
          <p className="text-gray-500 mt-1">Ranking, distribuição e performance da equipe</p>
        </div>

        {/* Filtros de período */}
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('today')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === 'today' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Hoje
          </button>
          <button
            onClick={() => setPeriod('7d')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === '7d' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            7 Dias
          </button>
          <button
            onClick={() => setPeriod('30d')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === '30d' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            30 Dias
          </button>
        </div>
      </div>

      {/* 1️⃣ KPIs EXECUTIVOS */}
      <div>
        <KPICards items={kpis} />
      </div>

      {/* 2️⃣ COMPARAÇÃO COM PERÍODO ANTERIOR */}
      {data.comparison && (
        <PeriodComparison data={data.comparison} />
      )}

      {/* 3️⃣ ALERTAS INTELIGENTES */}
      {data.alerts && data.alerts.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">🚨 Alertas Inteligentes</h2>
          <AlertsList alerts={data.alerts} />
        </div>
      )}

      {/* 4️⃣ RANKING DE GARÇONS */}
      {data.waiterRanking && (
        <div>
          <h2 className="text-xl font-semibold mb-4">📊 Ranking de Garçons</h2>
          <WaiterRankingTable data={data.waiterRanking} />
        </div>
      )}

      {/* 5️⃣ DISTRIBUIÇÃO E EQUILÍBRIO */}
      {data.distribution && (
        <div>
          <h2 className="text-xl font-semibold mb-4">📈 Distribuição e Equilíbrio</h2>
          <DistributionPanel 
            tabsDistribution={data.distribution.tabsDistribution}
            avgTimeByWaiter={data.distribution.avgTimeByWaiter}
            waiterHistory={data.distribution.waiterHistory}
          />
        </div>
      )}

      {/* Link de volta */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <a href="/dashboard/overview" className="text-indigo-600 hover:text-indigo-700 hover:underline">
          ← Voltar para Visão Geral
        </a>
      </div>
    </div>
  );
}
