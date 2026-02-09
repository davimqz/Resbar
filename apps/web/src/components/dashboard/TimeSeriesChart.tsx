import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export default function TimeSeriesChart({ data, dataKey = 'revenue', xKey = 'bucket' }: { data: any[]; dataKey?: string; xKey?: string }) {
  // Safely parse and filter out invalid date buckets
  const formatted = Array.isArray(data)
    ? data
        .map(d => {
          const raw = d?.[xKey];
          const date = raw ? new Date(raw) : null;
          if (!date || Number.isNaN(date.getTime())) return null;
          return { ...d, [xKey]: date.toISOString() };
        })
        .filter(Boolean)
    : [];

  const tickFormatter = (v: any) => {
    if (!v) return '';
    try {
      return new Date(String(v)).toLocaleString();
    } catch {
      return '';
    }
  };

  const labelFormatter = (v: any) => {
    if (!v) return '';
    try {
      return new Date(String(v)).toLocaleString();
    } catch {
      return String(v);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={formatted as any[]}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} tickFormatter={tickFormatter} />
          <YAxis />
          <Tooltip labelFormatter={labelFormatter} formatter={(value: any) => (typeof value === 'number' ? value.toFixed(2) : value)} />
          <Line type="monotone" dataKey={dataKey} stroke="#10B981" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
