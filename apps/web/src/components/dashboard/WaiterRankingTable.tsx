import { useState } from 'react';
import { FaTrophy } from 'react-icons/fa';
import formatCurrency from '../../lib/formatCurrency';
import { Link } from 'react-router-dom';

interface WaiterRankingData {
  waiterId: string;
  waiterName: string;
  revenue: number;
  tabsCount: number;
  avgTicket: number;
  avgDeliveryMinutes: number;
  hoursWorked: number;
  revenuePerHour: number;
}

interface Props {
  data: WaiterRankingData[];
}

export default function WaiterRankingTable({ data }: Props) {
  const [expanded, setExpanded] = useState(false);
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-500">Nenhum dado disponível para o período selecionado.</p>
      </div>
    );
  }

  const getTrophyColor = (index: number) => {
    if (index === 0) return 'text-yellow-500';
    if (index === 1) return 'text-gray-400';
    if (index === 2) return 'text-orange-600';
    return 'text-gray-300';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Posição
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Garçom
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Receita
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ticket Médio
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Comandas
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tempo Entrega
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Receita/Hora
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {(expanded ? data : data.slice(0, 5)).map((waiter, index) => (
              <tr key={waiter.waiterId} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {index < 3 && <FaTrophy className={getTrophyColor(index)} />}
                    <span className="text-sm font-medium text-gray-900">#{index + 1}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link 
                    to={`/dashboard/waiters/${waiter.waiterId}`}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                  >
                    {waiter.waiterName}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(waiter.revenue)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className="text-sm text-gray-700">
                    {formatCurrency(waiter.avgTicket)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className="text-sm text-gray-700">
                    {waiter.tabsCount}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className="text-sm text-gray-700">
                    {waiter.avgDeliveryMinutes > 0 
                      ? `${Math.round(waiter.avgDeliveryMinutes)} min`
                      : '-'
                    }
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {waiter.hoursWorked > 0 ? (
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {formatCurrency(waiter.revenuePerHour)}/h
                      </div>
                      <div className="text-xs text-gray-500">
                        {waiter.hoursWorked.toFixed(1)}h trabalhadas
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
              </tr>
              ))}
          </tbody>
        </table>
      </div>
        {/* Exibir mais / Mostrar menos */}
        {data.length > 5 && (
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-center">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              {expanded ? 'Mostrar menos' : `Exibir mais (${data.length - 5} restantes)`}
            </button>
          </div>
        )}
    </div>
  );
}
