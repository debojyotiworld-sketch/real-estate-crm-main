import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MapPin, Calendar, Plus, Navigation, CheckCircle2, AlertCircle, Car, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { usePermissions } from "@/hooks/usePermissions";

const statusStyles: Record<string, { bg: string; text: string; label: string; icon: typeof MapPin }> = {
  scheduled: {
    bg: "bg-info/10",
    text: "text-info",
    label: "Scheduled",
    icon: Calendar,
  },
  progress: {
    bg: "bg-warning/10",
    text: "text-warning",
    label: "In Progress",
    icon: Navigation,
  },
  completed: {
    bg: "bg-success/10",
    text: "text-success",
    label: "Completed",
    icon: CheckCircle2,
  },
  rescheduled: {
    bg: "bg-purple-100",
    text: "text-purple-600",
    label: "Rescheduled",
    icon: Calendar,
  },
  cancelled: {
    bg: "bg-destructive/10",
    text: "text-destructive",
    label: "Cancelled",
    icon: AlertCircle,
  },
};

const getDistanceInMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const R = 6371000; // Earth radius in meters
  const toRad = (v: number) => (v * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const SiteVisits = () => {
  const { can } = usePermissions();

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [visits, setVisits] = useState([]);
  const [clients, setClients] = useState([]);
  const [properties, setProperties] = useState([]);
  const [executives, setExecutives] = useState([]);
  const [actionVisit, setActionVisit] = useState(null);
  const [leadPropertyId, setLeadPropertyId] = useState("");
  const [visitMode, setVisitMode] = useState<"create" | "reschedule" | "revisit">("create");
  const [formData, setFormData] = useState({
    lead_id: "",
    property_id: "",
    employee_id: "",
    visit_date: "",
    visit_time: "",
    notes: "",
    property_lat: "",
    property_long: "",
  });

  const isEditMode = !!actionVisit;

  const resetForm = () => {
    setFormData({
      lead_id: "",
      property_id: "",
      employee_id: "",
      visit_date: "",
      visit_time: "",
      notes: "",
      property_lat: "",
      property_long: "",
    });
  };

  const today = new Date().toISOString().split("T")[0];

  const todaysVisitCount = useMemo(() => {
    return visits.filter(v => v.visit_date?.startsWith(today)).length;
  }, [visits]);

  const inProgressCount = visits.filter(
    (visit) => visit.status === "progress"
  ).length;

  const completedCount = visits.filter(
    (visits) => visits.status === "completed"
  ).length;

  const now = new Date();

  const firstDayOfWeek = new Date(now);
  firstDayOfWeek.setDate(now.getDate() - now.getDay());

  const lastDayOfWeek = new Date(firstDayOfWeek);
  lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
  const thisWeekCount = visits.filter((visit) => {
    if (!visit.visit_date) return false;

    const followupDate = new Date(visit.visit_date);

    return (
      followupDate >= firstDayOfWeek &&
      followupDate <= lastDayOfWeek
    );
  }).length;


  const fetchClientsVisits = async () => {
    const { data: visits, error } = await supabase
      .from("site_visits")
      .select(`
      id,
      lead_id,
      property_id,
      employee_id,
      parent_visit_id,
      visit_date,
      visit_time,
      status,
      note,
      leads:lead_id ( id, name, phone ),
      properties:property_id ( id, title ),
      employees:employee_id ( id, name )
    `)
      .order("visit_date", { ascending: true });

    if (error) {
      console.error("Fetch Error:", error);
      return;
    }

    setVisits(
      (visits || []).map((v) => ({
        ...v,
        status: v.status?.toLowerCase(),
      }))
    );

    const { data: leads } = await supabase
      .from("leads")
      .select("id,name,status")
      .eq("is_active", true);

    setClients(leads || []);
  };

  const fetchLeadProperties = async (leadId) => {
    const { data } = await supabase
      .from("lead_properties")
      .select(`id, property_id, properties(id,title,lat,long,zone_id)`)
      .eq("lead_id", leadId);

    setProperties(data || []);
    return data;
  };

  const fetchExecutives = async (zoneId?: string) => {
    if (!zoneId) return;

    const { data, error } = await supabase
      .from("employees")
      .select("id,name,zone_id")
      .eq("department", "Sales")
      .eq("zone_id", zoneId);

    if (error) {
      console.error(error);
      return;
    }

    setExecutives(data || []);
  };

  const handleSubmit = async () => {
    try {
      if (
        !formData.lead_id ||
        !formData.property_id ||
        !formData.employee_id ||
        !formData.visit_date ||
        !formData.visit_time
      ) {
        alert("Please fill required fields");
        return;
      }

      const { data, error } = await supabase
        .from("site_visits")
        .insert([
          {
            lead_id: formData.lead_id,
            property_id: formData.property_id,
            employee_id: formData.employee_id,
            visit_date: formData.visit_date,
            visit_time: formData.visit_time,
            note: formData.notes,
            status: "scheduled",
            parent_visit_id: actionVisit?.id || null,
          },
        ])
        .select();

      if (error) {
        console.error("Insert error:", error);
        alert("Failed to schedule visit");
        return;
      }

      console.log("Inserted:", data);

      // update lead property
      if (leadPropertyId) {
        await supabase
          .from("lead_properties")
          .update({
            visit_status: "scheduled",
            is_active: true,
            removed_at: null
          })
          .eq("id", leadPropertyId);
      }

      setOpenModal(false);
      setActionVisit(null);

    } catch (err) {
      console.error(err);
    }
  };

  const handleSchedule = () => {
    setVisitMode("create");
    setActionVisit(null);
    setLeadPropertyId("");
    setProperties([]);
    setExecutives([]);

    setFormData({
      lead_id: "",
      property_id: "",
      employee_id: "",
      visit_date: "",
      visit_time: "",
      notes: "",
      property_lat: "",
      property_long: "",
    });

    setOpenModal(true);
  };

  const handleReschedule = async (visit: any) => {
    setActionVisit(visit);
    resetForm();

    const props = await fetchLeadProperties(visit.lead_id);

    const selected = properties.find(
      p => p.property_id === visit.property_id
    );

    const zoneId = selected?.properties?.zone_id;

    if (zoneId) {
      fetchExecutives(zoneId);
    }

    setFormData({
      lead_id: visit.lead_id,
      property_id: visit.property_id,
      employee_id: visit.employee_id || "",
      visit_date: "",
      visit_time: "",
      notes: "",
      property_lat: "",
      property_long: "",
    });

    setOpenModal(true);
  };

  const handleRevisit = async (visit: any) => {
    setActionVisit(visit);
    resetForm();
    await fetchLeadProperties(visit.lead_id);

    setFormData({
      lead_id: visit.lead_id,
      property_id: visit.property_id,
      employee_id: visit.employee_id || "",
      visit_date: "",
      visit_time: "",
      notes: "",
      property_lat: "",
      property_long: "",
    });

    const { data } = await supabase
      .from("lead_properties")
      .select("id")
      .eq("lead_id", visit.lead_id)
      .eq("property_id", visit.property_id)
      .single();

    if (data) {
      setLeadPropertyId(data.id);
    }

    setOpenModal(true);
  };

  const cancelVisit = async (id) => {
    await supabase
      .from("site_visits")
      .update({ status: "cancelled" })
      .eq("id", id);

    fetchClientsVisits();
  };

  const completeVisit = async (id) => {
    await supabase
      .from("site_visits")
      .update({ status: "completed" })
      .eq("id", id);

    fetchClientsVisits();
  };

  const todayVisits = visits.filter(
    (visit) =>
      visit.visit_date?.startsWith(today) &&
      visit.status !== "cancelled"
  );

  useEffect(() => {
    if (formData.property_id && properties.length) {
      const selected = properties.find(
        p => p.property_id === formData.property_id
      );

      if (selected?.properties?.zone_id) {
        fetchExecutives(selected.properties.zone_id);
      }
    }
  }, [formData.property_id, properties]);

  useEffect(() => {
    fetchClientsVisits();
  }, []);

  const handleVisitAction = async (visit, type: "start" | "end") => {
    setActionLoading(visit.id);

    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;

      if (!userId) throw new Error("Unauthorized");

      const { data: property, error: propError } = await supabase
        .from("properties")
        .select("lat, long")
        .eq("id", visit.property_id)
        .single();

      if (propError || !property) {
        throw new Error("Property location not found");
      }

      const propLat = Number(property.lat);
      const propLong = Number(property.long);

      if (!propLat || !propLong) {
        toast.error("Property location missing");
        return;
      }

      const position = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej)
      );

      const lat = position.coords.latitude;
      const long = position.coords.longitude;

      const distance = getDistanceInMeters(lat, long, propLat, propLong);

      if (distance > 50) {
        toast.error(
          type === "start"
            ? `You are too far from the property`
            : `You are too far from the property`
        );
        return;
      }

      const now = new Date();
      const timeString = now.toTimeString().split(" ")[0];

      // ================= START =================
      if (type === "start") {
        const { data: existing } = await supabase
          .from("site_visit_punches")
          .select("id")
          .eq("employee_id", visit.employee_id)
          .eq("attendance_date", visit.visit_date)
          .is("punch_out", null)
          .maybeSingle();

        if (existing) {
          toast.warning("Already checked in");
          return;
        }

        const { error: punchError } = await supabase
          .from("site_visit_punches")
          .insert([{
            employee_id: visit.employee_id,
            attendance_date: visit.visit_date,
            punch_in: timeString,
            employee_latitude: lat,
            employee_longitude: long,
            site_visits_id: visit.id,
          }]);

        if (punchError) throw punchError;

        setVisits(prev =>
          prev.map(v =>
            v.id === visit.id
              ? {
                ...v,
                status: "progress",
                check_in_time: now.toISOString(),
                gps_verified: true,
              }
              : v
          )
        );

        await supabase
          .from("site_visits")
          .update({
            status: "progress",
            check_in_time: now.toISOString(),
            gps_verified: true,
          })
          .eq("id", visit.id);

        toast.success("Visit started");
      }

      // ================= END =================
      else {
        const { error: punchError } = await supabase
          .from("site_visit_punches")
          .update({
            punch_out: timeString,
            employee_latitude: lat,
            employee_longitude: long,
          })
          .eq("site_visits_id", visit.id)
          .is("punch_out", null);

        if (punchError) throw punchError;

        setVisits(prev =>
          prev.map(v =>
            v.id === visit.id
              ? {
                ...v,
                status: "completed",
                check_out_time: now.toISOString(),
                gps_verified: true,
              }
              : v
          )
        );

        await supabase
          .from("site_visits")
          .update({
            status: "completed",
            check_out_time: now.toISOString(),
            gps_verified: true,
          })
          .eq("id", visit.id);

        toast.success("Visit completed");
      }

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <MainLayout
      title="Site Visits"
      subtitle="Schedule and track property visits"
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-info/10 rounded-xl">
                  <Calendar className="w-6 h-6 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Today's Visits</p>
                  <p className="text-2xl font-bold">{todaysVisitCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-warning/10 rounded-xl">
                  <Navigation className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold">{inProgressCount}</p>
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
                  <p className="text-2xl font-bold">{completedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-accent/10 rounded-xl">
                  <Car className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">This Week</p>
                  <p className="text-2xl font-bold">{thisWeekCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end">
          <Button
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
            onClick={handleSchedule}
          >
            <Plus className="w-4 h-4 mr-2" />
            Schedule Visit
          </Button>

          <Dialog
            open={openModal}
            onOpenChange={(open) => {
              setOpenModal(open);

              if (!open) {
                resetForm();
                setActionVisit(null);
                setProperties([]);
                setExecutives([]);
                setLeadPropertyId("");
                setVisitMode("create");
              }
            }}
          >
            <DialogContent className="max-w-xl p-0 overflow-hidden">

              {/* HEADER */}
              <div className="px-6 py-4 border-b bg-muted/40">
                <DialogTitle className="text-lg font-semibold">
                  {isEditMode ? "Update Visit" : "Schedule Site Visit"}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Assign property visit to executive
                </p>
              </div>

              {/* BODY */}
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* Client */}
                  <div>
                    <Label className="text-xs text-muted-foreground">Client</Label>
                    <Select
                      value={formData.lead_id}
                      onValueChange={async (value) => {
                        setFormData(prev => ({ ...prev, lead_id: value }));

                        await fetchLeadProperties(value);
                      }}
                      disabled={isEditMode}
                    >
                      <SelectTrigger disabled={isEditMode} className="mt-1">
                        <SelectValue placeholder="Select Client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Property */}
                  <div>
                    <Label className="text-xs text-muted-foreground">Property</Label>
                    <Select
                      value={formData.property_id}
                      onValueChange={(value) => {
                        const selected = properties.find(p => p.property_id === value);

                        setFormData(prev => ({ ...prev, property_id: value }));

                        fetchExecutives(selected?.properties?.zone_id);
                      }}
                    >
                      <SelectTrigger disabled={isEditMode} className="mt-1">
                        <SelectValue placeholder="Select Property" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.map((prop) => (
                          <SelectItem key={prop.property_id} value={prop.property_id}>
                            {prop.properties.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* DATE + TIME */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Visit Date</Label>
                    <Input
                      type="date"
                      className="mt-1"
                      onChange={(e) =>
                        setFormData({ ...formData, visit_date: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Visit Time</Label>
                    <Input
                      type="time"
                      className="mt-1"
                      onChange={(e) =>
                        setFormData({ ...formData, visit_time: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* EXECUTIVE */}
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Assign Executive
                  </Label>
                  <Select
                    value={formData.employee_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, employee_id: value })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select Executive" />
                    </SelectTrigger>
                    <SelectContent>
                      {executives.map((exec) => (
                        <SelectItem key={exec.id} value={exec.id}>
                          {exec.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

              </div>

              {/* FOOTER */}
              <div className="px-6 py-4 border-t flex justify-between items-center bg-muted/30">
                <Button variant="ghost" onClick={() => setOpenModal(false)}>
                  Cancel
                </Button>

                <Button onClick={handleSubmit} className="px-6">
                  {isEditMode ? "Update Visit" : "Confirm Schedule"}
                </Button>
              </div>

            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="today" className="space-y-6">
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            {/* <TabsTrigger value="upcoming">Upcoming</TabsTrigger> */}
            <TabsTrigger value="all">All Visits</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Client</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Executive</TableHead>
                      <TableHead>GPS</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visits.map((visit) => {
                      const status = statusStyles[visit.status?.toLowerCase()] || statusStyles["scheduled"];
                      const revisitCount = visits.filter(
                        (v) =>
                          v.parent_visit_id === visit.id &&
                          v.status === "revisited"
                      ).length;

                      const rescheduleCount = visits.filter(
                        (v) =>
                          v.parent_visit_id === visit.id &&
                          v.status === "rescheduled"
                      ).length;
                      return (
                        <TableRow key={visit.id} className="table-row-hover">

                          {/* Client */}
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback className="bg-accent/10 text-accent">
                                  {visit.leads?.name
                                    ?.split(" ")
                                    .map((n) => n[0])
                                    .join("") || ""}
                                </AvatarFallback>
                              </Avatar>

                              <div>
                                <p className="font-medium">{visit.leads?.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {visit.leads?.phone}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          {/* Property */}
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                              {visit.properties?.title}
                            </div>
                          </TableCell>

                          {/* Date */}
                          <TableCell>
                            <div>
                              <p className="font-medium">{visit.visit_date}</p>
                              <p className="text-sm text-muted-foreground">
                                {visit.visit_time}
                              </p>
                            </div>
                          </TableCell>

                          {/* Executive */}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                  {visit.employees?.name
                                    ?.split(" ")
                                    .map((n) => n[0])
                                    .join("") || ""}
                                </AvatarFallback>
                              </Avatar>

                              <span className="text-sm">
                                {visit.employees?.name}
                              </span>
                            </div>
                          </TableCell>

                          {/* GPS */}
                          <TableCell>
                            <Badge variant="outline">Pending</Badge>
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(status.bg, status.text, "border-0")}
                            >
                              {status.label}
                            </Badge>
                          </TableCell>

                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="today">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Client</TableHead>
                        <TableHead>Property</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Executive</TableHead>
                        <TableHead>GPS</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {todayVisits.map((visit) => {
                        const status = statusStyles[visit.status?.toLowerCase()] || statusStyles["scheduled"];

                        return (
                          <TableRow key={visit.id} className="table-row-hover">

                            {/* Client */}
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarFallback className="bg-accent/10 text-accent">
                                    {visit.leads?.name
                                      ?.split(" ")
                                      .map((n) => n[0])
                                      .join("") || ""}
                                  </AvatarFallback>
                                </Avatar>

                                <div>
                                  <p className="font-medium">{visit.leads?.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {visit.leads?.phone}
                                  </p>
                                </div>
                              </div>
                            </TableCell>

                            {/* Property */}
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Building2 className="w-4 h-4 text-muted-foreground" />
                                {visit.properties?.title}
                              </div>
                            </TableCell>

                            {/* Date */}
                            <TableCell>
                              <div>
                                <p className="font-medium">{visit.visit_date}</p>
                                <p className="text-sm text-muted-foreground">
                                  {visit.visit_time}
                                </p>
                              </div>
                            </TableCell>

                            {/* Executive */}
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="w-6 h-6">
                                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                    {visit.employees?.name
                                      ?.split(" ")
                                      .map((n) => n[0])
                                      .join("") || ""}
                                  </AvatarFallback>
                                </Avatar>

                                <span className="text-sm">
                                  {visit.employees?.name}
                                </span>
                              </div>
                            </TableCell>

                            {/* GPS */}
                            <TableCell>
                              <Badge variant="outline">Pending</Badge>
                            </TableCell>

                            {/* Status */}
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn(status.bg, status.text, "border-0")}
                              >
                                {status.label}
                              </Badge>
                            </TableCell>

                            <TableCell>
                              <div className="flex gap-2">

                                {/* Cancel button */}
                                {can("!edit_site_visits") && visit.status === "scheduled" && (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => cancelVisit(visit.id)}
                                  >
                                    Cancel
                                  </Button>
                                )}

                                {/* Reschedule button */}
                                {can("edit_site_visits") && visit.status === "cancelled" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleReschedule(visit)}
                                  >
                                    Reschedule
                                  </Button>
                                )}

                                {/* Revisit button */}
                                {can("edit_site_visits") && visit.status === "completed" && (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleRevisit(visit)}
                                  >
                                    Revisit
                                  </Button>
                                )}

                                {can("edit_site_visits") && visit.status === "scheduled" && (
                                  <Button
                                    size="sm"
                                    disabled={actionLoading === visit.id}
                                    onClick={() => handleVisitAction(visit, "start")}
                                  >
                                    {actionLoading === visit.id ? "Checking In..." : "Check In"}
                                  </Button>
                                )}

                                {can("edit_site_visits") && visit.status === "progress" && (
                                  <Button
                                    size="sm"
                                    disabled={actionLoading === visit.id}
                                    onClick={() => handleVisitAction(visit, "end")}
                                  >
                                    {actionLoading === visit.id ? "Checking Out..." : "Check Out"}
                                  </Button>
                                )}
                              </div>
                            </TableCell>

                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
          </TabsContent>

          <TabsContent value="upcoming">
            <Card className="p-6">
              <p className="text-muted-foreground text-center">Upcoming visits will appear here</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default SiteVisits;
