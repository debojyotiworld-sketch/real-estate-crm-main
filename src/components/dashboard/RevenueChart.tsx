import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { month: "Jan", revenue: 45, target: 50 },
  { month: "Feb", revenue: 52, target: 50 },
  { month: "Mar", revenue: 48, target: 55 },
  { month: "Apr", revenue: 61, target: 55 },
  { month: "May", revenue: 55, target: 60 },
  { month: "Jun", revenue: 67, target: 60 },
  { month: "Jul", revenue: 72, target: 65 },
  { month: "Aug", revenue: 68, target: 70 },
  { month: "Sep", revenue: 78, target: 70 },
  { month: "Oct", revenue: 82, target: 75 },
  { month: "Nov", revenue: 90, target: 80 },
  { month: "Dec", revenue: 95, target: 85 },
];

export function RevenueChart() {
  return (
    <div className="stat-card h-[300px] md:h-[340px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="font-semibold text-foreground">Revenue Overview</h3>
          <p className="text-sm text-muted-foreground">Monthly sales against target</p>
        </div>
        <div className="flex items-center gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-accent" />
            <span className="text-muted-foreground">Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-primary/40" />
            <span className="text-muted-foreground">Target</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(16, 85%, 57%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(16, 85%, 57%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(222, 47%, 15%)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="hsl(222, 47%, 15%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            tickFormatter={(value) => `₹${value}L`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
            formatter={(value: number) => [`₹${value}L`, ""]}
          />
          <Area
            type="monotone"
            dataKey="target"
            stroke="hsl(222, 47%, 15%)"
            strokeWidth={2}
            strokeDasharray="5 5"
            fillOpacity={1}
            fill="url(#colorTarget)"
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="hsl(16, 85%, 57%)"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorRevenue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
