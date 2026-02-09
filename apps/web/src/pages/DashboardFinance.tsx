import { useState, useMemo } from 'react';
import useMetrics from '../hooks/useMetrics';
import { useDashboard } from '../hooks/useDashboard';
import useFinance from '../hooks/useFinance';
import KPICards from '../components/dashboard/KPICards';
import formatCurrency from '../lib/formatCurrency';
import TimeSeriesChart from '../components/dashboard/TimeSeriesChart';
import BarChart from '../components/dashboard/BarChart';
import PieChart from '../components/dashboard/PieChart';
import AreaChart from '../components/dashboard/AreaChart';
import ErrorBoundary from '../components/ErrorBoundary';

type Period = 'today' | '7days' | '30days';

export default function DashboardFinance() {
  const [period, setPeriod] = useState<Period>('today');
  
  const { useRevenue, useTopMenuItems, useOverview } = useMetrics();
  const { useStats } = useDashboard();

  const { data: stats, isLoading: statsLoading, isError: statsError, error: statsErrorObj } = useStats();
  const { data: overview, isLoading: overviewLoading } = useOverview();
  
  // Memoize date range to prevent infinite loop (new Date() changes every render)
  const { startISO, endISO } = useMemo(() => {
    const now = new Date();
    let startDate = new Date(now);
    if (period === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === '7days') {
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === '30days') {
      startDate.setDate(startDate.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
    }
    return {
      startISO: startDate.toISOString(),
      endISO: now.toISOString()
    };
  }, [period]);

  const { data: buckets, isLoading: revenueLoading, isError: revenueError, error: revenueErrorObj } = useRevenue({ groupBy: 'hour', start: startISO, end: endISO });
  const { data: topItemsMetric, isLoading: topItemsLoading } = useTopMenuItems({ limit: 10, start: startISO, end: endISO });

  const { useSummary } = useFinance();
  const { data: financeSummary, isLoading: financeLoading, isError: financeError, error: financeErrorObj } = useSummary({ start: startISO, end: endISO });

  // If any fetch errored, show error immediately (avoid hiding it behind a spinner)
  if (statsError || revenueError || financeError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-red-800 mb-2">Erro ao carregar dados do dashboard</h2>
        {statsError && <div className="text-red-600 mb-1">Stats: {(statsErrorObj as any)?.message ?? String(statsErrorObj)}</div>}
        {revenueError && <div className="text-red-600 mb-1">Revenue: {(revenueErrorObj as any)?.message ?? String(revenueErrorObj)}</div>}
        {financeError && <div className="text-red-600 mb-1">Finance: {(financeErrorObj as any)?.message ?? String(financeErrorObj)}</div>}
        <div className="mt-3 text-sm text-red-700">Verifique se seu usuário possui permissão de administrador e se a API está acessível.</div>
      </div>
    );
  }

  const loading = statsLoading || revenueLoading || overviewLoading || topItemsLoading || financeLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
          <p className="text-gray-600">Carregando dashboard financeiro...</p>
        </div>
      </div>
    );
  }

  // Derive totals robustly: prefer financeSummary, otherwise try overview fields
  const total = (typeof financeSummary?.revenue === 'number' ? financeSummary.revenue :
    (typeof overview?.revenue === 'number' ? overview.revenue : (overview?.revenue?.today ?? 0))) || stats?.dailyRevenue || 0;

  const avgTicket = financeSummary?.avgTicket ?? overview?.avgTicket ?? overview?.ticket ?? 0;

  // Trim KPIs to avoid duplication with Overview: keep finance-specific KPIs only
  const kpis = [
    { label: 'Receita Total', value: formatCurrency(total), sub: 'Período selecionado' },
    { label: 'Ticket Médio', value: formatCurrency(avgTicket), sub: 'Por comanda fechada' },
    { label: 'Clientes Ativos', value: overview?.activeCustomers ?? 0, sub: 'No momento' },
  ];

  // Preparar dados para gráfico de pizza (categorias)
  const categoryData = stats?.popularItems?.reduce((acc: any[], item: any) => {
    const existing = acc.find(c => c.category === 'Alimentos');
    if (existing) {
      existing.value += item.totalSold;
    } else {
      acc.push({ category: 'Alimentos', value: item.totalSold });
    }
    return acc;
  }, []) ?? [{ category: 'Sem dados', value: 0 }];

  // Preparar dados para gráfico de barras (top items)
  const topItemsSource = financeSummary?.topItems ?? topItemsMetric ?? [];
  const topItemsChart = topItemsSource.map((item: any) => ({
    name: (item.name ?? item.itemName ?? 'Item').toString().substring(0, 15),
    quantidade: Number(item.qty ?? item.totalSold ?? 0),
    receita: Number(item.revenue ?? 0),
  }));

  // Preparar dados para gráfico de área (receita por hora)
  const revenueAreaData = buckets?.map((b: any) => {
    const date = b.bucket ? new Date(b.bucket) : null;
    return {
      hora: date ? date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'N/A',
      receita: Number(b.revenue ?? 0),
    };
  }).filter((d: any) => d.hora !== 'N/A') ?? [];

  // Performance garçons
  const waiterData = stats?.waiterPerformance?.map((w: any) => ({
    name: w.waiterName?.substring(0, 12) ?? 'Garçom',
    receita: Number(w.totalRevenue ?? 0),
    mesas: Number(w.tablesServed ?? 0),
  })) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard Financeiro</h1>
          <p className="text-gray-500 mt-1">Análise completa da operação</p>
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
            onClick={() => setPeriod('7days')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === '7days' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            7 Dias
          </button>
          <button
            onClick={() => setPeriod('30days')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === '30days' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            30 Dias
          </button>
        </div>
      </div>

      {/* KPIs */}
      <KPICards items={kpis} />

      <div className="mt-3 text-sm text-gray-500">
        <span>Para visão executiva e KPIs do dia, veja </span>
        <a href="/dashboard/overview" className="text-blue-600 hover:underline">Visão Geral</a>
        <span> — para operações detalhadas veja </span>
        <a href="/dashboard/operations" className="text-blue-600 hover:underline">Operação</a>
        <span>.</span>
      </div>

      {/* Gráficos - Linha 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ErrorBoundary>
          <AreaChart 
            data={revenueAreaData} 
            dataKey="receita" 
            xKey="hora" 
            title="Receita por Horário"
            color="#10B981"
          />
        </ErrorBoundary>

        <ErrorBoundary>
          { (financeSummary?.topItems ?? topItemsChart).length > 0 ? (
            <BarChart 
              data={(financeSummary?.topItems ?? topItemsChart).map((it: any) => ({ name: it.name ?? it.itemName ?? 'Item', quantidade: Number(it.qty ?? it.totalSold ?? 0), receita: Number(it.revenue ?? 0) }))} 
              dataKey="quantidade" 
              xKey="name" 
              title="Itens Mais Vendidos"
              color="#3B82F6"
            />
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-center h-[328px]">
              <p className="text-gray-500">Nenhum item vendido no período</p>
            </div>
          )}
        </ErrorBoundary>
      </div>

      {/* Gráficos - Linha 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ErrorBoundary>
          {waiterData.length > 0 ? (
            <BarChart 
              data={waiterData} 
              dataKey="receita" 
              xKey="name" 
              title="Performance por Garçom"
              color="#8B5CF6"
            />
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-center h-[328px]">
              <p className="text-gray-500">Sem dados de garçons</p>
            </div>
          )}
        </ErrorBoundary>

        <ErrorBoundary>
          {categoryData.length > 0 && categoryData[0].category !== 'Sem dados' ? (
            <PieChart 
              data={categoryData} 
              dataKey="value" 
              nameKey="category" 
              title="Vendas por Categoria"
            />
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-center h-[328px]">
              <p className="text-gray-500">Sem dados de categorias</p>
            </div>
          )}
        </ErrorBoundary>

        <ErrorBoundary>
          <TimeSeriesChart 
            data={buckets || []} 
            dataKey="revenue" 
            xKey="bucket"
          />
        </ErrorBoundary>
      </div>

      {/* Tabela de itens populares */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold mb-4">Top 10 Itens do Cardápio</h2>
        { (financeSummary?.topItems ?? topItemsMetric) && (financeSummary?.topItems ?? topItemsMetric).length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Item</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Quantidade</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Receita</th>
                </tr>
              </thead>
              <tbody>
                {(financeSummary?.topItems ?? topItemsMetric).map((item: any, idx: number) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">{item.name ?? 'Item desconhecido'}</td>
                    <td className="py-3 px-4 text-sm text-gray-700 text-right">{item.qty ?? 0}</td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900 text-right">
                      {formatCurrency(Number(item.revenue ?? 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">Nenhum item vendido no período</div>
        )}
      </div>
    </div>
  );
}
