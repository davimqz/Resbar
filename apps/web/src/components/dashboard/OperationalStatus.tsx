interface StatusDistribution {
  status: string;
  count: number;
  percentage: number;
}

interface OperationalStatusProps {
  orderStatusDistribution: StatusDistribution[];
  tabStatusDistribution: StatusDistribution[];
}

export default function OperationalStatus({ orderStatusDistribution, tabStatusDistribution }: OperationalStatusProps) {
  const getOrderStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'Pendente',
      PREPARING: 'Em Preparo',
      READY: 'Pronto',
      DELIVERED: 'Entregue',
      CANCELLED: 'Cancelado'
    };
    return labels[status] || status;
  };

  const getTabStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      OPEN: 'Aberta',
      CLOSED: 'Fechada',
      CANCELLED: 'Cancelada'
    };
    return labels[status] || status;
  };

  


  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Status dos Pedidos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold mb-4">📦 Status dos Pedidos</h3>
        
        {orderStatusDistribution.length > 0 ? (
          <div className="space-y-3">
            {orderStatusDistribution.map((item, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {getOrderStatusLabel(item.status)}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {item.count} ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`absolute left-0 top-0 h-full rounded-full transition-all ${
                      item.status === 'DELIVERED' ? 'bg-green-500' :
                      item.status === 'PREPARING' ? 'bg-blue-500' :
                      item.status === 'READY' ? 'bg-orange-500' :
                      item.status === 'PENDING' ? 'bg-yellow-500' :
                      'bg-gray-400'
                    }`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">Sem dados de status de pedidos</div>
        )}

        {/* Resumo */}
        {orderStatusDistribution.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Total de Pedidos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {orderStatusDistribution.reduce((sum, item) => sum + item.count, 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Taxa de Conclusão</p>
                <p className="text-2xl font-bold text-green-600">
                  {(() => {
                    const delivered = orderStatusDistribution.find(s => s.status === 'DELIVERED');
                    return delivered ? `${delivered.percentage.toFixed(0)}%` : '0%';
                  })()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status das Comandas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold mb-4">🧾 Status das Comandas</h3>
        
        {tabStatusDistribution.length > 0 ? (
          <div className="space-y-3">
            {tabStatusDistribution.map((item, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {getTabStatusLabel(item.status)}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {item.count} ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`absolute left-0 top-0 h-full rounded-full transition-all ${
                      item.status === 'CLOSED' ? 'bg-green-500' :
                      item.status === 'OPEN' ? 'bg-blue-500' :
                      'bg-gray-400'
                    }`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">Sem dados de status de comandas</div>
        )}

        {/* Resumo */}
        {tabStatusDistribution.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Total de Comandas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tabStatusDistribution.reduce((sum, item) => sum + item.count, 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Comandas Abertas</p>
                <p className="text-2xl font-bold text-blue-600">
                  {(() => {
                    const open = tabStatusDistribution.find(s => s.status === 'OPEN');
                    return open ? open.count : 0;
                  })()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
