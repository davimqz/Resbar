import { FaExclamationTriangle, FaExclamationCircle, FaInfoCircle } from 'react-icons/fa';
import formatCurrency from '../../lib/formatCurrency';

interface Alert {
  type: 'REVENUE_DROP' | 'TICKET_DROP' | 'PAYMENT_DEPENDENCY' | 'PAYMENT_DISCREPANCY';
  severity: 'high' | 'medium' | 'low';
  message: string;
  value?: number;
  previous?: number;
  change?: number;
  method?: string;
  percentage?: number;
}

interface Props {
  alerts: Alert[];
}

export default function FinanceAlerts({ alerts }: Props) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-green-50 rounded-xl border border-green-200 p-6 text-center">
        <div className="flex items-center justify-center gap-2 text-green-700">
          <div className="text-2xl">✓</div>
          <p className="font-medium">Situação Financeira Estável</p>
        </div>
        <p className="text-sm text-green-600 mt-2">Nenhum alerta financeiro detectado.</p>
      </div>
    );
  }

  const getAlertIcon = (severity: Alert['severity']) => {
    switch (severity) {
      case 'high':
        return <FaExclamationTriangle className="text-red-600" />;
      case 'medium':
        return <FaExclamationCircle className="text-orange-600" />;
      case 'low':
        return <FaInfoCircle className="text-yellow-600" />;
      default:
        return <FaInfoCircle className="text-gray-600" />;
    }
  };

  const getAlertColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200';
      case 'medium':
        return 'bg-orange-50 border-orange-200';
      case 'low':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getAlertTitle = (type: Alert['type']) => {
    switch (type) {
      case 'REVENUE_DROP':
        return '📉 Queda de Receita';
      case 'TICKET_DROP':
        return '🎟 Queda do Ticket Médio';
      case 'PAYMENT_DEPENDENCY':
        return '💳 Alta Dependência de Método';
      case 'PAYMENT_DISCREPANCY':
        return '⚠️ Divergências de Pagamento';
      default:
        return 'Alerta';
    }
  };

  const getAlertDetails = (alert: Alert) => {
    switch (alert.type) {
      case 'REVENUE_DROP':
        return (
          <div className="mt-2 text-xs text-gray-600">
            <div>Atual: {formatCurrency(alert.value || 0)}</div>
            <div>Anterior: {formatCurrency(alert.previous || 0)}</div>
            <div className="text-red-600 font-medium">
              Variação: {alert.change?.toFixed(1)}%
            </div>
          </div>
        );
      case 'TICKET_DROP':
        return (
          <div className="mt-2 text-xs text-gray-600">
            <div>Atual: {formatCurrency(alert.value || 0)}</div>
            <div>Anterior: {formatCurrency(alert.previous || 0)}</div>
            <div className="text-orange-600 font-medium">
              Variação: {alert.change?.toFixed(1)}%
            </div>
          </div>
        );
      case 'PAYMENT_DEPENDENCY':
        return (
          <div className="mt-2 text-xs text-gray-600">
            <div>Método dominante: <span className="font-medium">{alert.method}</span></div>
            <div className="text-yellow-700 font-medium">
              {alert.value?.toFixed(1)}% da receita
            </div>
          </div>
        );
      case 'PAYMENT_DISCREPANCY':
        return (
          <div className="mt-2 text-xs text-gray-600">
            <div className="text-red-600 font-medium">
              {alert.value} comandas afetadas ({alert.percentage?.toFixed(1)}%)
            </div>
            <div className="mt-1 text-gray-700">
              Pode indicar descontos informais ou erros operacionais
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const getSeverityLabel = (severity: Alert['severity']) => {
    switch (severity) {
      case 'high':
        return 'Crítico';
      case 'medium':
        return 'Atenção';
      case 'low':
        return 'Informativo';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-3">
      {alerts.map((alert, index) => (
        <div
          key={`${alert.type}-${index}`}
          className={`rounded-lg border p-4 ${getAlertColor(alert.severity)}`}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-xl">
              {getAlertIcon(alert.severity)}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium text-gray-900">{getAlertTitle(alert.type)}</h4>
                <span className={`text-xs font-medium px-2 py-1 rounded ${
                  alert.severity === 'high' ? 'bg-red-100 text-red-700' :
                  alert.severity === 'medium' ? 'bg-orange-100 text-orange-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {getSeverityLabel(alert.severity)}
                </span>
              </div>
              <p className="text-sm text-gray-700 mb-1">
                {alert.message}
              </p>
              {getAlertDetails(alert)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
