import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";

type CallLog = {
  id: string;
  employee_id: string;
  employee_name?: string;
  contact_name: string | null;
  contact_phone: string;
  lead_id: string | null;
  call_type: "incoming" | "outgoing" | "missed";
  call_status: "completed" | "no_answer" | "busy" | "failed";
  duration_seconds: number;
  call_date: string;
  call_time: string;
  note: string | null;
  created_at: string;
};

const CallLogs = () => {
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    contact_name: "",
    contact_phone: "",
    call_type: "outgoing",
    call_status: "completed",
    duration_seconds: 0,
    note: "",
  });

  const location = useLocation();

  const fetchCallLogs = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("call_logs")
      .select(`
        *,
        leads (
          name,
          phone
        ),
        profiles!call_logs_employee_id_fkey (
          id,
          name
        )
      `)
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    else {
      const formattedData: CallLog[] = (data || []).map((log: any) => ({
        ...log,
        contact_name: log.leads?.name || null,
        contact_phone: log.leads?.phone || "",
        employee_name: log.profiles?.name || "Unknown",
        call_type: log.call_type as "incoming" | "outgoing" | "missed",
        call_status: log.call_status as "completed" | "no_answer" | "busy" | "failed",
        duration_seconds: Number(log.duration_seconds || 0),
      }));

      setCallLogs(formattedData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCallLogs();
  }, [location]);

  const filteredLogs = callLogs.filter((log) => {
    const matchesSearch =
      log.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.contact_phone.includes(searchQuery);

    const matchesType =
      selectedType === "all" || log.call_type === selectedType;

    const matchesStatus =
      selectedStatus === "all" || log.call_status === selectedStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const createCallLog = async () => {
    if (!form.contact_phone) return alert("Phone required");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("call_logs").insert([
      {
        employee_id: user?.id,
        contact_name: form.contact_name || null,
        contact_phone: form.contact_phone,
        call_type: form.call_type,
        call_status: form.call_status,
        duration_seconds: Number(form.duration_seconds),
        note: form.note || null,
      },
    ]);

    if (error) {
      console.error(error);
      return;
    }

    setOpen(false);
    setForm({
      contact_name: "",
      contact_phone: "",
      call_type: "outgoing",
      call_status: "completed",
      duration_seconds: 0,
      note: "",
    });

    fetchCallLogs();
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  return (
    <MainLayout title="Call Logs" subtitle="Track all call activities">
      <div className="space-y-6">

        {/* FILTERS */}
        <div className="flex flex-wrap gap-3">
          <Input
            placeholder="Search name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <Select onValueChange={setSelectedType} value={selectedType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Call Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="incoming">Incoming</SelectItem>
              <SelectItem value="outgoing">Outgoing</SelectItem>
              <SelectItem value="missed">Missed</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={setSelectedStatus} value={selectedStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="no_answer">No Answer</SelectItem>
              <SelectItem value="busy">Busy</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          {/* <Button onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Call
          </Button> */}
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.contact_name || "-"}</TableCell>
                  <TableCell>{log.contact_phone}</TableCell>

                  <TableCell>
                    <Badge>{log.call_type}</Badge>
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline">{log.call_status}</Badge>
                  </TableCell>

                  <TableCell>{formatDuration(log.duration_seconds)}</TableCell>

                  <TableCell>
                    {new Date(log.call_date).toLocaleDateString()}
                  </TableCell>

                  <TableCell>{log.employee_name || "Unknown"}</TableCell>

                  <TableCell>{log.note || "-"}</TableCell>
                </TableRow>
              ))}

              {!filteredLogs.length && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6">
                    No call logs found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {open && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-white p-6 rounded-xl w-[400px] space-y-4">
              <h2 className="text-lg font-semibold">Add Call Log</h2>

              <Input
                placeholder="Name"
                value={form.contact_name}
                onChange={(e) =>
                  setForm({ ...form, contact_name: e.target.value })
                }
              />

              <Input
                placeholder="Phone *"
                value={form.contact_phone}
                onChange={(e) =>
                  setForm({ ...form, contact_phone: e.target.value })
                }
              />

              <Input
                type="number"
                placeholder="Duration (seconds)"
                value={form.duration_seconds}
                onChange={(e) =>
                  setForm({ ...form, duration_seconds: Number(e.target.value) })
                }
              />

              <Input
                placeholder="Note"
                value={form.note}
                onChange={(e) =>
                  setForm({ ...form, note: e.target.value })
                }
              />

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createCallLog}>
                  Save
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default CallLogs;
