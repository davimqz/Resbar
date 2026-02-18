import ReturnRequestsSection from '../components/dashboard/ReturnRequestsSection';

export default function DashboardReturns() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Devoluções</h1>
        <p className="text-sm text-gray-500 mt-1">Revisar e gerenciar solicitações de devolução</p>
      </div>

      <div className="grid gap-6">
        <ReturnRequestsSection />
      </div>
    </div>
  );
}
