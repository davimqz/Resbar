import BarChart from './BarChart';
import formatCurrency from '../../lib/formatCurrency';

interface RevenueByDay {
  day: string;
  revenue: number;
  tabsCount: number;
}

interface RevenueByShift {
  shift: string;
  revenue: number;
  tabsCount: number;
}

interface RevenueByWaiter {
  waiterId: string;
  waiterName: string;
  revenue: number;
  tabsCount: number;
  percentage: number;
}

interface Props {
  revenueByDay: RevenueByDay[];
  revenueByShift: RevenueByShift[];
  revenueByWaiter: RevenueByWaiter[];
}

export default function RevenueDistributionCharts({ revenueByDay, revenueByShift, revenueByWaiter }: Props) {
  const shiftOrder = ['Manhã', 'Tarde', 'Noite', 'Madrugada'];
  const sortedShifts = [...revenueByShift].sort((a, b) => {
    return shiftOrder.indexOf(a.shift) - shiftOrder.indexOf(b.shift);
  });

  return (
    <div className="space-y-6">
      {/* Receita por Dia */}
      {revenueByDay.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-4">📅 Receita por Dia</h3>
          <BarChart
            data={revenueByDay.map(d => ({
              name: new Date(d.day).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
              value: d.revenue
            }))}
            dataKey="value"
            xKey="name"
            color="#10b981"
          />
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Dia Mais Forte</div>
              <div className="font-semibold text-gray-900">
                {revenueByDay.length > 0 
                  ? formatCurrency(Math.max(...revenueByDay.map(d => d.revenue)))
                  : '-'
                }
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Dia Mais Fraco</div>
              <div className="font-semibold text-gray-900">
                {revenueByDay.length > 0 
                  ? formatCurrency(Math.min(...revenueByDay.map(d => d.revenue)))
                  : '-'
                }
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Média Diária</div>
              <div className="font-semibold text-gray-900">
                {revenueByDay.length > 0 
                  ? formatCurrency(revenueByDay.reduce((sum, d) => sum + d.revenue, 0) / revenueByDay.length)
                  : '-'
                }
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Total Dias</div>
              <div className="font-semibold text-gray-900">
                {revenueByDay.length} dias
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receita por Turno */}
      {revenueByShift.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-4">🕒 Receita por Turno</h3>
          <BarChart
            data={sortedShifts.map(s => ({
              name: s.shift,
              value: s.revenue
            }))}
            dataKey="value"
            xKey="name"
            color="#3b82f6"
          />
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {sortedShifts.map(shift => (
              <div key={shift.shift} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">{shift.shift}</div>
                <div className="font-semibold text-gray-900">
                  {formatCurrency(shift.revenue)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {shift.tabsCount} comandas
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Receita por Garçom (Top 10) */}
      {revenueByWaiter.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-4">📊 Receita por Garçom (Top 10)</h3>
          <BarChart
            data={revenueByWaiter.slice(0, 10).map(w => ({
              name: w.waiterName,
              value: w.revenue
            }))}
            dataKey="value"
            xKey="name"
            color="#8b5cf6"
          />
          <div className="mt-4 space-y-2">
            {revenueByWaiter.slice(0, 10).map((waiter, index) => (
              <div key={waiter.waiterId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-sm font-semibold text-purple-700">
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-900">{waiter.waiterName}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {formatCurrency(waiter.revenue)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {waiter.tabsCount} comandas • {waiter.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
