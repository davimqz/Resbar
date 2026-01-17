import { useOrder } from '../hooks/useOrder';
import { OrderStatus } from '@resbar/shared';

export default function KitchenPage() {
  const { useKitchenOrders, updateOrderStatus } = useOrder();
  const { data: orders, isLoading } = useKitchenOrders();

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus.mutateAsync({ id: orderId, status: newStatus });
    } catch (error: any) {
      alert(error.message || 'Erro ao atualizar status');
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return 'bg-yellow-100 border-yellow-400 text-yellow-800';
      case OrderStatus.PREPARING:
        return 'bg-blue-100 border-blue-400 text-blue-800';
      case OrderStatus.READY:
        return 'bg-green-100 border-green-400 text-green-800';
      default:
        return 'bg-gray-100 border-gray-400 text-gray-800';
    }
  };

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    switch (currentStatus) {
      case OrderStatus.PENDING:
        return OrderStatus.PREPARING;
      case OrderStatus.PREPARING:
        return OrderStatus.READY;
      case OrderStatus.READY:
        return OrderStatus.DELIVERED;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Carregando pedidos...</div>
      </div>
    );
  }

  const groupedOrders = {
    [OrderStatus.PENDING]: orders?.filter((o) => o.status === OrderStatus.PENDING) || [],
    [OrderStatus.PREPARING]: orders?.filter((o) => o.status === OrderStatus.PREPARING) || [],
    [OrderStatus.READY]: orders?.filter((o) => o.status === OrderStatus.READY) || [],
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Cozinha</h1>
        <p className="mt-2 text-sm text-gray-700">
          Visualize e gerencie os pedidos em preparo
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pendentes */}
        <div>
          <h2 className="text-xl font-bold text-yellow-700 mb-4">
            Pendentes ({groupedOrders[OrderStatus.PENDING].length})
          </h2>
          <div className="space-y-4">
            {groupedOrders[OrderStatus.PENDING].map((order: any) => (
              <div
                key={order.id}
                className={`border-2 rounded-lg p-4 ${getStatusColor(order.status)}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-lg">Mesa {order.tab.table.number}</p>
                    <p className="text-sm opacity-75">{order.tab.person?.name}</p>
                  </div>
                  <div className="text-xs text-right">
                    <p>{new Date(order.createdAt).toLocaleTimeString('pt-BR')}</p>
                    {order.tab.table.waiter && (
                      <p className="mt-1">{order.tab.table.waiter.name}</p>
                    )}
                  </div>
                </div>

                <div className="mb-3 py-3 border-y border-current border-opacity-20">
                  <p className="font-bold text-base">{order.menuItem.name}</p>
                  <p className="text-sm mt-1">Quantidade: {order.quantity}</p>
                  {order.notes && (
                    <p className="text-sm mt-1 italic">Obs: {order.notes}</p>
                  )}
                </div>

                <button
                  onClick={() => handleStatusChange(order.id, getNextStatus(order.status)!)}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
                >
                  Iniciar Preparo
                </button>
              </div>
            ))}
            {groupedOrders[OrderStatus.PENDING].length === 0 && (
              <p className="text-gray-500 text-center py-8">Nenhum pedido pendente</p>
            )}
          </div>
        </div>

        {/* Em Preparo */}
        <div>
          <h2 className="text-xl font-bold text-blue-700 mb-4">
            Em Preparo ({groupedOrders[OrderStatus.PREPARING].length})
          </h2>
          <div className="space-y-4">
            {groupedOrders[OrderStatus.PREPARING].map((order: any) => (
              <div
                key={order.id}
                className={`border-2 rounded-lg p-4 ${getStatusColor(order.status)}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-lg">Mesa {order.tab.table.number}</p>
                    <p className="text-sm opacity-75">{order.tab.person?.name}</p>
                  </div>
                  <div className="text-xs text-right">
                    <p>{new Date(order.createdAt).toLocaleTimeString('pt-BR')}</p>
                    {order.tab.table.waiter && (
                      <p className="mt-1">{order.tab.table.waiter.name}</p>
                    )}
                  </div>
                </div>

                <div className="mb-3 py-3 border-y border-current border-opacity-20">
                  <p className="font-bold text-base">{order.menuItem.name}</p>
                  <p className="text-sm mt-1">Quantidade: {order.quantity}</p>
                  {order.notes && (
                    <p className="text-sm mt-1 italic">Obs: {order.notes}</p>
                  )}
                </div>

                <button
                  onClick={() => handleStatusChange(order.id, getNextStatus(order.status)!)}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-medium"
                >
                  Marcar como Pronto
                </button>
              </div>
            ))}
            {groupedOrders[OrderStatus.PREPARING].length === 0 && (
              <p className="text-gray-500 text-center py-8">Nenhum pedido em preparo</p>
            )}
          </div>
        </div>

        {/* Prontos */}
        <div>
          <h2 className="text-xl font-bold text-green-700 mb-4">
            Prontos ({groupedOrders[OrderStatus.READY].length})
          </h2>
          <div className="space-y-4">
            {groupedOrders[OrderStatus.READY].map((order: any) => (
              <div
                key={order.id}
                className={`border-2 rounded-lg p-4 ${getStatusColor(order.status)}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-lg">Mesa {order.tab.table.number}</p>
                    <p className="text-sm opacity-75">{order.tab.person?.name}</p>
                  </div>
                  <div className="text-xs text-right">
                    <p>{new Date(order.createdAt).toLocaleTimeString('pt-BR')}</p>
                    {order.tab.table.waiter && (
                      <p className="mt-1 font-medium">{order.tab.table.waiter.name}</p>
                    )}
                  </div>
                </div>

                <div className="mb-3 py-3 border-y border-current border-opacity-20">
                  <p className="font-bold text-base">{order.menuItem.name}</p>
                  <p className="text-sm mt-1">Quantidade: {order.quantity}</p>
                  {order.notes && (
                    <p className="text-sm mt-1 italic">Obs: {order.notes}</p>
                  )}
                </div>

                <button
                  onClick={() => handleStatusChange(order.id, getNextStatus(order.status)!)}
                  className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 font-medium"
                >
                  Marcar como Entregue
                </button>
              </div>
            ))}
            {groupedOrders[OrderStatus.READY].length === 0 && (
              <p className="text-gray-500 text-center py-8">Nenhum pedido pronto</p>
            )}
          </div>
        </div>
      </div>

      {orders && orders.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Nenhum pedido ativo no momento</p>
        </div>
      )}
    </div>
  );
}
