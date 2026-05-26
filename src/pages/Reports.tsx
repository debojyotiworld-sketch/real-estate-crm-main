import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  Users,
  Building2,
  IndianRupee,
  Target,
  Download,
  Calendar,
} from "lucide-react";

const sourceData = [
  { name: "Facebook", leads: 320, conversions: 48 },
  { name: "Google", leads: 280, conversions: 42 },
  { name: "Website", leads: 200, conversions: 35 },
  { name: "Walk-in", leads: 150, conversions: 38 },
  { name: "Referral", leads: 180, conversions: 45 },
  { name: "Portal", leads: 120, conversions: 22 },
];

const performanceData = [
  { name: "Ravi K.", leads: 85, converted: 18, target: 20 },
  { name: "Sneha M.", leads: 72, converted: 15, target: 18 },
  { name: "Raj V.", leads: 65, converted: 12, target: 15 },
  { name: "Anita S.", leads: 90, converted: 22, target: 25 },
  { name: "Vikram R.", leads: 55, converted: 10, target: 12 },
];

const inventoryData = [
  { name: "Available", value: 352, color: "hsl(142, 71%, 45%)" },
  { name: "Booked", value: 350, color: "hsl(38, 92%, 50%)" },
  { name: "Sold", value: 298, color: "hsl(199, 89%, 48%)" },
];

const monthlyRevenue = [
  { month: "Jul", revenue: 18, collections: 15 },
  { month: "Aug", revenue: 22, collections: 18 },
  { month: "Sep", revenue: 25, collections: 22 },
  { month: "Oct", revenue: 28, collections: 24 },
  { month: "Nov", revenue: 32, collections: 28 },
  { month: "Dec", revenue: 38, collections: 35 },
];

const Reports = () => {
  return (
    <MainLayout
      title="Reports & Analytics"
      subtitle="Comprehensive business insights"
    >
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            <Select defaultValue="this-month">
              <SelectTrigger className="w-[180px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="this-quarter">This Quarter</SelectItem>
                <SelectItem value="this-year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Reports
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Leads</p>
                  <p className="text-3xl font-bold mt-1">1,284</p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="w-4 h-4 text-success" />
                    <span className="text-sm text-success">+12.5%</span>
                  </div>
                </div>
                <div className="p-4 bg-accent/10 rounded-xl">
                  <Users className="w-8 h-8 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                  <p className="text-3xl font-bold mt-1">18.5%</p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="w-4 h-4 text-success" />
                    <span className="text-sm text-success">+2.3%</span>
                  </div>
                </div>
                <div className="p-4 bg-success/10 rounded-xl">
                  <Target className="w-8 h-8 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Properties Sold</p>
                  <p className="text-3xl font-bold mt-1">156</p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="w-4 h-4 text-success" />
                    <span className="text-sm text-success">+8.2%</span>
                  </div>
                </div>
                <div className="p-4 bg-info/10 rounded-xl">
                  <Building2 className="w-8 h-8 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-3xl font-bold mt-1">₹38 Cr</p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="w-4 h-4 text-success" />
                    <span className="text-sm text-success">+15.8%</span>
                  </div>
                </div>
                <div className="p-4 bg-primary/10 rounded-xl">
                  <IndianRupee className="w-8 h-8 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lead Source Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Source Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sourceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="leads" fill="hsl(16, 85%, 57%)" radius={[4, 4, 0, 0]} name="Leads" />
                    <Bar dataKey="conversions" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} name="Conversions" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Revenue & Collections */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue & Collections (₹ Cr)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyRevenue}>
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
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(16, 85%, 57%)"
                      strokeWidth={3}
                      dot={{ fill: "hsl(16, 85%, 57%)", r: 4 }}
                      name="Revenue"
                    />
                    <Line
                      type="monotone"
                      dataKey="collections"
                      stroke="hsl(142, 71%, 45%)"
                      strokeWidth={3}
                      dot={{ fill: "hsl(142, 71%, 45%)", r: 4 }}
                      name="Collections"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inventory Status */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={inventoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {inventoryData.map((entry, index) => (
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
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                {inventoryData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-muted-foreground">
                      {item.name}: {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Employee Performance */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Employee Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceData.map((emp) => {
                  const percentage = Math.round((emp.converted / emp.target) * 100);
                  return (
                    <div key={emp.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{emp.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {emp.leads} leads
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {emp.converted}/{emp.target} conversions
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              percentage >= 100
                                ? "bg-success"
                                : percentage >= 75
                                ? "bg-warning"
                                : "bg-destructive"
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        <span
                          className={`text-sm font-medium ${
                            percentage >= 100
                              ? "text-success"
                              : percentage >= 75
                              ? "text-warning"
                              : "text-destructive"
                          }`}
                        >
                          {percentage}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Reports;
