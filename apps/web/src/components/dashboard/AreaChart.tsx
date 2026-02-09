import {
  ResponsiveContainer,
  AreaChart as RechartsArea,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

type Props = {
  data: any[];
  dataKey: string;
  xKey: string;
  title?: string;
  color?: string;
};

export default function AreaChart({ data, dataKey, xKey, title, color = '#10B981' }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      {title && <h3 className="text-lg font-semibold mb-3">{title}</h3>}
      <ResponsiveContainer width="100%" height={280}>
        <RechartsArea data={data}>
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.8} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Area type="monotone" dataKey={dataKey} stroke={color} fill="url(#colorGradient)" />
        </RechartsArea>
      </ResponsiveContainer>
    </div>
  );
}
