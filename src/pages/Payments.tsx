import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  IndianRupee,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Plus,
  Calendar,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type PaymentRow = {
  id: string;
  milestone: string | null;
  amount: number | null;
  paid_amount: number | null;
  due_date: string | null;
  status: string | null;
  payment_date: string | null;
  bookings?: {
    booking_code?: string;
    customers?: { full_name?: string };
    properties?: { title?: string };
  };
};

const statusStyles: Record<string, any> = {
  received: { bg: "bg-success/10", text: "text-success", label: "Received" },
  pending: { bg: "bg-warning/10", text: "text-warning", label: "Pending" },
  overdue: { bg: "bg-destructive/10", text: "text-destructive", label: "Overdue" },
};

const Payments = () => {
  const [payments, setPayments] = useState<PaymentRow[]>([]);

  const loadPayments = useCallback(async () => {
    const { data } = await supabase
      .from("payments")
      .select(`
        *,
        bookings(
          booking_code,
          customers(full_name),
          properties(title)
        )
      `)
      .order("created_at", { ascending: false });

    const updated = (data || []).map((p: any) => {
      let status = p.status;

      if (p.paid_amount >= p.amount) status = "received";
      else if (new Date(p.due_date) < new Date()) status = "overdue";
      else status = "pending";

      return { ...p, status };
    });

    setPayments(updated);
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  // Stats
  const stats = payments.reduce(
    (acc, p) => {
      const amount = p.amount || 0;

      if (p.status === "received") acc.collected += amount;
      if (p.status === "pending") acc.pending += amount;
      if (p.status === "overdue") acc.overdue += amount;

      acc.total += amount;
      return acc;
    },
    { collected: 0, pending: 0, overdue: 0, total: 0 }
  );

  const collectionRate =
    stats.total > 0 ? (stats.collected / stats.total) * 100 : 0;

  const target = 50000000; // 5 Cr
  const progress = (stats.collected / target) * 100;

  return (
    <MainLayout
      title="Payments & Collections"
      subtitle="Track payment milestones and collections"
    >
      <div className="space-y-6">

        {/* 🔥 KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-100">
              <CheckCircle2 className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Collected</p>
              <p className="text-2xl font-bold">
                ₹{stats.collected.toLocaleString("en-IN")}
              </p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-yellow-100">
              <Clock className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">
                ₹{stats.pending.toLocaleString("en-IN")}
              </p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-100">
              <AlertCircle className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Overdue</p>
              <p className="text-2xl font-bold">
                ₹{stats.overdue.toLocaleString("en-IN")}
              </p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-100">
              <TrendingUp className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Collection Rate</p>
              <p className="text-2xl font-bold">
                {collectionRate.toFixed(0)}%
              </p>
            </div>
          </Card>
        </div>

        {/* 🔥 Monthly Target */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Collection Target</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Target: ₹5 Cr</span>
              <span>
                ₹{stats.collected.toLocaleString("en-IN")} collected (
                {progress.toFixed(0)}%)
              </span>
            </div>

            <Progress value={progress} className="h-3" />

            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="p-4 bg-green-100 rounded-lg text-center">
                <p className="text-xl font-bold text-green-600">
                  ₹{stats.collected.toLocaleString("en-IN")}
                </p>
                <p className="text-sm">Collected</p>
              </div>

              <div className="p-4 bg-yellow-100 rounded-lg text-center">
                <p className="text-xl font-bold text-yellow-600">
                  ₹{(target - stats.collected).toLocaleString("en-IN")}
                </p>
                <p className="text-sm">Remaining</p>
              </div>

              <div className="p-4 bg-blue-100 rounded-lg text-center">
                <p className="text-xl font-bold text-blue-600">8</p>
                <p className="text-sm">Days Left</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 🔥 Actions */}
        <div className="flex justify-between">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>

          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Record Payment
          </Button>
        </div>

        {/* 🔥 Table */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Schedule</CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Booking</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Milestone</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {payments.map((p) => {
                  const status = statusStyles[p.status || "pending"];

                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono">
                        {p.bookings?.booking_code}
                      </TableCell>

                      <TableCell>
                        {p.bookings?.customers?.full_name}
                      </TableCell>

                      <TableCell className="flex items-center gap-1">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        {p.bookings?.properties?.title}
                      </TableCell>

                      <TableCell>{p.milestone}</TableCell>

                      <TableCell>
                        <Calendar className="inline w-4 mr-1" />
                        {new Date(p.due_date!).toLocaleDateString()}
                      </TableCell>

                      <TableCell className="font-medium">
                        ₹{p.amount?.toLocaleString("en-IN")}
                      </TableCell>

                      <TableCell>
                        <Badge className={cn(status.bg, status.text)}>
                          {status.label}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {p.status !== "received" ? (
                          <Button size="sm" variant="outline">
                            Record Payment
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost">
                            View Receipt
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </div>
    </MainLayout>
  );
};

export default Payments;