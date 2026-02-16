interface Alert {
  type: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
  previousAvgMinutes?: number;
  currentAvgMinutes?: number;
  increasePct?: number;
  delayedPct?: number;
  delayedCount?: number;
  totalOrders?: number;
  volumeIncreasePct?: number;
  timeIncreasePct?: number;
  itemName?: string;
  itemPrepMinutes?: number;
  avgPrepMinutes?: number;
}

interface KitchenAlertsProps {
  alerts: Alert[];
}

export default function KitchenAlerts({ alerts }: KitchenAlertsProps) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold mb-4">🔔 Alertas da Cozinha</h3>
        <div className="text-center py-12">
          <div className="text-4xl mb-2">✅</div>
          <div className="text-gray-600 font-medium">Tudo sob controle!</div>
          <div className="text-sm text-gray-400 mt-1">
            Nenhum alerta crítico no momento.
          </div>
        </div>
      </div>
    );
  }

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'high':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: '🚨',
          iconBg: 'bg-red-100',
          iconText: 'text-red-600',
          titleText: 'text-red-900',
          messageText: 'text-red-800',
          badge: 'bg-red-100 text-red-800'
        };
      case 'medium':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          icon: '⚠️',
          iconBg: 'bg-orange-100',
          iconText: 'text-orange-600',
          titleText: 'text-orange-900',
          messageText: 'text-orange-800',
          badge: 'bg-orange-100 text-orange-800'
        };
      case 'low':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: '💡',
          iconBg: 'bg-yellow-100',
          iconText: 'text-yellow-600',
          titleText: 'text-yellow-900',
          messageText: 'text-yellow-800',
          badge: 'bg-yellow-100 text-yellow-800'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          icon: 'ℹ️',
          iconBg: 'bg-gray-100',
          iconText: 'text-gray-600',
          titleText: 'text-gray-900',
          messageText: 'text-gray-800',
          badge: 'bg-gray-100 text-gray-800'
        };
    }
  };

  const getAlertTitle = (type: string) => {
    switch (type) {
      case 'PREP_TIME_INCREASE':
        return 'Tempo de Preparo Aumentando';
      case 'HIGH_DELAY_RATE':
        return 'Taxa de Atraso Elevada';
      case 'VOLUME_WITHOUT_CAPACITY':
        return 'Volume sem Capacidade';
      case 'CRITICAL_ITEM':
        return 'Item Crítico Identificado';
      default:
        return 'Alerta da Cozinha';
    }
  };

  const getAlertDetails = (alert: Alert) => {
    switch (alert.type) {
      case 'PREP_TIME_INCREASE':
        return (
          <div className="mt-2 text-sm space-y-1">
            <div>📊 <strong>Período anterior:</strong> {alert.previousAvgMinutes?.toFixed(1)} min</div>
            <div>📈 <strong>Período atual:</strong> {alert.currentAvgMinutes?.toFixed(1)} min</div>
            <div>🔺 <strong>Aumento:</strong> +{alert.increasePct?.toFixed(1)}%</div>
          </div>
        );
      case 'HIGH_DELAY_RATE':
        return (
          <div className="mt-2 text-sm space-y-1">
            <div>❌ <strong>Pedidos atrasados:</strong> {alert.delayedCount} de {alert.totalOrders}</div>
            <div>📊 <strong>Taxa de atraso:</strong> {alert.delayedPct?.toFixed(1)}%</div>
          </div>
        );
      case 'VOLUME_WITHOUT_CAPACITY':
        return (
          <div className="mt-2 text-sm space-y-1">
            <div>📈 <strong>Aumento de volume:</strong> +{alert.volumeIncreasePct?.toFixed(1)}%</div>
            <div>⏱ <strong>Aumento de tempo:</strong> +{alert.timeIncreasePct?.toFixed(1)}%</div>
          </div>
        );
      case 'CRITICAL_ITEM':
        return (
          <div className="mt-2 text-sm space-y-1">
            <div>🍽 <strong>Item:</strong> {alert.itemName}</div>
            <div>⏱ <strong>Tempo de preparo:</strong> {alert.itemPrepMinutes?.toFixed(1)} min</div>
            <div>📊 <strong>Média geral:</strong> {alert.avgPrepMinutes?.toFixed(1)} min</div>
          </div>
        );
      default:
        return null;
    }
  };

  const getRecommendedActions = (type: string, severity: string) => {
    const actions: Record<string, string[]> = {
      PREP_TIME_INCREASE: [
        'Verificar se alguma estação está com gargalo',
        'Revisar processo de produção dos itens mais lentos',
        'Considerar realocar recursos ou ajustar cardápio'
      ],
      HIGH_DELAY_RATE: [
        'Aumentar equipe na cozinha imediatamente',
        'Priorizar pedidos mais antigos',
        'Comunicar garçons sobre tempo estimado'
      ],
      VOLUME_WITHOUT_CAPACITY: [
        'Escalar equipe urgentemente',
        'Reduzir temporariamente complexidade do cardápio',
        'Comunicar tempo de espera aos clientes'
      ],
      CRITICAL_ITEM: [
        'Revisar processo de preparo do item',
        'Treinar equipe específica para este item',
        'Considerar pré-preparo ou simplificação da receita'
      ]
    };

    const typeActions = actions[type] || ['Monitorar situação e ajustar conforme necessário'];
    
    if (severity === 'high') {
      return ['🚨 AÇÃO IMEDIATA NECESSÁRIA', ...typeActions];
    }
    
    return typeActions;
  };

  // Agrupar por severidade
  const highAlerts = alerts.filter(a => a.severity === 'high');
  const mediumAlerts = alerts.filter(a => a.severity === 'medium');
  const lowAlerts = alerts.filter(a => a.severity === 'low');

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">🔔 Alertas da Cozinha</h3>
        <div className="flex gap-2">
          {highAlerts.length > 0 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              {highAlerts.length} crítico{highAlerts.length > 1 ? 's' : ''}
            </span>
          )}
          {mediumAlerts.length > 0 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              {mediumAlerts.length} atenção
            </span>
          )}
          {lowAlerts.length > 0 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              {lowAlerts.length} info
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {alerts.map((alert, idx) => {
          const config = getSeverityConfig(alert.severity);
          const title = getAlertTitle(alert.type);
          const details = getAlertDetails(alert);
          const actions = getRecommendedActions(alert.type, alert.severity);

          return (
            <div
              key={idx}
              className={`${config.bg} ${config.border} border rounded-lg p-4`}
            >
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className={`${config.iconBg} p-2 rounded-lg flex-shrink-0`}>
                  <span className="text-xl">{config.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`font-semibold ${config.titleText}`}>{title}</h4>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.badge}`}>
                      {alert.severity === 'high' ? 'CRÍTICO' : alert.severity === 'medium' ? 'ATENÇÃO' : 'INFO'}
                    </span>
                  </div>
                  <p className={`text-sm ${config.messageText}`}>{alert.message}</p>
                  
                  {/* Detalhes específicos do alerta */}
                  {details && (
                    <div className={`mt-3 pl-3 border-l-2 ${config.border} ${config.messageText}`}>
                      {details}
                    </div>
                  )}

                  {/* Ações recomendadas */}
                  <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                    <div className="text-xs font-semibold mb-2 opacity-75">
                      💡 Ações Recomendadas:
                    </div>
                    <ul className="text-xs space-y-1 opacity-90">
                      {actions.map((action, actionIdx) => (
                        <li key={actionIdx} className="flex items-start gap-1">
                          <span className="flex-shrink-0 mt-0.5">•</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
