import BarChart from './BarChart';
import TimeSeriesChart from './TimeSeriesChart';

interface FlowData {
  ordersByHour: Array<{ hour: number; count: number }>;
  tabsByHour: Array<{ hour: number; count: number }>;
  avgTimeByHour: Array<{ hour: number; avgDeliveryMinutes: number; avgPaymentMinutes: number }>;
}

interface OperationalFlowProps {
  flow: FlowData;
}

export default function OperationalFlow({ flow }: OperationalFlowProps) {
  // Formatar dados para o gráfico
  const ordersData = flow.ordersByHour.map(item => ({
    label: `${item.hour}h`,
    value: item.count
  }));

  const tabsData = flow.tabsByHour.map(item => ({
    label: `${item.hour}h`,
    value: item.count
  }));

  const timeData = flow.avgTimeByHour.map(item => ({
    hour: `${item.hour}h`,
    entrega: item.avgDeliveryMinutes,
    pagamento: item.avgPaymentMinutes
  }));

  // Encontrar horários de pico
  const maxOrders = Math.max(...flow.ordersByHour.map(o => o.count), 0);
  const peakHours = flow.ordersByHour.filter(o => o.count >= maxOrders * 0.8).map(o => o.hour);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pedidos por Hora */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-4">📈 Pedidos por Hora</h3>
          {ordersData.length > 0 ? (
            <>
              <BarChart data={ordersData} color="#3b82f6" />
              {peakHours.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    🔥 <strong>Horários de Pico:</strong> {peakHours.map(h => `${h}h`).join(', ')}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-400">Sem dados de pedidos</div>
          )}
        </div>

        {/* Comandas por Hora */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-4">🧾 Comandas por Hora</h3>
          {tabsData.length > 0 ? (
            <BarChart data={tabsData} color="#10b981" />
          ) : (
            <div className="text-center py-8 text-gray-400">Sem dados de comandas</div>
          )}
        </div>
      </div>

      {/* Tempo Médio por Faixa Horária */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold mb-4">⏱ Tempo Médio por Faixa Horária</h3>
        {timeData.length > 0 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horário</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tempo Entrega</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tempo Pagamento</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {timeData.map((item, idx) => {
                    const isSlowDelivery = item.entrega > 20;
                    const isSlowPayment = item.pagamento > 90;
                    
                    return (
                      <tr key={idx} className={isSlowDelivery || isSlowPayment ? 'bg-red-50' : ''}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.hour}</td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span className={isSlowDelivery ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                            {item.entrega.toFixed(1)} min
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span className={isSlowPayment ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                            {item.pagamento.toFixed(1)} min
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {isSlowDelivery || isSlowPayment ? (
                            <span className="text-red-600">⚠ Lento</span>
                          ) : (
                            <span className="text-green-600">✓ OK</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">Sem dados de tempo por horário</div>
        )}
      </div>
    </div>
  );
}
