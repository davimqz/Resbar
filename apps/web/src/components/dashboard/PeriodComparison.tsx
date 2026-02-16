import { FaArrowUp, FaArrowDown, FaMinus } from 'react-icons/fa';
import formatCurrency from '../../lib/formatCurrency';

interface ComparisonData {
  revenue: {
    current: number;
    previous: number;
    change: number;
  };
  avgTicket: {
    current: number;
    previous: number;
    change: number;
  };
  avgDeliveryTime: {
    current: number;
    previous: number;
    change: number;
  };
}

interface Props {
  data: ComparisonData;
}

export default function PeriodComparison({ data }: Props) {
  const getChangeIcon = (change: number) => {
    if (change > 0) return <FaArrowUp className="text-green-600" />;
    if (change < 0) return <FaArrowDown className="text-red-600" />;
    return <FaMinus className="text-gray-400" />;
  };

  const getChangeColor = (change: number, isPositiveGood: boolean = true) => {
    if (change === 0) return 'text-gray-600';
    
    const isGood = isPositiveGood ? change > 0 : change < 0;
    return isGood ? 'text-green-600' : 'text-red-600';
  };

  const getChangeText = (change: number) => {
    const abs = Math.abs(change);
    if (change > 0) return `+${abs.toFixed(1)}%`;
    if (change < 0) return `${abs.toFixed(1)}%`;
    return '0%';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold mb-4">Comparação com Período Anterior</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Receita */}
        <div className="space-y-2">
          <div className="text-sm text-gray-500 uppercase tracking-wide">Receita</div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(data.revenue.current)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getChangeIcon(data.revenue.change)}
            <span className={`text-sm font-medium ${getChangeColor(data.revenue.change, true)}`}>
              {getChangeText(data.revenue.change)}
            </span>
            <span className="text-xs text-gray-500">
              vs {formatCurrency(data.revenue.previous)}
            </span>
          </div>
        </div>

        {/* Ticket Médio */}
        <div className="space-y-2">
          <div className="text-sm text-gray-500 uppercase tracking-wide">Ticket Médio</div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(data.avgTicket.current)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getChangeIcon(data.avgTicket.change)}
            <span className={`text-sm font-medium ${getChangeColor(data.avgTicket.change, true)}`}>
              {getChangeText(data.avgTicket.change)}
            </span>
            <span className="text-xs text-gray-500">
              vs {formatCurrency(data.avgTicket.previous)}
            </span>
          </div>
        </div>

        {/* Tempo Médio de Entrega */}
        <div className="space-y-2">
          <div className="text-sm text-gray-500 uppercase tracking-wide">Tempo Médio de Entrega</div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(data.avgDeliveryTime.current)} min
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getChangeIcon(data.avgDeliveryTime.change)}
            <span className={`text-sm font-medium ${getChangeColor(data.avgDeliveryTime.change, false)}`}>
              {getChangeText(data.avgDeliveryTime.change)}
            </span>
            <span className="text-xs text-gray-500">
              vs {Math.round(data.avgDeliveryTime.previous)} min
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          * Comparação com o período anterior de mesma duração
        </p>
      </div>
    </div>
  );
}
