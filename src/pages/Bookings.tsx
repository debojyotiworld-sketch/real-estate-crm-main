import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Plus, FileText, CheckCircle2, Clock, AlertTriangle, IndianRupee, Building2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCallback, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import NewBookingModal from "@/components/NewBookingModal";

const stageStyles = {
  booking: { bg: "bg-info/10", text: "text-info", label: "Booking", icon: Clock, group: "new" },
  allotment: { bg: "bg-warning/10", text: "text-warning", label: "Allotment", icon: FileText, group: "inProgress" },
  agreement: { bg: "bg-accent/10", text: "text-accent", label: "Agreement", icon: FileText, group: "inProgress" },
  registration: { bg: "bg-primary/10", text: "text-primary", label: "Registration", icon: Calendar, group: "inProgress" },
  completed: { bg: "bg-success/10", text: "text-success", label: "Completed", icon: CheckCircle2, group: "completed" },
  cancelled: { bg: "bg-destructive/10", text: "text-destructive", label: "Cancelled", icon: AlertTriangle, group: "cancelled" },
} as const;

type BookingRow = {
  id: string;
  booking_code: string | null;
  booking_date: string | null;
  total_amount: number | null;
  token_amount: number | null;
  stage: keyof typeof stageStyles | string | null;
  customers?: { full_name?: string | null } | null;
  properties?: { title?: string | null } | null;
  employees?: { name?: string | null } | null;
};

const Bookings = () => {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const stats = bookings.reduce(
    (acc, booking) => {
      const stage = booking.stage as keyof typeof stageStyles;
      const config = stageStyles[stage];

      if (!config) return acc;

      if (config.group === "new") acc.new++;
      if (config.group === "inProgress") acc.inProgress++;
      if (config.group === "completed") acc.completed++;
      if (config.group === "cancelled") acc.cancelled++;

      acc.total_amount += booking.total_amount || 0;

      return acc;
    },
    {
      new: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
      total_amount: 0,
    }
  );

  const loadBookings = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("bookings")
      .select(`
          *,
          customers(full_name),
          properties(title),
          employees(name)
        `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setBookings((data || []) as BookingRow[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  return (
    <MainLayout
      title="Bookings & Sales"
      subtitle="Track booking status and sales pipeline"
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-info/10 rounded-xl">
                  <Clock className="w-6 h-6 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">New Bookings</p>
                  <p className="text-2xl font-bold">{stats.new}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-warning/10 rounded-xl">
                  <FileText className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold">{stats.inProgress}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-success/10 rounded-xl">
                  <CheckCircle2 className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-accent/10 rounded-xl">
                  <IndianRupee className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">₹{stats.total_amount.toLocaleString("en-IN")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end">
          <Button onClick={() => setOpen(true)} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Plus className="w-4 h-4 mr-2" />
            New Booking
          </Button>
          <NewBookingModal
            open={open}
            onClose={() => setOpen(false)}
            onSuccess={() => void loadBookings()}
          />
        </div>

        {/* Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              {["Booking", "Allotment", "Agreement", "Registration", "Completed"].map(
                (stage, index) => (
                  <div key={stage} className="relative">
                    <div
                      className={cn(
                        "p-4 rounded-lg text-center",
                        index === 0
                          ? "bg-info/10"
                          : index === 1
                            ? "bg-warning/10"
                            : index === 2
                              ? "bg-accent/10"
                              : index === 3
                                ? "bg-primary/10"
                                : "bg-success/10"
                      )}
                    >
                      <p className="text-2xl font-bold">
                        {index === 0
                          ? "12"
                          : index === 1
                            ? "8"
                            : index === 2
                              ? "15"
                              : index === 3
                                ? "5"
                                : "156"}
                      </p>
                      <p className="text-sm text-muted-foreground">{stage}</p>
                    </div>
                    {index < 4 && (
                      <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 text-muted-foreground">
                        →
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bookings Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Booking ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Booking Date</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Token</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Executive</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => {
                  const stageKey = booking.stage as keyof typeof stageStyles;
                  const stage = stageStyles[stageKey] ?? stageStyles.booking;
                  const StageIcon = stage.icon;
                  return (
                    <TableRow key={booking.id} className="table-row-hover">
                      <TableCell className="font-mono font-medium">
                        {booking.booking_code}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          {booking.customers?.full_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium flex items-center gap-1">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            {booking.properties?.title}
                          </p>
                          <p className="text-sm text-muted-foreground">Booked property</p>
                        </div>
                      </TableCell>
                      <TableCell>{booking.booking_date}</TableCell>
                      <TableCell className="font-medium">
                        ₹{booking.total_amount?.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-success">
                        ₹{booking.token_amount?.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(stage.bg, stage.text, "border-0")}>
                          <StageIcon className="w-3 h-3 mr-1" />
                          {stage.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {booking.employees?.name}
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

export default Bookings;
