import useMetrics from '../hooks/useMetrics';

export default function DashboardFinance() {
  const { useRevenue } = useMetrics();
  const { data: buckets, isLoading } = useRevenue({ groupBy: 'hour' });

  if (isLoading) return <div>Carregando financeiro...</div>;

  const total = Array.isArray(buckets) ? buckets.reduce((s: any, b: any) => s + (b.revenue || 0), 0) : 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Financeiro</h1>
        <p className="text-gray-500 mt-1">Acompanhe receitas e análise financeira</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="mb-6">
          <div className="text-sm text-gray-500">Receita Total (Período)</div>
          <div className="text-4xl font-bold text-green-600 mt-2">R$ {total.toFixed(2)}</div>
        </div>
        <div className="space-y-2">
          {Array.isArray(buckets) && buckets.length > 0 ? (
            buckets.map((b: any) => (
              <div key={b.bucket} className="flex justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <span className="text-sm text-gray-600">{new Date(b.bucket).toLocaleString()}</span>
                <span className="font-medium text-gray-900">R$ {(b.revenue || 0).toFixed(2)}</span>
              </div>
            ))
          ) : (
            <div className="text-gray-500 text-center py-8">Sem dados de receita no período</div>
          )}
        </div>
      </div>
    </div>
  );
}
