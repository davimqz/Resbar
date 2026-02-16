interface StatusItem {
  status: string;
  count: number;
  percentage: number;
}

interface KitchenStatusProps {
  status: StatusItem[];
}

export default function KitchenStatus({ status }: KitchenStatusProps) {
  if (!status || status.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold mb-4">📊 Status dos Pedidos</h3>
        <div className="text-center py-8 text-gray-400">Sem dados de status no momento</div>
      </div>
    );
  }

  const getStatusConfig = (statusName: string) => {
    const name = statusName.toLowerCase();
    
    if (name.includes('pendente') || name === 'pending') {
      return {
        label: 'Pendente',
        color: 'bg-yellow-500',
        lightBg: 'bg-yellow-50',
        text: 'text-yellow-700',
        icon: '⏳'
      };
    }
    if (name.includes('preparo') || name === 'preparing' || name.includes('kitchen')) {
      return {
        label: 'Em Preparo',
        color: 'bg-blue-500',
        lightBg: 'bg-blue-50',
        text: 'text-blue-700',
        icon: '👨‍🍳'
      };
    }
    if (name.includes('pronto') || name === 'ready') {
      return {
        label: 'Pronto',
        color: 'bg-green-500',
        lightBg: 'bg-green-50',
        text: 'text-green-700',
        icon: '✅'
      };
    }
    if (name.includes('entregue') || name === 'delivered' || name === 'served') {
      return {
        label: 'Entregue',
        color: 'bg-emerald-500',
        lightBg: 'bg-emerald-50',
        text: 'text-emerald-700',
        icon: '🍽'
      };
    }
    if (name.includes('cancelado') || name === 'cancelled') {
      return {
        label: 'Cancelado',
        color: 'bg-red-500',
        lightBg: 'bg-red-50',
        text: 'text-red-700',
        icon: '❌'
      };
    }
    
    return {
      label: statusName,
      color: 'bg-gray-500',
      lightBg: 'bg-gray-50',
      text: 'text-gray-700',
      icon: '📋'
    };
  };

  const totalOrders = status.reduce((sum, s) => sum + s.count, 0);
  
  // Encontrar status predominante
  const dominantStatus = [...status].sort((a, b) => b.count - a.count)[0];
  const dominantConfig = getStatusConfig(dominantStatus.status);

  // Status ativos (pedidos na cozinha ou pendentes)
  const activeStatuses = status.filter(s => {
    const name = s.status.toLowerCase();
    return name.includes('pendente') || name.includes('preparo') || name.includes('kitchen') || 
           name === 'pending' || name === 'preparing';
  });
  const activeCount = activeStatuses.reduce((sum, s) => sum + s.count, 0);
  const activePct = totalOrders > 0 ? (activeCount / totalOrders * 100) : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold mb-4">📊 Distribuição de Status</h3>

      {/* Resumo Rápido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
          <div className="text-sm font-medium text-blue-800 mb-1">📦 Total de Pedidos</div>
          <div className="text-2xl font-bold text-blue-900">{totalOrders}</div>
          <div className="text-xs text-blue-700 mt-1">no período selecionado</div>
        </div>

        <div className={`p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg ${
          activePct > 50 ? 'ring-2 ring-orange-300' : ''
        }`}>
          <div className="text-sm font-medium text-orange-800 mb-1">🔥 Pedidos Ativos</div>
          <div className="text-2xl font-bold text-orange-900">{activeCount}</div>
          <div className="text-xs text-orange-700 mt-1">{activePct.toFixed(0)}% do total</div>
        </div>

        <div className={`p-4 bg-gradient-to-br ${dominantConfig.lightBg} to-gray-100 rounded-lg`}>
          <div className={`text-sm font-medium ${dominantConfig.text} mb-1`}>
            {dominantConfig.icon} Status Predominante
          </div>
          <div className={`text-2xl font-bold ${dominantConfig.text}`}>{dominantConfig.label}</div>
          <div className={`text-xs ${dominantConfig.text} opacity-75 mt-1`}>
            {dominantStatus.percentage.toFixed(0)}% dos pedidos
          </div>
        </div>
      </div>

      {/* Distribuição Visual */}
      <div className="space-y-3">
        {status.map((item, idx) => {
          const config = getStatusConfig(item.status);
          const isActive = item.status.toLowerCase().includes('pendente') || 
                          item.status.toLowerCase().includes('preparo') ||
                          item.status.toLowerCase().includes('kitchen') ||
                          item.status === 'pending' || 
                          item.status === 'preparing';
          
          return (
            <div key={idx} className={`${config.lightBg} rounded-lg p-4`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{config.icon}</span>
                  <span className={`font-semibold ${config.text}`}>{config.label}</span>
                  {isActive && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      ATIVO
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${config.text}`}>{item.count}</div>
                  <div className={`text-xs ${config.text} opacity-75`}>
                    {item.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
              
              {/* Barra de Progresso */}
              <div className="relative pt-1">
                <div className="overflow-hidden h-2 text-xs flex rounded-full bg-gray-200">
                  <div
                    style={{ width: `${item.percentage}%` }}
                    className={`${config.color} shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500`}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Insights */}
      {activePct > 60 && (
        <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-lg flex-shrink-0">⚠️</span>
            <div className="text-sm text-orange-800">
              <strong>Alta carga de trabalho:</strong> {activePct.toFixed(0)}% dos pedidos estão ativos 
              (pendentes ou em preparo). Considere aumentar a capacidade da cozinha.
            </div>
          </div>
        </div>
      )}

      {activePct < 20 && totalOrders > 10 && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-lg flex-shrink-0">✅</span>
            <div className="text-sm text-green-800">
              <strong>Operação fluida:</strong> Apenas {activePct.toFixed(0)}% dos pedidos estão ativos. 
              A cozinha está processando pedidos com eficiência.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
