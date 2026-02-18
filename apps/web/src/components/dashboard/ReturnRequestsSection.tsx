import { useMemo, useState } from 'react';
import { useReturnRequest } from '../../hooks/useReturnRequest';
import ReturnRequestDetailModal from '../ReturnRequestDetailModal';
import { RETURN_REQUEST_STATUS_LABELS, RETURN_CATEGORY_LABELS } from '@resbar/shared';

export default function ReturnRequestsSection() {
  const { useReturnRequests, updateReturnRequest } = useReturnRequest();
  const q = useReturnRequests();
  const list = q.data || [];

  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return list.filter((r: any) => {
      if (filterStatus !== 'ALL' && r.status !== filterStatus) return false;
      if (filterCategory && r.category !== filterCategory) return false;
      if (query) {
        const ql = query.toLowerCase();
        if (!(
          (r.order?.menuItem?.name || '').toLowerCase().includes(ql) ||
          (r.order?.tab?.person?.name || '').toLowerCase().includes(ql) ||
          (String(r.orderId || '')).toLowerCase().includes(ql)
        )) return false;
      }
      return true;
    });
  }, [list, filterStatus, filterCategory, query]);

  const handleChangeStatus = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm(`Confirmar ${status === 'APPROVED' ? 'aprovação' : 'rejeição'} desta solicitação?`)) return;
    try {
      await updateReturnRequest.mutateAsync({ id, data: { status } as any });
      alert('Status atualizado');
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar status');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
      <div className="px-6 py-4 border-b border-slate-200 font-semibold text-slate-900">Solicitações de Devolução</div>
      <div className="p-4 space-y-4">
        <div className="flex gap-3">
          <select className="rounded-md border px-3 py-2" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}>
            <option value="ALL">Todos os status</option>
            <option value="PENDING">Em aberto</option>
            <option value="APPROVED">Aprovadas</option>
            <option value="REJECTED">Rejeitadas</option>
          </select>
          <select className="rounded-md border px-3 py-2" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">Todas as categorias</option>
            {Object.entries(RETURN_CATEGORY_LABELS).map(([k, label]) => (
              <option key={k} value={k}>{label as string}</option>
            ))}
          </select>
          <input placeholder="Buscar por pedido, item ou pessoa" className="flex-1 rounded-md border px-3 py-2" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-slate-500 bg-slate-50">
              <tr>
                <th className="px-4 py-3">Criado</th>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Pessoa</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r: any) => (
                <tr key={r.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3">{new Date(r.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3">{r.order?.menuItem?.name || r.orderId}</td>
                    <td className="px-4 py-3">{r.order?.tab?.person?.name || '-'}</td>
                    <td className="px-4 py-3">
                      {(() => {
                        if (r.sourceType === 'MESA') return `Mesa ${r.sourceId}`;
                        if (r.sourceType === 'COMANDA') return `Comanda ${r.sourceId || ''}`;
                        // fallback to relations
                        if (r.order?.tab?.table?.number) return `Mesa ${r.order.tab.table.number}`;
                        if (r.order?.tab?.id) return `Comanda ${r.order.tab.id}`;
                        return '-';
                      })()}
                    </td>
                    <td className="px-4 py-3">{(RETURN_CATEGORY_LABELS as any)[r.category] || r.category}</td>
                    <td className="px-4 py-3">{(RETURN_REQUEST_STATUS_LABELS as any)[r.status] || r.status}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setSelectedId(r.id)} className="text-sm text-blue-600 hover:underline">Ver</button>
                        {r.status === 'PENDING' && (
                          <>
                            <button onClick={() => handleChangeStatus(r.id, 'APPROVED')} className="text-sm px-2 py-1 bg-green-600 text-white rounded">Aprovar</button>
                            <button onClick={() => handleChangeStatus(r.id, 'REJECTED')} className="text-sm px-2 py-1 bg-red-600 text-white rounded">Rejeitar</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">Nenhuma solicitação encontrada</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedId && (
        <ReturnRequestDetailModal id={selectedId} onClose={() => setSelectedId(null)} onStatusChange={() => { setSelectedId(null); }} />
      )}
    </div>
  );
}
