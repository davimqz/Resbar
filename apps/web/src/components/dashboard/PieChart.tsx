import {
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';

type Props = {
  data: any[];
  dataKey: string;
  nameKey: string;
  title?: string;
  colors?: string[];
};

const DEFAULT_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function PieChart({ data, dataKey, nameKey, title, colors = DEFAULT_COLORS }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      {title && <h3 className="text-lg font-semibold mb-3">{title}</h3>}
      <ResponsiveContainer width="100%" height={280}>
        <RechartsPie>
          <Pie
            data={data}
            dataKey={dataKey}
            nameKey={nameKey}
            cx="50%"
            cy="50%"
            outerRadius={80}
            label
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </RechartsPie>
      </ResponsiveContainer>
    </div>
  );
}
