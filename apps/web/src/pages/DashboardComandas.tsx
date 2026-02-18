import { useState, useMemo } from 'react';
import { useTab } from '../hooks/useTab';
import { useWaiter } from '../hooks/useWaiter';
import { TabStatus } from '@resbar/shared';
import formatCurrency from '../lib/formatCurrency';

export default function DashboardComandas() {
  const { useTabs } = useTab();
  const { useWaiters } = useWaiter();

  const tabsQ = useTabs();
  const waitersQ = useWaiters();

  const [waiterId, setWaiterId] = useState<string | 'all'>('all');
  const [tabIdFilter, setTabIdFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string | 'all'>('all');
  // Applied filters (only updated when user clicks Search)
  const [appliedWaiterId, setAppliedWaiterId] = useState<string | 'all'>('all');
  const [appliedTabId, setAppliedTabId] = useState<string>('');
  const [appliedStatus, setAppliedStatus] = useState<string | 'all'>('all');
  const [appliedStart, setAppliedStart] = useState<string>('');
  const [appliedEnd, setAppliedEnd] = useState<string>('');
  const [expanded, setExpanded] = useState<boolean>(false);
  const [start, setStart] = useState<string>('');
  const [end, setEnd] = useState<string>('');

  const tabs = tabsQ.data || [];
  const waiters = waitersQ.data || [];

  const filtered = useMemo(() => {
    return tabs.filter((tab: any) => {
      // Filter by tab id (substring)
      if (appliedTabId) {
        if (!tab.id.toLowerCase().includes(appliedTabId.toLowerCase())) return false;
      }
      // Filter by waiter
      if (appliedWaiterId !== 'all') {
        const has = (tab.waiterHistory || []).some((h: any) => h.waiter?.id === appliedWaiterId);
        if (!has) return false;
      }

      // Filter by date range (createdAt)
      if (appliedStart) {
        const s = new Date(appliedStart);
        const created = new Date(tab.createdAt);
        if (created < s) return false;
      }
      if (appliedEnd) {
        const e = new Date(appliedEnd);
        // include whole day
        e.setHours(23, 59, 59, 999);
        const created = new Date(tab.createdAt);
        if (created > e) return false;
      }

      // Filter by status
      if (appliedStatus !== 'all' && tab.status !== appliedStatus) return false;

      return true;
    });
  }, [tabs, appliedWaiterId, appliedStart, appliedEnd, appliedTabId, appliedStatus]);

  const visibleTabs = useMemo(() => {
    if (expanded) return filtered;
    return filtered.slice(0, 50);
  }, [filtered, expanded]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Comandas</h1>
        <p className="text-sm text-gray-500">Lista de todas as comandas geradas. Filtre por garçom e período.</p>
      </div>

      <div className="bg-white rounded-xl p-4 mb-6 border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Buscar por ID</label>
            <input value={tabIdFilter} onChange={(e) => setTabIdFilter(e.target.value)} placeholder="ID da comanda" className="border rounded p-2 text-sm w-60" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Garçom</label>
            <select
              value={waiterId}
              onChange={(e) => setWaiterId(e.target.value as any)}
              className="border rounded p-2 text-sm w-60"
            >
              <option value="all">Todos</option>
              {waiters.map((w: any) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="border rounded p-2 text-sm w-40"
            >
              <option value="all">Todas</option>
              <option value={TabStatus.OPEN}>Aberta</option>
              <option value={TabStatus.CLOSED}>Fechada</option>
              <option value={TabStatus.CANCELLED}>Cancelada</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Início</label>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="border rounded p-2 text-sm" />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Fim</label>
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="border rounded p-2 text-sm" />
          </div>

          <div className="flex items-end">
            <div className="flex gap-3 items-center">
              <button
                onClick={() => {
                  // apply current inputs as active filters
                  setAppliedWaiterId(waiterId);
                  setAppliedTabId(tabIdFilter);
                  setAppliedStatus(statusFilter);
                  setAppliedStart(start);
                  setAppliedEnd(end);
                }}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded text-sm hover:bg-indigo-700"
              >
                {/* Magnifying glass icon */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
                </svg>
                <span>Pesquisar</span>
              </button>

              <button onClick={() => { setWaiterId('all'); setStart(''); setEnd(''); setTabIdFilter(''); setStatusFilter('all'); setAppliedWaiterId('all'); setAppliedStart(''); setAppliedEnd(''); setAppliedTabId(''); setAppliedStatus('all'); }} className="text-sm text-blue-600">Limpar</button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-100">
        {tabsQ.isLoading ? (
          <div>Carregando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 px-3">ID</th>
                  <th className="py-2 px-3">Garçom</th>
                  <th className="py-2 px-3">Pessoa</th>
                  <th className="py-2 px-3">Mesa</th>
                  <th className="py-2 px-3 text-right">Total</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Criada em</th>
                  <th className="py-2 px-3">Pago em</th>
                </tr>
              </thead>
              <tbody>
                {visibleTabs.map((tab: any) => {
                  const lastHistory = (tab.waiterHistory || []).slice().sort((a: any, b: any) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime())[0];
                  const waiterName = lastHistory?.waiter?.name || '-';
                  return (
                    <tr key={tab.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3">{tab.id.slice(0,8)}</td>
                      <td className="py-2 px-3 font-medium">{waiterName}</td>
                      <td className="py-2 px-3">{tab.person?.name || '—'}</td>
                      <td className="py-2 px-3">{tab.table?.number ?? '—'}</td>
                      <td className="py-2 px-3 text-right font-bold">{formatCurrency(tab.total)}</td>
                      <td className="py-2 px-3">{tab.status}</td>
                      <td className="py-2 px-3">{new Date(tab.createdAt).toLocaleString()}</td>
                      <td className="py-2 px-3">{tab.paidAt ? new Date(tab.paidAt).toLocaleString() : '—'}</td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-500">Nenhuma comanda encontrada</td>
                  </tr>
                )}
              </tbody>
            </table>
            {filtered.length > 50 && (
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-center">
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  {expanded ? 'Mostrar menos' : `Exibir mais (${filtered.length - 50} restantes)`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
