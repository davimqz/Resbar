import {
  ResponsiveContainer,
  BarChart as RechartsBar,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

type Props = {
  data: any[];
  dataKey: string;
  xKey: string;
  title?: string;
  color?: string;
};

export default function BarChart({ data, dataKey, xKey, title, color = '#3B82F6' }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      {title && <h3 className="text-lg font-semibold mb-3">{title}</h3>}
      <ResponsiveContainer width="100%" height={280}>
        <RechartsBar data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey={dataKey} fill={color} />
        </RechartsBar>
      </ResponsiveContainer>
    </div>
  );
}
