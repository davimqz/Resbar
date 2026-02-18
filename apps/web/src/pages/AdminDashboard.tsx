import React from 'react';
import ReturnRequestsSection from '../components/dashboard/ReturnRequestsSection';

const MetricCard = ({ title, value, icon }: { title: string; value: string; icon?: React.ReactNode }) => (
  <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-200">
    <div className="flex justify-between items-start">
      <div>
        <div className="text-sm text-slate-500 font-medium">{title}</div>
        <div className="text-2xl font-semibold text-slate-900 mt-2">{value}</div>
      </div>
      <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">{icon}</div>
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: 'active' | 'pending' | 'cancelled' }) => {
  if (status === 'active') return <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">Ativo</span>;
  if (status === 'pending') return <span className="bg-yellow-100 text-yellow-700 text-xs font-medium px-2 py-1 rounded-full">Pendente</span>;
  return <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-1 rounded-full">Cancelado</span>;
};

export default function AdminDashboard() {
  const metrics = [
    { title: 'Receita (hoje)', value: 'R$ 8.420' },
    { title: 'Pedidos (hoje)', value: '128' },
    { title: 'Mesas abertas', value: '12' },
    { title: 'Tempo médio (min)', value: '23' },
  ];

  const orders = [
    { id: '#1001', customer: 'Ana Silva', total: 'R$ 68,50', status: 'active' },
    { id: '#1002', customer: 'Carlos Lima', total: 'R$ 34,00', status: 'pending' },
    { id: '#1003', customer: 'Marina Souza', total: 'R$ 120,00', status: 'cancelled' },
    { id: '#1004', customer: 'Pedro Alves', total: 'R$ 52,90', status: 'active' },
  ];

  return (
    <div className="bg-slate-50">
      {/* Header: keep header inside page content (Outlet will include top layout) */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Visão geral</h1>
          <div className="text-sm text-slate-500">Resumo das operações e financeira</div>
        </div>
        <div className="flex items-center gap-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">Ações</button>
          <img src="https://i.pravatar.cc/36" alt="avatar" className="w-9 h-9 rounded-full" />
        </div>
      </header>

      {/* Main content */}
      <main className="p-8 bg-slate-50 min-h-screen">
        <div className="grid gap-6">
          {/* Metrics row */}
          <div className="grid grid-cols-4 gap-6">
            {metrics.map((m) => (
              <MetricCard key={m.title} title={m.title} value={m.value} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600"><path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round"/></svg>} />
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 h-80">
              <div className="text-sm text-slate-500 font-medium">Receita - últimos 30 dias</div>
              <div className="mt-4 h-64 bg-slate-50 rounded-md flex items-center justify-center text-slate-400">[Gráfico placeholder]</div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 h-80">
              <div className="text-sm text-slate-500 font-medium">Top itens vendidos</div>
              <div className="mt-4 h-64 bg-slate-50 rounded-md flex items-center justify-center text-slate-400">[Gráfico pequeno]</div>
            </div>
          </div>

          {/* Orders table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 font-semibold text-slate-900">Pedidos recentes</div>
            <div className="p-4">
              <table className="w-full text-sm text-left">
                <thead className="text-slate-500 bg-slate-50">
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4">{o.id}</td>
                      <td className="px-6 py-4">{o.customer}</td>
                      <td className="px-6 py-4">{o.total}</td>
                      <td className="px-6 py-4"><StatusBadge status={o.status as any} /></td>
                      <td className="px-6 py-4"><button className="text-sm text-blue-600 hover:underline">Ver</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Return requests section */}
          <div className="grid grid-cols-1 gap-6">
            <ReturnRequestsSection />
          </div>
        </div>
      </main>
    </div>
  );
}
