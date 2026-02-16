interface Alert {
  type: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
  // HIGH_DEMAND_UNAVAILABLE
  itemId?: string;
  itemName?: string;
  historicalVolume?: number;
  avgVolume?: number;
  // PREP_TIME_INCREASE
  previousTime?: number;
  currentTime?: number;
  increasePct?: number;
  // STRATEGIC_ITEM_DECLINE
  previousQuantity?: number;
  currentQuantity?: number;
  decreasePct?: number;
  // REVENUE_CONCENTRATION
  top3Items?: string[];
  concentrationPct?: number;
  // TOO_MANY_PROBLEMATIC
  problematicCount?: number;
  items?: string[];
}

interface MenuAlertsProps {
  alerts: Alert[];
}

export default function MenuAlerts({ alerts }: MenuAlertsProps) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold mb-4">🔔 Alertas do Cardápio</h3>
        <div className="text-center py-12">
          <div className="text-4xl mb-2">✅</div>
          <div className="text-gray-600 font-medium">Tudo sob controle!</div>
          <div className="text-sm text-gray-400 mt-1">
            Nenhum alerta identificado no cardápio.
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
      case 'HIGH_DEMAND_UNAVAILABLE':
        return 'Item de Alta Demanda Indisponível';
      case 'PREP_TIME_INCREASE':
        return 'Aumento no Tempo de Preparo';
      case 'STRATEGIC_ITEM_DECLINE':
        return 'Queda em Item Estratégico';
      case 'REVENUE_CONCENTRATION':
        return 'Concentração de Receita';
      case 'TOO_MANY_PROBLEMATIC':
        return 'Muitos Itens Problemáticos';
      default:
        return 'Alerta do Cardápio';
    }
  };

  const getAlertDetails = (alert: Alert) => {
    switch (alert.type) {
      case 'HIGH_DEMAND_UNAVAILABLE':
        return (
          <div className="mt-2 text-sm space-y-1">
            <div>🍽 <strong>Item:</strong> {alert.itemName}</div>
            <div>📊 <strong>Volume histórico:</strong> {alert.historicalVolume} vendas (últimos 30 dias)</div>
            <div>📈 <strong>Média geral:</strong> {alert.avgVolume?.toFixed(0)} vendas/item</div>
          </div>
        );
      case 'PREP_TIME_INCREASE':
        return (
          <div className="mt-2 text-sm space-y-1">
            <div>🍽 <strong>Item:</strong> {alert.itemName}</div>
            <div>⏱ <strong>Tempo anterior:</strong> {alert.previousTime?.toFixed(1)} min</div>
            <div>⏱ <strong>Tempo atual:</strong> {alert.currentTime?.toFixed(1)} min</div>
            <div>📈 <strong>Aumento:</strong> +{alert.increasePct?.toFixed(1)}%</div>
          </div>
        );
      case 'STRATEGIC_ITEM_DECLINE':
        return (
          <div className="mt-2 text-sm space-y-1">
            <div>🍽 <strong>Item:</strong> {alert.itemName}</div>
            <div>📊 <strong>Volume anterior:</strong> {alert.previousQuantity} vendas</div>
            <div>📉 <strong>Volume atual:</strong> {alert.currentQuantity} vendas</div>
            <div>🔻 <strong>Queda:</strong> -{alert.decreasePct?.toFixed(1)}%</div>
          </div>
        );
      case 'REVENUE_CONCENTRATION':
        return (
          <div className="mt-2 text-sm space-y-1">
            <div>📊 <strong>Concentração:</strong> {alert.concentrationPct?.toFixed(1)}% em apenas 3 itens</div>
            {alert.top3Items && alert.top3Items.length > 0 && (
              <div>
                <strong>Top 3 itens:</strong>
                <ul className="ml-4 mt-1 space-y-0.5">
                  {alert.top3Items.map((item, idx) => (
                    <li key={idx}>• {item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      case 'TOO_MANY_PROBLEMATIC':
        return (
          <div className="mt-2 text-sm space-y-1">
            <div>📊 <strong>Total problemáticos:</strong> {alert.problematicCount} itens</div>
            {alert.items && alert.items.length > 0 && (
              <div>
                <strong>Exemplos:</strong>
                <ul className="ml-4 mt-1 space-y-0.5">
                  {alert.items.map((item, idx) => (
                    <li key={idx}>• {item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const getRecommendedActions = (type: string) => {
    const actions: Record<string, string[]> = {
      HIGH_DEMAND_UNAVAILABLE: [
        'Priorizar reabastecimento imediatamente',
        'Comunicar aos clientes sobre previsão de retorno',
        'Melhorar gestão de estoque e previsão de demanda',
        'Considerar alternativas similares no cardápio'
      ],
      PREP_TIME_INCREASE: [
        'Verificar se houve mudança no processo ou equipe',
        'Treinar ou alocar mais recursos na preparação',
        'Avaliar se ingredientes ou equipamentos estão adequados',
        'Considerar simplificar a receita se necessário'
      ],
      STRATEGIC_ITEM_DECLINE: [
        'Investigar causas: preço, qualidade, apresentação?',
        'Coletar feedback de clientes e garçons',
        'Considerar promoção ou reposicionamento no cardápio',
        'Avaliar se há problema de execução na cozinha'
      ],
      REVENUE_CONCENTRATION: [
        'Diversificar cardápio com novos itens atrativos',
        'Promover itens menos populares através de combos',
        'Treinar equipe para sugerir variedade aos clientes',
        'Reduzir dependência de poucos produtos'
      ],
      TOO_MANY_PROBLEMATIC: [
        'Revisar cardápio e considerar remoção de itens',
        'Redesenhar precificação de produtos não vendidos',
        'Criar combos ou promoções para atrair interesse',
        'Focar em qualidade vs quantidade de opções'
      ]
    };

    return actions[type] || ['Monitorar situação e ajustar conforme necessário'];
  };

  // Agrupar alertas por severidade
  const highAlerts = alerts.filter(a => a.severity === 'high');
  const mediumAlerts = alerts.filter(a => a.severity === 'medium');
  const lowAlerts = alerts.filter(a => a.severity === 'low');

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">🔔 Alertas do Cardápio</h3>
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
          const actions = getRecommendedActions(alert.type);

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
