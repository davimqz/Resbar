import useMetrics from '../hooks/useMetrics';

export default function DashboardOperations() {
  const { useOverview } = useMetrics();
  const { data, isLoading } = useOverview();

  if (isLoading) return <div>Carregando operação...</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Operação</h1>
        <p className="text-gray-500 mt-1">Métricas operacionais em tempo real</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {data ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 border border-gray-100 rounded-xl hover:shadow-md transition-shadow">
              <div className="text-sm text-gray-500 mb-2">Mesas Ocupadas</div>
              <div className="text-4xl font-bold text-blue-600">{data.tablesOccupied}</div>
            </div>
            <div className="p-6 border border-gray-100 rounded-xl hover:shadow-md transition-shadow">
              <div className="text-sm text-gray-500 mb-2">Comandas Abertas</div>
              <div className="text-4xl font-bold text-purple-600">{data.openTabs}</div>
            </div>
            <div className="p-6 border border-gray-100 rounded-xl hover:shadow-md transition-shadow">
              <div className="text-sm text-gray-500 mb-2">Clientes Ativos</div>
              <div className="text-4xl font-bold text-green-600">{data.activeCustomers}</div>
            </div>
          </div>
        ) : (
          <div className="text-gray-500">Sem dados</div>
        )}
      </div>
    </div>
  );
}
