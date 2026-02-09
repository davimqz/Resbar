type KPI = {
  label: string;
  value: string | number;
  sub?: string;
};

export default function KPICards({ items }: { items: KPI[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {items.map((k, i) => (
        <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="text-sm text-gray-500">{k.label}</div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{k.value}</div>
          {k.sub && <div className="text-xs text-gray-400 mt-1">{k.sub}</div>}
        </div>
      ))}
    </div>
  );
}
