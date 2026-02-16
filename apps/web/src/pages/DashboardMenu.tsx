import { useState, useMemo } from 'react';
import { useOverview as useOverviewHook } from '../hooks/useOverview';
import MenuKPIs from '../components/dashboard/MenuKPIs';
import MenuAlerts from '../components/dashboard/MenuAlerts';
import MenuTopItems from '../components/dashboard/MenuTopItems';
import MenuStrategicMatrix from '../components/dashboard/MenuStrategicMatrix';
import MenuPerformance from '../components/dashboard/MenuPerformance';
import MenuOperationalImpact from '../components/dashboard/MenuOperationalImpact';

type Period = 'today' | '7d' | '30d';

function toISO(date: Date) {
  return date.toISOString();
}

export default function DashboardMenu() {
  const [period, setPeriod] = useState<Period>('today');
  const { useOverviewMenu } = useOverviewHook();

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

  const menuQ = useOverviewMenu({ start, end });

  if (menuQ.isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-red-800 mb-2">Erro ao carregar Análise do Cardápio</h2>
        <div className="text-red-600 mb-1">{(menuQ.error as any)?.message ?? String(menuQ.error)}</div>
        <div className="mt-3 text-sm text-red-700">Verifique a API ou suas permissões de administrador.</div>
      </div>
    );
  }

  if (menuQ.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
          <p className="text-gray-600">Carregando análise do cardápio...</p>
        </div>
      </div>
    );
  }

  const data = menuQ.data!;

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">🍽 Análise do Cardápio</h1>
          <p className="text-gray-500 mt-1">Performance de itens, receita e impacto operacional</p>
        </div>

        {/* Filtros de período */}
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('today')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === 'today' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Hoje
          </button>
          <button
            onClick={() => setPeriod('7d')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === '7d' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            7 Dias
          </button>
          <button
            onClick={() => setPeriod('30d')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === '30d' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            30 Dias
          </button>
        </div>
      </div>

      {/* 1️⃣ KPIs DO CARDÁPIO */}
      <div className="mb-8">
        <MenuKPIs
          totalRevenue={data.kpis.totalRevenue}
          totalItems={data.kpis.totalItems}
          unavailableCount={data.kpis.unavailableCount}
          avgPrepTime={data.kpis.avgPrepTime}
          concentrationRatio={data.kpis.concentrationRatio}
        />
      </div>

      {/* 2️⃣ ALERTAS DO CARDÁPIO */}
      {data.alerts && data.alerts.length > 0 && (
        <div className="mb-8">
          <MenuAlerts alerts={data.alerts} />
        </div>
      )}

      {/* 3️⃣ TOP ITENS E RECEITA POR CATEGORIA */}
      {data.topItems && data.categoryDistribution && (
        <div className="mb-8">
          <MenuTopItems
            byVolume={data.topItems.byVolume}
            byRevenue={data.topItems.byRevenue}
            categoryDistribution={data.categoryDistribution}
          />
        </div>
      )}

      {/* 4️⃣ ANÁLISE ESTRATÉGICA */}
      {data.strategicMatrix && data.bottlenecks && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">📊 Análise Estratégica</h2>
          <MenuStrategicMatrix
            strategicMatrix={data.strategicMatrix}
            bottlenecks={data.bottlenecks}
          />
        </div>
      )}

      {/* 5️⃣ PERFORMANCE E DISPONIBILIDADE */}
      {data.lowVolumeItems && data.unavailableItems && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">📉 Performance e Disponibilidade</h2>
          <MenuPerformance
            lowVolumeItems={data.lowVolumeItems}
            unavailableItems={data.unavailableItems}
          />
        </div>
      )}

      {/* 6️⃣ IMPACTO OPERACIONAL */}
      {data.categoryPrepTime && data.itemDelayRate && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">⚙️ Impacto Operacional</h2>
          <MenuOperationalImpact
            categoryPrepTime={data.categoryPrepTime}
            itemDelayRate={data.itemDelayRate}
          />
        </div>
      )}

      {/* Link de volta */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <a href="/dashboard/overview" className="text-purple-600 hover:text-purple-700 hover:underline">
          ← Voltar para Visão Geral
        </a>
      </div>
    </div>
  );
}
