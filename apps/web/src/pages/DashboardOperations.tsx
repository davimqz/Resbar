import { useState, useMemo } from 'react';
import { useOverview as useOverviewHook } from '../hooks/useOverview';
import OperationalKPIs from '../components/dashboard/OperationalKPIs';
import OperationalAlerts from '../components/dashboard/OperationalAlerts';
import OperationalFlow from '../components/dashboard/OperationalFlow';
import TableEfficiency from '../components/dashboard/TableEfficiency';
import OperationalStatus from '../components/dashboard/OperationalStatus';

type Period = 'today' | '7d' | '30d';

function toISO(date: Date) {
  return date.toISOString();
}

export default function DashboardOperations() {
  const [period, setPeriod] = useState<Period>('today');
  const { useOverviewOperations } = useOverviewHook();

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

  const operationsQ = useOverviewOperations({ start, end });

  if (operationsQ.isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-red-800 mb-2">Erro ao carregar Análise Operacional</h2>
        <div className="text-red-600 mb-1">{(operationsQ.error as any)?.message ?? String(operationsQ.error)}</div>
        <div className="mt-3 text-sm text-red-700">Verifique a API ou suas permissões de administrador.</div>
      </div>
    );
  }

  if (operationsQ.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
          <p className="text-gray-600">Carregando análise operacional...</p>
        </div>
      </div>
    );
  }

  const data = operationsQ.data!;

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">⚙️ Análise Operacional</h1>
          <p className="text-gray-500 mt-1">Eficiência, fluxo e performance de mesas</p>
        </div>

        {/* Filtros de período */}
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
            onClick={() => setPeriod('7d')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === '7d' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            7 Dias
          </button>
          <button
            onClick={() => setPeriod('30d')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === '30d' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            30 Dias
          </button>
        </div>
      </div>

      {/* 1️⃣ KPIs OPERACIONAIS */}
      <div className="mb-8">
        <OperationalKPIs
          avgDeliveryTime={data.kpis.avgDeliveryTime}
          avgTimeToPayment={data.kpis.avgTimeToPayment}
          closedTabsCount={data.kpis.closedTabsCount}
          throughputPerHour={data.kpis.throughputPerHour}
          utilizationRate={data.kpis.utilizationRate}
          tableTurnoverRate={data.kpis.tableTurnoverRate}
        />
      </div>

      {/* 2️⃣ ALERTAS OPERACIONAIS */}
      {data.alerts && data.alerts.length > 0 && (
        <div className="mb-8">
          <OperationalAlerts alerts={data.alerts} />
        </div>
      )}

      {/* 3️⃣ FLUXO OPERACIONAL */}
      {data.flow && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">📊 Fluxo Operacional</h2>
          <OperationalFlow flow={data.flow} />
        </div>
      )}

      {/* 4️⃣ EFICIÊNCIA POR MESA */}
      {data.tableEfficiency && (
        <div className="mb-8">
          <TableEfficiency data={data.tableEfficiency} />
        </div>
      )}

      {/* 5️⃣ ANÁLISE DE STATUS */}
      {data.status && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">📈 Análise de Status</h2>
          <OperationalStatus
            orderStatusDistribution={data.status.orderStatusDistribution}
            tabStatusDistribution={data.status.tabStatusDistribution}
          />
        </div>
      )}

      {/* Link de volta */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <a href="/dashboard/overview" className="text-blue-600 hover:text-blue-700 hover:underline">
          ← Voltar para Visão Geral
        </a>
      </div>
    </div>
  );
}

