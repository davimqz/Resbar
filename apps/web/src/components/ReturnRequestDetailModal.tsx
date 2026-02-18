import { useReturnRequest } from '../hooks/useReturnRequest';
import { RETURN_CATEGORY_LABELS } from '@resbar/shared';

export default function ReturnRequestDetailModal({ id, onClose, onStatusChange }: { id: string; onClose: () => void; onStatusChange?: () => void }) {
  const { useReturnRequestById, updateReturnRequest } = useReturnRequest();
  const q = useReturnRequestById(id);
  const r = q.data;

  if (!r) return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40">
      <div className="bg-white p-6 rounded">Carregando...</div>
    </div>
  );

  const handle = async (status: 'APPROVED' | 'REJECTED') => {
    try {
      await updateReturnRequest.mutateAsync({ id, data: { status } as any });
      if (onStatusChange) onStatusChange();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Erro');
    }
  };

  // Prefer normalized source fields when available
  const getSourceDisplay = () => {
    if (r.sourceType === 'MESA') return `Mesa ${r.sourceId}`;
    if (r.sourceType === 'COMANDA') return `Comanda ${r.sourceId || ''}`;
    // fallback to relations
    if (r.order?.tab?.table?.number) return `Mesa ${r.order.tab.table.number}`;
    if (r.order?.tab?.id) return `Comanda ${r.order.tab.id}`;
    return '-';
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-white rounded-lg shadow-lg w-[90%] max-w-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Detalhes da Solicitação</h3>
          <button onClick={onClose} className="text-slate-500">Fechar</button>
        </div>

        <div className="space-y-3">
          <div><strong>Criada:</strong> {new Date(r.createdAt).toLocaleString()}</div>
          <div><strong>Item:</strong> {r.order?.menuItem?.name || '-'}</div>
          <div><strong>Pessoa:</strong> {r.order?.tab?.person?.name || '-'}</div>
          <div><strong>Tipo:</strong> {getSourceDisplay()}</div>
          <div><strong>Categoria:</strong> {(RETURN_CATEGORY_LABELS as any)[r.category] || r.category}</div>
          <div>
            <strong>Descrição:</strong>
            <div className="mt-1 p-2 border rounded bg-slate-50">{r.description || '-'}</div>
          </div>
          {r.imageUrl && <div>
            <strong>Imagem:</strong>
            <div className="mt-2">
              <img src={r.imageUrl} alt="evidencia" className="max-h-56 object-contain rounded" />
            </div>
          </div>}
        </div>

        <div className="mt-6 flex gap-2 justify-end">
          {r.status === 'PENDING' && (
            <>
              <button onClick={() => handle('REJECTED')} className="px-3 py-1 bg-red-600 text-white rounded">Rejeitar</button>
              <button onClick={() => handle('APPROVED')} className="px-3 py-1 bg-green-600 text-white rounded">Aprovar</button>
            </>
          )}
          <button onClick={onClose} className="px-3 py-1 border rounded">Fechar</button>
        </div>
      </div>
    </div>
  );
}
