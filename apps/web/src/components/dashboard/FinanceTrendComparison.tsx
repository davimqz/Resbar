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
  tabsCount: {
    current: number;
    previous: number;
    change: number;
  };
}

interface Props {
  data: ComparisonData;
}

export default function FinanceTrendComparison({ data }: Props) {
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

  const getChangeBgColor = (change: number, isPositiveGood: boolean = true) => {
    if (change === 0) return 'bg-gray-50';
    
    const isGood = isPositiveGood ? change > 0 : change < 0;
    return isGood ? 'bg-green-50' : 'bg-red-50';
  };

  const getChangeText = (change: number) => {
    const abs = Math.abs(change);
    if (change > 0) return `+${abs.toFixed(1)}%`;
    if (change < 0) return `-${abs.toFixed(1)}%`;
    return '0%';
  };

  const getTrendAnalysis = () => {
    const { revenue, avgTicket, tabsCount } = data;
    
    if (revenue.change > 10 && avgTicket.change > 5) {
      return {
        emoji: '🚀',
        title: 'Crescimento Forte',
        message: 'Receita e ticket médio em alta. Excelente performance!',
        color: 'text-green-700',
        bg: 'bg-green-50 border-green-200'
      };
    }
    
    if (revenue.change < -10) {
      return {
        emoji: '📉',
        title: 'Queda Significativa',
        message: 'Receita em queda. Requer atenção e ação imediata.',
        color: 'text-red-700',
        bg: 'bg-red-50 border-red-200'
      };
    }
    
    if (tabsCount.change > 10 && avgTicket.change < -5) {
      return {
        emoji: '⚠️',
        title: 'Volume Alto, Ticket Baixo',
        message: 'Mais clientes, mas gastando menos. Considere estratégias de upsell.',
        color: 'text-orange-700',
        bg: 'bg-orange-50 border-orange-200'
      };
    }
    
    if (Math.abs(revenue.change) < 5) {
      return {
        emoji: '➡️',
        title: 'Estabilidade',
        message: 'Desempenho estável em relação ao período anterior.',
        color: 'text-blue-700',
        bg: 'bg-blue-50 border-blue-200'
      };
    }
    
    return {
      emoji: '📊',
      title: 'Tendência Normal',
      message: 'Variações dentro do esperado para o período.',
      color: 'text-gray-700',
      bg: 'bg-gray-50 border-gray-200'
    };
  };

  const trendAnalysis = getTrendAnalysis();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-xl font-semibold mb-6">📉 Tendências vs Período Anterior</h3>
      
      {/* Cards de Comparação */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Receita */}
        <div className={`p-6 rounded-xl border-2 transition-all ${getChangeBgColor(data.revenue.change)}`}>
          <div className="text-sm text-gray-600 uppercase tracking-wide mb-2">Receita Total</div>
          <div className="flex items-baseline gap-2 mb-3">
            <div className="text-3xl font-bold text-gray-900">
              {formatCurrency(data.revenue.current)}
            </div>
          </div>
          <div className="flex items-center gap-2 mb-2">
            {getChangeIcon(data.revenue.change)}
            <span className={`text-lg font-bold ${getChangeColor(data.revenue.change, true)}`}>
              {getChangeText(data.revenue.change)}
            </span>
          </div>
          <div className="text-xs text-gray-600">
            Anterior: {formatCurrency(data.revenue.previous)}
          </div>
        </div>

        {/* Ticket Médio */}
        <div className={`p-6 rounded-xl border-2 transition-all ${getChangeBgColor(data.avgTicket.change)}`}>
          <div className="text-sm text-gray-600 uppercase tracking-wide mb-2">Ticket Médio</div>
          <div className="flex items-baseline gap-2 mb-3">
            <div className="text-3xl font-bold text-gray-900">
              {formatCurrency(data.avgTicket.current)}
            </div>
          </div>
          <div className="flex items-center gap-2 mb-2">
            {getChangeIcon(data.avgTicket.change)}
            <span className={`text-lg font-bold ${getChangeColor(data.avgTicket.change, true)}`}>
              {getChangeText(data.avgTicket.change)}
            </span>
          </div>
          <div className="text-xs text-gray-600">
            Anterior: {formatCurrency(data.avgTicket.previous)}
          </div>
        </div>

        {/* Volume de Comandas */}
        <div className={`p-6 rounded-xl border-2 transition-all ${getChangeBgColor(data.tabsCount.change)}`}>
          <div className="text-sm text-gray-600 uppercase tracking-wide mb-2">Comandas Pagas</div>
          <div className="flex items-baseline gap-2 mb-3">
            <div className="text-3xl font-bold text-gray-900">
              {data.tabsCount.current}
            </div>
          </div>
          <div className="flex items-center gap-2 mb-2">
            {getChangeIcon(data.tabsCount.change)}
            <span className={`text-lg font-bold ${getChangeColor(data.tabsCount.change, true)}`}>
              {getChangeText(data.tabsCount.change)}
            </span>
          </div>
          <div className="text-xs text-gray-600">
            Anterior: {data.tabsCount.previous}
          </div>
        </div>
      </div>

      {/* Análise de Tendência */}
      <div className={`p-4 rounded-lg border ${trendAnalysis.bg}`}>
        <div className="flex items-start gap-3">
          <div className="text-3xl">{trendAnalysis.emoji}</div>
          <div>
            <h4 className={`font-semibold text-lg mb-1 ${trendAnalysis.color}`}>
              {trendAnalysis.title}
            </h4>
            <p className="text-sm text-gray-700">
              {trendAnalysis.message}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          * Comparação com período anterior de mesma duração. Variações sazonais podem afetar os resultados.
        </p>
      </div>
    </div>
  );
}
