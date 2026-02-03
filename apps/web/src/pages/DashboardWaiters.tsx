import useMetrics from '../hooks/useMetrics';

export default function DashboardWaiters() {
  const { useWaitersRanking } = useMetrics();
  const { data, isLoading } = useWaitersRanking();

  if (isLoading) return <div className="p-6">Carregando...</div>;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Garçons</h2>
        <p className="text-gray-600 mt-2">Desempenho e ranking da equipe</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-700 mb-4">Ranking de desempenho</h3>
        {Array.isArray(data) && data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Garçom</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Comandas</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Receita</th>
                </tr>
              </thead>
              <tbody>
                {data.map((w: any, idx: number) => (
                  <tr key={w.waiter_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                          idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-500' : 'bg-blue-500'
                        }`}>
                          {idx + 1}
                        </div>
                        <span className="font-medium text-gray-900">{w.waiter_name}</span>
                      </div>
                    </td>
                    <td className="text-right py-4 px-4 text-gray-700">{w.tables_served}</td>
                    <td className="text-right py-4 px-4 font-semibold text-green-600">
                      R$ {Number(w.revenue || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">Nenhum dado de garçons</div>
        )}
      </div>
    </div>
  );
}
