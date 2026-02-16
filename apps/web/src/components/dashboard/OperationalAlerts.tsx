interface Alert {
  type: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
  value?: number;
  count?: number;
  tables?: Array<{ tabId: string; tableNumber: number; minutesOpen: number }>;
  threshold?: number;
  waiter?: string;
}

interface OperationalAlertsProps {
  alerts: Alert[];
}

export default function OperationalAlerts({ alerts }: OperationalAlertsProps) {
  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold mb-4">🚨 Alertas Operacionais</h3>
        <div className="text-center py-12">
          <div className="text-5xl mb-4">✅</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">Tudo OK!</h4>
          <p className="text-sm text-gray-600">Nenhum alerta operacional no momento</p>
        </div>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'medium':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'low':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return '🚨';
      case 'medium':
        return '⚠️';
      case 'low':
        return '💡';
      default:
        return 'ℹ️';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'CRÍTICO';
      case 'medium':
        return 'ATENÇÃO';
      case 'low':
        return 'INFORMATIVO';
      default:
        return 'INFO';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">🚨 Alertas Operacionais</h3>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          {alerts.length} {alerts.length === 1 ? 'alerta' : 'alertas'}
        </span>
      </div>

      <div className="space-y-4">
        {alerts.map((alert, idx) => (
          <div
            key={idx}
            className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <span className="text-2xl">{getSeverityIcon(alert.severity)}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase">
                      {getSeverityLabel(alert.severity)}
                    </span>
                    <span className="text-xs text-gray-600">
                      {alert.type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-sm font-medium mb-2">{alert.message}</p>
                  
                  {/* Detalhes específicos por tipo de alerta */}
                  {alert.type === 'EXCESSIVE_TIME' && alert.tables && alert.tables.length > 0 && (
                    <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                      <p className="text-xs font-medium text-gray-700 mb-2">Mesas afetadas:</p>
                      <div className="space-y-1">
                        {alert.tables.slice(0, 5).map((table, tIdx) => (
                          <div key={tIdx} className="flex items-center justify-between text-xs">
                            <span className="font-medium">Mesa {table.tableNumber}</span>
                            <span className="text-red-600 font-semibold">
                              {Math.round(table.minutesOpen)} min aberta
                            </span>
                          </div>
                        ))}
                        {alert.tables.length > 5 && (
                          <p className="text-xs text-gray-500 mt-2">
                            +{alert.tables.length - 5} outras mesas
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {alert.type === 'SLOW_ORDERS' && (
                    <div className="mt-2 text-xs">
                      <span className="font-semibold">{alert.count}</span> pedidos lentos detectados
                    </div>
                  )}

                  {alert.type === 'LOW_PEAK_TURNOVER' && alert.threshold && (
                    <div className="mt-2 text-xs">
                      Meta: <span className="font-semibold">{alert.threshold}x</span> rotatividade em horários de pico
                    </div>
                  )}

                  {alert.type === 'WAITER_IMBALANCE' && alert.waiter && (
                    <div className="mt-2 text-xs">
                      Garçom: <span className="font-semibold">{alert.waiter}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Ação sugerida */}
            <div className="mt-3 pt-3 border-t border-current/10">
              <p className="text-xs font-medium mb-1">💡 Ação Sugerida:</p>
              <p className="text-xs">
                {alert.type === 'SLOW_ORDERS' && 'Verifique a cozinha e distribua pedidos entre garçons'}
                {alert.type === 'EXCESSIVE_TIME' && 'Envie garçom para verificar se cliente deseja conta'}
                {alert.type === 'LOW_PEAK_TURNOVER' && 'Agilize fechamento de mesas para aumentar rotatividade'}
                {alert.type === 'WAITER_IMBALANCE' && 'Redistribua mesas entre os garçons disponíveis'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
