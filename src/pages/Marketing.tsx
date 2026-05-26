import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  MessageSquare,
  Mail,
  Smartphone,
  TrendingUp,
  Plus,
  Send,
  Users,
  Eye,
  MousePointer,
} from "lucide-react";
import { cn } from "@/lib/utils";

const campaigns = [
  {
    id: 1,
    name: "New Year Property Sale",
    type: "WhatsApp",
    sent: 5000,
    delivered: 4850,
    opened: 3200,
    clicked: 450,
    status: "completed",
    date: "1 Jan 2026",
  },
  {
    id: 2,
    name: "Sky Villas Launch",
    type: "Email",
    sent: 8000,
    delivered: 7600,
    opened: 2800,
    clicked: 380,
    status: "completed",
    date: "28 Dec 2025",
  },
  {
    id: 3,
    name: "Weekend Site Visit Offer",
    type: "SMS",
    sent: 3000,
    delivered: 2950,
    opened: 2950,
    clicked: 220,
    status: "active",
    date: "5 Jan 2026",
  },
  {
    id: 4,
    name: "Premium Properties Newsletter",
    type: "Email",
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    status: "scheduled",
    date: "10 Jan 2026",
  },
];

const channelData = [
  { channel: "WhatsApp", leads: 420, conversions: 52 },
  { channel: "Email", leads: 380, conversions: 38 },
  { channel: "SMS", leads: 220, conversions: 28 },
  { channel: "Facebook", leads: 180, conversions: 22 },
  { channel: "Google", leads: 150, conversions: 18 },
];

const typeIcons: Record<string, typeof MessageSquare> = {
  WhatsApp: MessageSquare,
  Email: Mail,
  SMS: Smartphone,
};

const statusStyles: Record<string, { bg: string; text: string }> = {
  completed: { bg: "bg-success/10", text: "text-success" },
  active: { bg: "bg-info/10", text: "text-info" },
  scheduled: { bg: "bg-warning/10", text: "text-warning" },
  draft: { bg: "bg-muted", text: "text-muted-foreground" },
};

const Marketing = () => {
  return (
    <MainLayout
      title="Marketing Automation"
      subtitle="Manage campaigns and track performance"
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-accent/10 rounded-xl">
                  <Send className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Messages Sent</p>
                  <p className="text-2xl font-bold">16K</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-info/10 rounded-xl">
                  <Eye className="w-6 h-6 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Open Rate</p>
                  <p className="text-2xl font-bold">58%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-success/10 rounded-xl">
                  <MousePointer className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Click Rate</p>
                  <p className="text-2xl font-bold">6.8%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-warning/10 rounded-xl">
                  <Users className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Leads Generated</p>
                  <p className="text-2xl font-bold">158</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button variant="outline">
            <MessageSquare className="w-4 h-4 mr-2" />
            WhatsApp Broadcast
          </Button>
          <Button variant="outline">
            <Mail className="w-4 h-4 mr-2" />
            Email Campaign
          </Button>
          <Button variant="outline">
            <Smartphone className="w-4 h-4 mr-2" />
            SMS Campaign
          </Button>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Plus className="w-4 h-4 mr-2" />
            New Campaign
          </Button>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Channel Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={channelData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="channel"
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
                    <Bar
                      dataKey="leads"
                      fill="hsl(16, 85%, 57%)"
                      radius={[4, 4, 0, 0]}
                      name="Leads"
                    />
                    <Bar
                      dataKey="conversions"
                      fill="hsl(142, 71%, 45%)"
                      radius={[4, 4, 0, 0]}
                      name="Conversions"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Campaigns */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Campaigns</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {campaigns.map((campaign) => {
                const Icon = typeIcons[campaign.type];
                const status = statusStyles[campaign.status];
                const deliveryRate =
                  campaign.sent > 0
                    ? Math.round((campaign.delivered / campaign.sent) * 100)
                    : 0;
                return (
                  <div
                    key={campaign.id}
                    className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-accent/10 rounded-lg">
                          <Icon className="w-4 h-4 text-accent" />
                        </div>
                        <div>
                          <p className="font-medium">{campaign.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {campaign.type} • {campaign.date}
                          </p>
                        </div>
                      </div>
                      <Badge className={cn(status.bg, status.text, "border-0 capitalize")}>
                        {campaign.status}
                      </Badge>
                    </div>
                    {campaign.sent > 0 && (
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <p className="text-lg font-semibold">{campaign.sent.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Sent</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold">{deliveryRate}%</p>
                          <p className="text-xs text-muted-foreground">Delivered</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold">
                            {Math.round((campaign.opened / campaign.delivered) * 100) || 0}%
                          </p>
                          <p className="text-xs text-muted-foreground">Opened</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-success">
                            {campaign.clicked}
                          </p>
                          <p className="text-xs text-muted-foreground">Clicks</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Marketing;
