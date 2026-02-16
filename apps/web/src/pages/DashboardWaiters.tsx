import React, { useEffect, useMemo, useState } from 'react';
import useMetrics from '../hooks/useMetrics';
import { Link } from 'react-router-dom';
import { useDashboard } from '../hooks/useDashboard';
import BarChart from '../components/dashboard/BarChart';
import formatCurrency from '../lib/formatCurrency';
import { FaDollarSign, FaChartBar, FaClipboardList, FaLightbulb } from 'react-icons/fa';

export default function DashboardWaiters() {
  const { useWaitersRanking, useWaitersSummary } = useMetrics();
  const { useStats } = useDashboard();

  // Period selector state
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'custom'>('month');
  const [start, setStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29); // last 30 days by default
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  });
  const [end, setEnd] = useState<string>(() => new Date().toISOString());

  // Update start/end automatically when period changes (except custom)
  useEffect(() => {
    if (period === 'custom') return;
    const now = new Date();
    let s = new Date(now);
    if (period === 'day') {
      s.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      s.setDate(now.getDate() - 6);
      s.setHours(0, 0, 0, 0);
    } else if (period === 'month') {
      s.setDate(now.getDate() - 29);
      s.setHours(0, 0, 0, 0);
    }
    setStart(s.toISOString());
    setEnd(now.toISOString());
  }, [period]);

  const { data: summaryData, isLoading: summaryLoading } = useWaitersSummary({ start, end });
  const { data: rankingData, isLoading: rankingLoading } = useWaitersRanking({ start, end });
  const { data: statsData, isLoading: statsLoading } = useStats();
  const data = rankingData;
  const isLoading = rankingLoading || statsLoading || summaryLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
          <p className="text-gray-600">Carregando ranking dos garçons...</p>
        </div>
      </div>
    );
  }

  // Calcular KPIs gerais
  // Use summaryData when available (server aggregates for period)
  const totalRevenue = summaryData?.revenue ?? 0;
  const closedCount = summaryData?.closedCount ?? 0;
  const avgTicket = summaryData?.avgTicket ?? 0;

  // Prefer the count of currently active waiters when available, otherwise fall back to the ranking length.
  const totalWaiters = Array.isArray(statsData?.activeWaiters) && statsData.activeWaiters.length > 0
    ? statsData.activeWaiters.length
    : (Array.isArray(data) ? data.length : 0);
  const totalTables = Array.isArray(data) ? data.reduce((sum, w) => sum + Number(w.tables_served || 0), 0) : 0;
  const avgRevenuePerWaiter = totalWaiters > 0 ? (totalRevenue / totalWaiters) : 0;
  const avgTablesPerWaiter = totalWaiters > 0 ? totalTables / totalWaiters : 0;

  // Preparar dados para gráfico
  const chartData = Array.isArray(data)
    ? data.slice(0, 10).map((w: any) => ({
        name: w.waiter_name,
        receita: Number(w.revenue || 0),
      }))
    : [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Garçons</h1>
        <p className="text-gray-500 mt-1">Ranking e desempenho da equipe de atendimento</p>
      </div>

      {/* Period selector */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <label className="text-sm text-gray-600 mr-2">Período:</label>
          <select value={period} onChange={(e) => setPeriod(e.target.value as any)} className="border rounded px-2 py-1">
            <option value="day">Hoje</option>
            <option value="week">Últimos 7 dias</option>
            <option value="month">Últimos 30 dias</option>
            <option value="custom">Custom</option>
          </select>
          {period === 'custom' && (
            <span className="ml-3">
              <input type="date" value={start.slice(0,10)} onChange={(e)=>{
                const d = new Date(e.target.value);
                d.setHours(0,0,0,0);
                setStart(d.toISOString());
              }} className="border rounded px-2 py-1 mr-2" />
              <input type="date" value={end.slice(0,10)} onChange={(e)=>{
                const d = new Date(e.target.value);
                d.setHours(23,59,59,999);
                setEnd(d.toISOString());
              }} className="border rounded px-2 py-1" />
            </span>
          )}
        </div>
        <div className="text-sm text-gray-500">Período selecionado: {new Date(start).toLocaleDateString()} — {new Date(end).toLocaleDateString()}</div>
      </div>

      {/* KPIs Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-500 text-sm font-medium">Receita Total</h3>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FaDollarSign className="w-5 h-5 text-gray-700" />
            </div>
          </div>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
          <p className="text-sm text-gray-500 mt-2">Gerada pela equipe</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-500 text-sm font-medium">Ticket Médio/Garçom</h3>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaChartBar className="w-5 h-5 text-gray-700" />
            </div>
          </div>
          <p className="text-3xl font-bold text-blue-600">{formatCurrency(avgRevenuePerWaiter)}</p>
          <p className="text-sm text-gray-500 mt-2">Por profissional</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-500 text-sm font-medium">Comandas/Garçom</h3>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <FaClipboardList className="w-5 h-5 text-gray-700" />
            </div>
          </div>
          <p className="text-3xl font-bold text-purple-600">{avgTablesPerWaiter.toFixed(1)}</p>
          <p className="text-sm text-gray-500 mt-2">Média de atendimento</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-500 text-sm font-medium">Tempo Médio Entrega</h3>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <FaChartBar className="w-5 h-5 text-gray-700" />
            </div>
          </div>
          <p className="text-3xl font-bold text-yellow-600">{summaryData && typeof summaryData.avgDeliverySeconds === 'number' ? `${Math.round(summaryData.avgDeliverySeconds/60)}m` : '—'}</p>
          <p className="text-sm text-gray-500 mt-2">Média até entrega</p>
        </div>
      </div>

      {/* Gráfico e Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Receita Top 10 */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-4">Top 10 por Receita</h2>
            <BarChart 
              data={chartData} 
              dataKey="receita" 
              xKey="name" 
              title=""
              color="#4F46E5"
            />
          </div>
        )}

        {/* Tabela de Ranking */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4">Ranking Completo</h2>
          {Array.isArray(data) && data.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Posição</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Nome</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Comandas</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Receita</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((w: any, idx: number) => (
                    <tr key={w.waiter_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                          idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-500' : 'bg-blue-500'
                        }`}>
                          {idx + 1}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        <Link to={`/dashboard/waiters/${w.waiter_id}`} className="text-indigo-600 hover:underline">{w.waiter_name}</Link>
                      </td>
                      <td className="text-right py-3 px-4 text-gray-700">{w.tables_served}</td>
                      <td className="text-right py-3 px-4 font-semibold text-green-600">
                      {formatCurrency(Number(w.revenue || 0))}
                    </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">Nenhum dado disponível</div>
          )}
        </div>
      </div>

      {/* Dica */}
      <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
        <p className="text-sm text-indigo-800">
          <strong><FaLightbulb className="inline-block mr-2 w-4 h-4 text-indigo-700" />Análise:</strong> Compare o desempenho individual com as médias da equipe. 
          Garçons com ticket médio acima de {formatCurrency(avgRevenuePerWaiter)} estão performando acima da média.
        </p>
      </div>
    </div>
  );
}
