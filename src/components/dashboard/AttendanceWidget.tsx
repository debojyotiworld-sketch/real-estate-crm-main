import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Wifi, CheckCircle2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const today = () => new Date().toISOString().split("T")[0];

const normalize = (t: string | null | undefined) => (t && t.trim() ? t : null);

const hhmm = (t: string | null) => (t ? t.slice(0, 5) : "-");

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

type BranchNetwork = {
  branch_name: string;
  branch_ip: JsonValue;
  branch_ip_cidrs: JsonValue[] | null;
  is_active: boolean;
};

const getGeo = () =>
  new Promise<GeolocationPosition>((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject)
  );

const getPublicIp = async () => {
  const response = await fetch("https://api.ipify.org?format=json");
  if (!response.ok) {
    throw new Error("Unable to detect current network IP");
  }

  const data = (await response.json()) as { ip?: string };
  if (!data.ip) {
    throw new Error("Current network IP was not returned");
  }

  return data.ip;
};

const ipv4ToNumber = (ip: string) => {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return null;
  }

  return parts.reduce((acc, part) => (acc << 8) + part, 0) >>> 0;
};

const matchesCidr = (ip: string, cidr: string) => {
  const [range, prefixText] = cidr.split("/");
  const prefix = Number(prefixText);
  const ipNumber = ipv4ToNumber(ip);
  const rangeNumber = ipv4ToNumber(range);

  if (ipNumber === null || rangeNumber === null || Number.isNaN(prefix) || prefix < 0 || prefix > 32) {
    return false;
  }

  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (ipNumber & mask) === (rangeNumber & mask);
};

const extractIpRules = (value: JsonValue | JsonValue[] | undefined): string[] => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.flatMap((item) => extractIpRules(item));
  }

  if (typeof value === "string") {
    return value
      .split(/[\n,]/g)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "object") {
    const record = value as Record<string, JsonValue>;
    return extractIpRules(record.value ?? record.ip ?? record.cidr);
  }

  return [];
};

const isIpAllowed = (currentIp: string, rules: string[]) => {
  return rules.some((rule) => {
    const normalizedRule = rule.trim();
    if (!normalizedRule) return false;

    if (normalizedRule.includes("/")) {
      return matchesCidr(currentIp, normalizedRule);
    }

    return normalizedRule === currentIp;
  });
};

export function AttendanceWidget() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [attendanceType, setAttendanceType] = useState<"office" | "field">("office");
  const [punchIn, setPunchIn] = useState<string | null>(null);
  const [punchOut, setPunchOut] = useState<string | null>(null);

  const fetchToday = useCallback(async (empId: string, type: string) => {
    if (type === "field") {
      const { data } = await supabase
        .from("site_visit_punches")
        .select("punch_in, punch_out")
        .eq("employee_id", empId)
        .eq("attendance_date", today())
        .order("punch_in", { ascending: true })
        .limit(1)
        .maybeSingle();

      setPunchIn(normalize(data?.punch_in));
      setPunchOut(normalize(data?.punch_out));
      return;
    }

    const { data } = await supabase
      .from("attendance_logs")
      .select("punch_in, punch_out")
      .eq("employee_id", empId)
      .eq("attendance_date", today())
      .maybeSingle();

    setPunchIn(normalize(data?.punch_in));
    setPunchOut(normalize(data?.punch_out));
  }, []);

  const init = useCallback(async () => {
    try {
      const { data: user } = await supabase.auth.getUser();

      const { data: emp } = await supabase
        .from("employees")
        .select("id, attendance_type, branch_id")
        .eq("user_id", user.user?.id)
        .single();

      setEmployeeId(emp.id);
      setBranchId(emp.branch_id ?? null);

      const type = (emp.attendance_type || "office").toLowerCase();
      const normalizedType = type === "field" ? "field" : "office";
      setAttendanceType(normalizedType);

      await fetchToday(emp.id, normalizedType);
    } catch (e) {
      console.error(e);
      toast.error("Init failed");
    } finally {
      setLoading(false);
    }
  }, [fetchToday]);

  useEffect(() => {
    void init();
  }, [init]);

  const validateOfficeNetwork = async () => {
    if (!branchId) {
      throw new Error("No branch assigned to your employee profile");
    }

    const { data: branch, error } = await supabase
      .from("branches")
      .select("branch_name, branch_ip, branch_ip_cidrs, is_active")
      .eq("id", branchId)
      .maybeSingle<BranchNetwork>();

    if (error) throw error;
    if (!branch) {
      throw new Error("Assigned branch was not found");
    }
    if (!branch.is_active) {
      throw new Error(`${branch.branch_name} branch is inactive`);
    }

    const allowedRules = [
      ...extractIpRules(branch.branch_ip),
      ...extractIpRules(branch.branch_ip_cidrs ?? []),
    ];

    if (!allowedRules.length) {
      throw new Error(`No office IP rules configured for ${branch.branch_name}`);
    }

    const currentIp = await getPublicIp();

    if (!isIpAllowed(currentIp, allowedRules)) {
      throw new Error(`Office punch-in allowed only from ${branch.branch_name} network. Current IP: ${currentIp}`);
    }
  };

  const punchOffice = async () => {
    const isIn = punchIn && !punchOut;

    if (!isIn) {
      await validateOfficeNetwork();

      const { error } = await supabase.from("attendance_logs").insert({
        employee_id: employeeId,
        attendance_date: today(),
        punch_in: new Date().toTimeString().slice(0, 8),
        attendance_type: "office",
        status: "present",
      });

      if (error) throw error;

      toast.success("Office Punch In");
      return;
    }

    const { error } = await supabase
      .from("attendance_logs")
      .update({
        punch_out: new Date().toTimeString().slice(0, 8),
      })
      .eq("employee_id", employeeId)
      .eq("attendance_date", today());

    if (error) throw error;

    toast.success("Office Punch Out");
  };

  const punchField = async () => {
    const pos = await getGeo();
    const { latitude, longitude } = pos.coords;
    const isIn = punchIn && !punchOut;

    if (!isIn) {
      const { error } = await supabase.from("site_visit_punches").insert({
        employee_id: employeeId,
        attendance_date: today(),
        punch_in: new Date().toTimeString().slice(0, 8),
        employee_latitude: latitude,
        employee_longitude: longitude,
      });

      if (error) throw error;

      toast.success("Field Punch In");
      return;
    }

    const { error } = await supabase
      .from("site_visit_punches")
      .update({
        punch_out: new Date().toTimeString().slice(0, 8),
        employee_latitude: latitude,
        employee_longitude: longitude,
      })
      .eq("employee_id", employeeId)
      .eq("attendance_date", today())
      .is("punch_out", null);

    if (error) throw error;

    toast.success("Field Punch Out");
  };

  const handlePunch = async () => {
    if (!employeeId) return;

    setBusy(true);

    try {
      if (attendanceType === "office") {
        await punchOffice();
      } else {
        await punchField();
      }

      await fetchToday(employeeId, attendanceType);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Operation failed");
    } finally {
      setBusy(false);
    }
  };

  const isDone = punchIn && punchOut;
  const isIn = punchIn && !punchOut;

  const buttonText = busy
    ? "Please wait..."
    : isDone
      ? "Completed"
      : isIn
        ? "Punch Out"
        : attendanceType === "field"
          ? "Punch In (Field)"
          : "Punch In";

  return (
    <div
      className={cn(
        "rounded-lg p-5 text-white shadow-lg transition-all",
        isDone
          ? "bg-gradient-to-r from-green-500 to-emerald-600"
          : isIn
            ? "bg-gradient-to-r from-blue-500 to-indigo-600"
            : "bg-gradient-to-r from-gray-700 to-gray-900"
      )}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm opacity-80">Attendance</p>

          <h2 className="text-3xl font-bold mt-1">
            {new Date().toLocaleTimeString("en-IN")}
          </h2>
        </div>

        <div className="text-right">
          <div className="flex items-center gap-1 justify-end text-xs opacity-80">
            {attendanceType === "office" ? <Wifi size={14} /> : <MapPin size={14} />}
            {attendanceType === "office" ? "Office" : "Field"}
          </div>

          <div className="mt-2 text-xs px-2 py-1 rounded-full bg-white/20">
            {isDone ? "Completed" : isIn ? "Checked In" : "Not Started"}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-white/10 p-3 backdrop-blur">
        <div className="flex justify-between text-sm">
          <span className="opacity-80">Punch In</span>
          <span className="font-semibold">{hhmm(punchIn)}</span>
        </div>

        <div className="flex justify-between text-sm mt-2">
          <span className="opacity-80">Punch Out</span>
          <span className="font-semibold">{hhmm(punchOut)}</span>
        </div>
      </div>

      <div className="mt-5">
        {isDone ? (
          <div className="flex items-center justify-center gap-2 text-white/90 text-sm">
            <CheckCircle2 size={18} />
            Attendance Completed
          </div>
        ) : (
          <Button
            onClick={handlePunch}
            disabled={loading || busy}
            className="w-full rounded-lg bg-white py-2 font-semibold text-black hover:bg-white/90"
          >
            {busy ? "Processing..." : buttonText}
          </Button>
        )}
      </div>
    </div>
  );
}