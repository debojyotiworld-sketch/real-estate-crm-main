import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

const data = [
  { name: "New", value: 45, color: "hsl(199, 89%, 48%)" },
  { name: "Hot", value: 28, color: "hsl(0, 84%, 60%)" },
  { name: "Warm", value: 35, color: "hsl(38, 92%, 50%)" },
  { name: "Cold", value: 22, color: "hsl(220, 9%, 46%)" },
  { name: "Converted", value: 18, color: "hsl(142, 71%, 45%)" },
];

export function LeadStatusChart() {
  return (
    <div className="stat-card h-[300px] md:h-[340px]">
      <div className="mb-4">
        <h3 className="font-semibold text-foreground">Lead Distribution</h3>
        <p className="text-sm text-muted-foreground">Current pipeline quality</p>
      </div>
      <ResponsiveContainer width="100%" height="85%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={4}
            cornerRadius={6}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => (
              <span className="text-sm text-foreground">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
