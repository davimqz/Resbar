import useMetrics from '../hooks/useMetrics';

export default function DashboardKitchen() {
  const { useKitchen } = useMetrics();
  const { data, isLoading } = useKitchen({ slaMinutes: 12 });

  if (isLoading) return <div>Carregando cozinha...</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Cozinha</h1>
        <p className="text-gray-500 mt-1">Fluxo e performance da cozinha</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {data ? (
          <div>
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600">Tempo médio de preparo</div>
              <div className="text-3xl font-bold text-blue-600 mt-1">
                {data.avgPrepMinutes ? `${data.avgPrepMinutes.toFixed(1)} min` : '—'}
              </div>
            </div>
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">Contagem por status</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {data.statusCounts?.map((s: any) => (
                  <div key={s.status} className="p-3 border border-gray-100 rounded-lg">
                    <div className="text-xs text-gray-500">{s.status}</div>
                    <div className="text-2xl font-bold text-gray-900">{s.count}</div>
                  </div>
                ))}
              </div>
            </div>

            <h3 className="font-semibold text-gray-700 mb-3">Pedidos atrasados</h3>
            {data.delayed && data.delayed.length > 0 ? (
              <div className="space-y-3">
                {data.delayed.map((d: any) => (
                  <div key={d.id} className="p-4 border border-red-100 bg-red-50 rounded-lg">
                    <div className="font-medium">Pedido: {d.id}</div>
                    <div className="text-sm text-gray-600">Tab: {d.tabId}</div>
                    <div className="text-sm text-gray-600">Iniciado: {d.startedPreparingAt ? new Date(d.startedPreparingAt).toLocaleTimeString() : '-'}</div>
                    <div className="text-sm font-medium text-red-600">⏱ {Math.round(d.secondsSinceStart)}s desde início</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">Nenhum atraso identificado ✅</div>
            )}
          </div>
        ) : (
          <div className="text-gray-500">Sem dados</div>
        )}
      </div>
    </div>
  );
}
