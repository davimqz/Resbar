import formatCurrency from '../../lib/formatCurrency';

interface MenuKPIsProps {
  totalRevenue: number;
  totalItems: number;
  unavailableCount: number;
  avgPrepTime: number;
  concentrationRatio: number;
}

export default function MenuKPIs({
  totalRevenue,
  totalItems,
  unavailableCount,
  avgPrepTime,
  concentrationRatio
}: MenuKPIsProps) {
  // Status da concentração
  const getConcentrationStatus = () => {
    if (concentrationRatio < 20) {
      return { color: 'red', icon: '⚠️', label: 'Muito Concentrado', bg: 'bg-red-50', text: 'text-red-700' };
    }
    if (concentrationRatio < 40) {
      return { color: 'orange', icon: '⚡', label: 'Concentrado', bg: 'bg-orange-50', text: 'text-orange-700' };
    }
    if (concentrationRatio < 60) {
      return { color: 'blue', icon: '✓', label: 'Balanceado', bg: 'bg-blue-50', text: 'text-blue-700' };
    }
    return { color: 'green', icon: '✅', label: 'Diversificado', bg: 'bg-green-50', text: 'text-green-700' };
  };

  const concentrationStatus = getConcentrationStatus();

  // Status da disponibilidade
  const unavailablePct = totalItems > 0 ? (unavailableCount / totalItems) * 100 : 0;
  const getAvailabilityStatus = () => {
    if (unavailablePct > 20) {
      return { color: 'red', icon: '🚫', label: 'Crítico', bg: 'bg-red-50', text: 'text-red-700' };
    }
    if (unavailablePct > 10) {
      return { color: 'orange', icon: '⚠️', label: 'Atenção', bg: 'bg-orange-50', text: 'text-orange-700' };
    }
    if (unavailablePct > 5) {
      return { color: 'yellow', icon: '💡', label: 'Bom', bg: 'bg-yellow-50', text: 'text-yellow-700' };
    }
    return { color: 'green', icon: '✓', label: 'Ótimo', bg: 'bg-green-50', text: 'text-green-700' };
  };

  const availabilityStatus = getAvailabilityStatus();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Receita Total */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-gray-500">💰 Receita Total</div>
        </div>
        <div className="text-2xl font-bold text-gray-900 mb-1">
          {formatCurrency(totalRevenue)}
        </div>
        <div className="text-xs text-gray-500">do cardápio no período</div>
      </div>

      {/* Total de Itens */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-gray-500">🍽 Itens Ativos</div>
        </div>
        <div className="text-2xl font-bold text-gray-900 mb-1">
          {totalItems}
        </div>
        <div className="text-xs text-gray-500">itens gerando vendas</div>
      </div>

      {/* Disponibilidade */}
      <div className={`${availabilityStatus.bg} rounded-lg shadow-sm border border-${availabilityStatus.color}-200 p-5`}>
        <div className="flex items-center justify-between mb-2">
          <div className={`text-sm font-medium ${availabilityStatus.text}`}>
            {availabilityStatus.icon} Disponibilidade
          </div>
        </div>
        <div className={`text-2xl font-bold ${availabilityStatus.text} mb-1`}>
          {unavailableCount}
        </div>
        <div className={`text-xs ${availabilityStatus.text} opacity-75 flex items-center gap-1`}>
          <span className="font-semibold">{unavailablePct.toFixed(1)}%</span>
          <span>indisponíveis</span>
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${availabilityStatus.bg} border border-current`}>
            {availabilityStatus.label}
          </span>
        </div>
      </div>

      {/* Tempo Médio de Preparo */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-gray-500">⏱ Tempo Médio Preparo</div>
        </div>
        <div className="text-2xl font-bold text-gray-900 mb-1">
          {avgPrepTime > 0 ? `${avgPrepTime.toFixed(1)} min` : '-'}
        </div>
        <div className="text-xs text-gray-500">
          {avgPrepTime > 25 && (
            <span className="text-orange-600 font-medium">⚠ Acima do ideal</span>
          )}
          {avgPrepTime > 0 && avgPrepTime <= 25 && (
            <span className="text-green-600 font-medium">✓ Dentro do esperado</span>
          )}
          {avgPrepTime === 0 && 'Sem dados disponíveis'}
        </div>
      </div>

      {/* Concentração de Receita */}
      <div className={`${concentrationStatus.bg} rounded-lg shadow-sm border border-${concentrationStatus.color}-200 p-5`}>
        <div className="flex items-center justify-between mb-2">
          <div className={`text-sm font-medium ${concentrationStatus.text}`}>
            {concentrationStatus.icon} Diversificação
          </div>
        </div>
        <div className={`text-2xl font-bold ${concentrationStatus.text} mb-1`}>
          {concentrationRatio.toFixed(0)}%
        </div>
        <div className={`text-xs ${concentrationStatus.text} opacity-75 flex items-center gap-1`}>
          <span>itens geram 80% receita</span>
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${concentrationStatus.bg} border border-current`}>
            {concentrationStatus.label}
          </span>
        </div>
      </div>
    </div>
  );
}
