import { useState, useMemo } from 'react';
import { useOverview as useOverviewHook } from '../hooks/useOverview';
import KitchenKPIs from '../components/dashboard/KitchenKPIs';
import KitchenAlerts from '../components/dashboard/KitchenAlerts';
import KitchenItemsAnalysis from '../components/dashboard/KitchenItemsAnalysis';
import KitchenTemporal from '../components/dashboard/KitchenTemporal';
import KitchenStatus from '../components/dashboard/KitchenStatus';

type Period = 'today' | '7d' | '30d';

function toISO(date: Date) {
  return date.toISOString();
}

export default function DashboardKitchen() {
  const [period, setPeriod] = useState<Period>('today');
  const { useOverviewKitchen } = useOverviewHook();

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

  const kitchenQ = useOverviewKitchen({ start, end });

  if (kitchenQ.isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-red-800 mb-2">Erro ao carregar Análise da Cozinha</h2>
        <div className="text-red-600 mb-1">{(kitchenQ.error as any)?.message ?? String(kitchenQ.error)}</div>
        <div className="mt-3 text-sm text-red-700">Verifique a API ou suas permissões de administrador.</div>
      </div>
    );
  }

  if (kitchenQ.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
          <p className="text-gray-600">Carregando análise da cozinha...</p>
        </div>
      </div>
    );
  }

  const data = kitchenQ.data!;

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">🔥 Análise da Cozinha</h1>
          <p className="text-gray-500 mt-1">Performance, SLA e tempo de preparo</p>
        </div>

        {/* Filtros de período */}
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('today')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === 'today' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Hoje
          </button>
          <button
            onClick={() => setPeriod('7d')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === '7d' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            7 Dias
          </button>
          <button
            onClick={() => setPeriod('30d')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === '30d' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            30 Dias
          </button>
        </div>
      </div>

      {/* 1️⃣ KPIs DA COZINHA */}
      <div className="mb-8">
        <KitchenKPIs
          avgPrepTime={data.kpis.avgPrepTime}
          avgTotalTime={data.kpis.avgTotalTime}
          delayedPercentage={data.kpis.delayedPercentage}
          delayedCount={data.kpis.delayedCount}
          ordersVolume={data.kpis.ordersVolume}
          peakSimultaneous={data.kpis.peakSimultaneous}
          slaMinutes={data.kpis.slaMinutes}
        />
      </div>

      {/* 2️⃣ ALERTAS DA COZINHA */}
      {data.alerts && data.alerts.length > 0 && (
        <div className="mb-8">
          <KitchenAlerts alerts={data.alerts} />
        </div>
      )}

      {/* 3️⃣ ANÁLISE DE ITENS */}
      {data.items && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">🍽 Análise de Itens</h2>
          <KitchenItemsAnalysis
            byPrepTime={data.items.byPrepTime}
            topSelling={data.items.topSelling}
            critical={data.items.critical}
          />
        </div>
      )}

      {/* 4️⃣ DISTRIBUIÇÃO TEMPORAL */}
      {data.temporal && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">⏱ Distribuição Temporal</h2>
          <KitchenTemporal
            temporal={data.temporal}
            slaMinutes={data.kpis.slaMinutes}
          />
        </div>
      )}

      {/* 5️⃣ STATUS DOS PEDIDOS */}
      {data.status && (
        <div className="mb-8">
          <KitchenStatus status={data.status} />
        </div>
      )}

      {/* Link de volta */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <a href="/dashboard/overview" className="text-orange-600 hover:text-orange-700 hover:underline">
          ← Voltar para Visão Geral
        </a>
      </div>
    </div>
  );
}
