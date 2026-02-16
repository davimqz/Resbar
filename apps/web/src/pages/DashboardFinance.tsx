import { useState, useMemo } from 'react';
import { useOverview as useOverviewHook } from '../hooks/useOverview';
import FinanceKPIs from '../components/dashboard/FinanceKPIs';
import FinanceTrendComparison from '../components/dashboard/FinanceTrendComparison';
import FinanceAlerts from '../components/dashboard/FinanceAlerts';
import RevenueDistributionCharts from '../components/dashboard/RevenueDistributionCharts';
import BehavioralMetrics from '../components/dashboard/BehavioralMetrics';

type Period = 'today' | '7d' | '30d';

function toISO(date: Date) {
  return date.toISOString();
}

export default function DashboardFinance() {
  const [period, setPeriod] = useState<Period>('today');
  const { useOverviewFinance } = useOverviewHook();

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

  const financeQ = useOverviewFinance({ start, end });

  if (financeQ.isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-red-800 mb-2">Erro ao carregar Análise Financeira</h2>
        <div className="text-red-600 mb-1">{(financeQ.error as any)?.message ?? String(financeQ.error)}</div>
        <div className="mt-3 text-sm text-red-700">Verifique a API ou suas permissões de administrador.</div>
      </div>
    );
  }

  if (financeQ.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
          <p className="text-gray-600">Carregando análise financeira detalhada...</p>
        </div>
      </div>
    );
  }

  const data = financeQ.data;

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">💰 Análise Financeira Detalhada</h1>
          <p className="text-gray-500 mt-1">Receita, formas de pagamento, distribuições e tendências</p>
        </div>

        {/* Filtros de período */}
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('today')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === 'today' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Hoje
          </button>
          <button
            onClick={() => setPeriod('7d')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === '7d' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            7 Dias
          </button>
          <button
            onClick={() => setPeriod('30d')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === '30d' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            30 Dias
          </button>
        </div>
      </div>

      {/* 1️⃣ KPIs EXECUTIVOS FINANCEIROS */}
      <div className="mb-8">
        <FinanceKPIs
          totalRevenue={data.kpis.totalRevenue}
          avgTicket={data.kpis.avgTicket}
          paidTabsCount={data.kpis.paidTabsCount}
          totalServiceCharge={data.kpis.totalServiceCharge}
          revenueByPayment={data.kpis.revenueByPayment}
        />
      </div>

      {/* 2️⃣ TENDÊNCIAS FINANCEIRAS */}
      {data.comparison && (
        <div className="mb-8">
          <FinanceTrendComparison data={data.comparison} />
        </div>
      )}

      {/* 3️⃣ ALERTAS FINANCEIROS */}
      {data.alerts && data.alerts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">🚨 Alertas Financeiros</h2>
          <FinanceAlerts alerts={data.alerts} />
        </div>
      )}

      {/* 4️⃣ DISTRIBUIÇÕES FINANCEIRAS */}
      {data.distributions && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">📊 Distribuições de Receita</h2>
          <RevenueDistributionCharts
            revenueByDay={data.distributions.revenueByDay}
            revenueByShift={data.distributions.revenueByShift}
            revenueByWaiter={data.distributions.revenueByWaiter}
          />
        </div>
      )}

      {/* 5️⃣ INDICADORES COMPORTAMENTAIS */}
      {data.behavioral && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">📈 Indicadores Comportamentais</h2>
          <BehavioralMetrics
            avgTimeToPayment={data.behavioral.avgTimeToPayment}
            tabTypeDistribution={data.behavioral.tabTypeDistribution}
            avgItemPrice={data.behavioral.avgItemPrice}
            avgQuantity={data.behavioral.avgQuantity}
          />
        </div>
      )}

      {/* Link de volta */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <a href="/dashboard/overview" className="text-green-600 hover:text-green-700 hover:underline">
          ← Voltar para Visão Geral
        </a>
      </div>
    </div>
  );
}
