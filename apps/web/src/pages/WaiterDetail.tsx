import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useMetrics from '../hooks/useMetrics';
import formatCurrency from '../lib/formatCurrency';

export default function WaiterDetail() {
  const { id } = useParams();
  const { useWaiterDetail } = useMetrics();

  // Period selector state (default: last 30 days to show historical data)
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

  const [tabIdFilter, setTabIdFilter] = useState<string>('');

  const { data, isLoading, error } = useWaiterDetail(id, { start, end });

  if (isLoading) return <div className="p-6">Carregando detalhes do garçom...</div>;
  if (error) return <div className="p-6 text-red-600">Erro ao carregar dados.</div>;
  if (!data) return <div className="p-6">Nenhum dado disponível.</div>;

  const {
    waiterName,
    revenue,
    closedCount,
    avgTicket,
    totalServiceCharge,
    avgDeliverySeconds,
    avgToPaySeconds,
    recentTabs,
    avgAssignmentSeconds,
    assignmentsCount,
  } = data as any;

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{waiterName || 'Detalhes do Garçom'}</h1>
          <p className="text-sm text-gray-500">ID: {id}</p>
        </div>
        <div>
          <Link to="/dashboard/waiters" className="text-indigo-600 hover:underline">Voltar</Link>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex items-center justify-between mb-4 bg-white p-4 rounded-xl shadow-sm border">
        <div>
          <label className="text-sm text-gray-600 mr-2">Período:</label>
          <select value={period} onChange={(e) => setPeriod(e.target.value as any)} className="border rounded px-2 py-1">
            <option value="day">Hoje</option>
            <option value="week">Últimos 7 dias</option>
            <option value="month">Últimos 30 dias</option>
            <option value="custom">Personalizado</option>
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
        <div className="text-sm text-gray-500">
          {new Date(start).toLocaleDateString('pt-BR')} — {new Date(end).toLocaleDateString('pt-BR')}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="text-sm text-gray-500">Receita no Período</div>
          <div className="text-xl font-semibold">{formatCurrency(revenue)}</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="text-sm text-gray-500">Comandas Fechadas</div>
          <div className="text-xl font-semibold">{closedCount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="text-sm text-gray-500">Ticket Médio</div>
          <div className="text-xl font-semibold">{formatCurrency(avgTicket)}</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="text-sm text-gray-500">Taxa de Serviço Arrecadada (10%)</div>
          <div className="text-xl font-semibold">{formatCurrency(totalServiceCharge || 0)}</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="text-sm text-gray-500">Tempo Médio até Entrega</div>
          <div className="text-xl font-semibold">{avgDeliverySeconds ? Math.round(avgDeliverySeconds/60) + 'm' : '—'}</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="text-sm text-gray-500">Tempo Médio até Pagamento</div>
          <div className="text-xl font-semibold">{avgToPaySeconds ? Math.round(avgToPaySeconds/60) + 'm' : '—'}</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="text-sm text-gray-500">Duração Média de Responsabilidade</div>
          <div className="text-xl font-semibold">{avgAssignmentSeconds ? Math.round(avgAssignmentSeconds/60) + 'm' : '—'}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="text-sm text-gray-500">Total de Atribuições</div>
          <div className="text-xl font-semibold">{assignmentsCount ?? 0}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4">
        <h2 className="text-lg font-semibold mb-3">Comandas Recentes</h2>
        <div className="mb-3 flex items-center gap-3">
          <label className="text-sm text-gray-600">Filtrar por ID:</label>
          <input value={tabIdFilter} onChange={(e) => setTabIdFilter(e.target.value)} placeholder="Cole ou digite parte do ID" className="border rounded px-2 py-1 text-sm w-72" />
          <button onClick={() => setTabIdFilter('')} className="text-sm text-blue-600">Limpar</button>
        </div>
        {Array.isArray(recentTabs) && recentTabs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-2 px-3">ID</th>
                  <th className="text-left py-2 px-3">Criada</th>
                  <th className="text-left py-2 px-3">Paga</th>
                  <th className="text-right py-2 px-3">Total</th>
                  <th className="text-right py-2 px-3">Pago</th>
                  <th className="text-right py-2 px-3">10%</th>
                </tr>
              </thead>
              <tbody>
                {recentTabs.filter((t: any) => {
                  if (!tabIdFilter) return true;
                  return t.id.toLowerCase().includes(tabIdFilter.toLowerCase());
                }).map((t: any) => (
                  <tr key={t.id} className="border-t">
                    <td className="py-2 px-3 font-mono text-xs">{t.id}</td>
                    <td className="py-2 px-3">{t.createdAt ? new Date(t.createdAt).toLocaleString() : '—'}</td>
                    <td className="py-2 px-3">{t.paidAt ? new Date(t.paidAt).toLocaleString() : '—'}</td>
                    <td className="py-2 px-3 text-right">{formatCurrency(Number(t.total || 0))}</td>
                    <td className="py-2 px-3 text-right">{t.paidAmount ? formatCurrency(Number(t.paidAmount)) : '—'}</td>
                    <td className="py-2 px-3 text-right">{formatCurrency(Number(t.serviceChargeAmount || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-gray-500">Nenhuma comanda recente encontrada.</div>
        )}
      </div>
    </div>
  );
}
