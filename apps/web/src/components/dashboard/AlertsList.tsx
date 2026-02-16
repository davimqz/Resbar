import { FaExclamationTriangle, FaChartLine, FaClock, FaUserClock } from 'react-icons/fa';
import { Link } from 'react-router-dom';

interface Alert {
  type: 'SLOW_DELIVERY' | 'LOW_TICKET' | 'LOW_PRODUCTIVITY';
  waiterId: string;
  waiterName: string;
  value: number;
  threshold: number;
  message: string;
}

interface Props {
  alerts: Alert[];
}

export default function AlertsList({ alerts }: Props) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-green-50 rounded-xl border border-green-200 p-6 text-center">
        <div className="flex items-center justify-center gap-2 text-green-700">
          <div className="text-2xl">✓</div>
          <p className="font-medium">Tudo funcionando perfeitamente!</p>
        </div>
        <p className="text-sm text-green-600 mt-2">Nenhum alerta detectado no período.</p>
      </div>
    );
  }

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'SLOW_DELIVERY':
        return <FaClock className="text-orange-600" />;
      case 'LOW_TICKET':
        return <FaChartLine className="text-red-600" />;
      case 'LOW_PRODUCTIVITY':
        return <FaUserClock className="text-yellow-600" />;
      default:
        return <FaExclamationTriangle className="text-gray-600" />;
    }
  };

  const getAlertColor = (type: Alert['type']) => {
    switch (type) {
      case 'SLOW_DELIVERY':
        return 'bg-orange-50 border-orange-200';
      case 'LOW_TICKET':
        return 'bg-red-50 border-red-200';
      case 'LOW_PRODUCTIVITY':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getAlertTitle = (type: Alert['type']) => {
    switch (type) {
      case 'SLOW_DELIVERY':
        return 'Tempo de Entrega Elevado';
      case 'LOW_TICKET':
        return 'Ticket Médio Baixo';
      case 'LOW_PRODUCTIVITY':
        return 'Baixa Produtividade';
      default:
        return 'Alerta';
    }
  };

  return (
    <div className="space-y-3">
      {alerts.map((alert, index) => (
        <div
          key={`${alert.waiterId}-${alert.type}-${index}`}
          className={`rounded-lg border p-4 ${getAlertColor(alert.type)}`}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-xl">
              {getAlertIcon(alert.type)}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium text-gray-900">{getAlertTitle(alert.type)}</h4>
                <Link
                  to={`/dashboard/waiters/${alert.waiterId}`}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  Ver Detalhes →
                </Link>
              </div>
              <p className="text-sm text-gray-700">
                <span className="font-medium">{alert.waiterName}:</span>{' '}
                {alert.message}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
