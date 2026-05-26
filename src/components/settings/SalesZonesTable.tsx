import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Pencil, Plus } from "lucide-react";

type ZoneStatus = "active" | "inactive";

type Zone = {
  id: string;
  zone_name: string;
  zone_code: string;
  description: string | null;
  city: string | null;
  state: string | null;
  status: ZoneStatus | null;
  locations: string[] | null;
  active_locations: string[] | null;
  created_at: string | null;
  updated_at: string | null;
};

function parseCommaSeparatedList(v: string): string[] {
  if (!v) return [];
  return Array.from(new Set(v.split(/[,|\n]/g).map(s => s.trim()).filter(Boolean)));
}

function StatusBadge({ status }: { status: ZoneStatus | null }) {
  const isActive = (status ?? "inactive") === "active";
  return (
    <Badge className={isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}

export default function SalesZonesTable() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(false);

  const [locDialogOpen, setLocDialogOpen] = useState(false);
  const [addLocDialogOpen, setAddLocDialogOpen] = useState(false);

  const [activeZone, setActiveZone] = useState<Zone | null>(null);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [newLocation, setNewLocation] = useState("");

  const zoneIdToIndex = useMemo(() => {
    const m = new Map<string, number>();
    zones.forEach((z, idx) => m.set(z.id, idx));
    return m;
  }, [zones]);

  const loadZones = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("zones").select("*").order("id", { ascending: false });
    setLoading(false);
    if (error) return toast.error(error.message);
    setZones((data ?? []) as Zone[]);
  };

  useEffect(() => {
    loadZones();
  }, []);

  // ===============================
  // EDIT ACTIVE LOCATIONS
  // ===============================
  const openLocationsDialog = (zone: Zone) => {
    setActiveZone(zone);
    setSelectedLocations(zone.active_locations ?? []);
    setLocDialogOpen(true);
  };

  const toggleLocation = (loc: string) => {
    setSelectedLocations(prev =>
      prev.includes(loc) ? prev.filter(x => x !== loc) : [...prev, loc]
    );
  };

  const saveLocations = async () => {
    if (!activeZone) return;

    const { error } = await supabase
      .from("zones")
      .update({
        active_locations: selectedLocations,
        updated_at: new Date().toISOString(),
      })
      .eq("id", activeZone.id);

    if (error) return toast.error(error.message);

    toast.success("Updated");
    setLocDialogOpen(false);
    await loadZones();
  };

  // ===============================
  // ADD NEW LOCATION
  // ===============================
  const openAddLocationDialog = (zone: Zone) => {
    setActiveZone(zone);
    setNewLocation("");
    setAddLocDialogOpen(true);
  };

  const addNewLocation = async () => {
    if (!activeZone) return;

    const loc = newLocation.trim();
    if (!loc) return toast.error("Location required");

    const existing = activeZone.locations ?? [];

    if (existing.includes(loc)) {
      return toast.error("Already exists");
    }

    const updatedLocations = [...existing, loc];
    const updatedActive = [...(activeZone.active_locations ?? []), loc];

    const { error } = await supabase
      .from("zones")
      .update({
        locations: updatedLocations,
        active_locations: updatedActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", activeZone.id);

    if (error) return toast.error(error.message);

    toast.success("Location added");
    setAddLocDialogOpen(false);
    await loadZones();
  };

  const activeCount = (z: Zone) =>
    `${(z.active_locations ?? []).length}/${(z.locations ?? []).length}`;

  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold">Zones</div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>City</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Locations</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {zones.map((z, i) => (
            <TableRow key={z.id}>
              <TableCell>{i + 1}</TableCell>
              <TableCell>{z.zone_name}</TableCell>
              <TableCell>{z.zone_code}</TableCell>
              <TableCell>{z.city}</TableCell>
              <TableCell><StatusBadge status={z.status} /></TableCell>
              <TableCell className="text-right">{activeCount(z)}</TableCell>

              <TableCell className="text-right flex gap-2 justify-end">
                <Button size="icon" variant="ghost" onClick={() => openLocationsDialog(z)}>
                  <Pencil className="h-4 w-4" />
                </Button>

                <Button size="icon" variant="ghost" onClick={() => openAddLocationDialog(z)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* ACTIVE LOCATIONS MODAL */}
      <Dialog open={locDialogOpen} onOpenChange={setLocDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Locations</DialogTitle>
          </DialogHeader>

          {(activeZone?.locations ?? []).map(loc => (
            <label key={loc} className="flex gap-2">
              <input
                type="checkbox"
                checked={selectedLocations.includes(loc)}
                onChange={() => toggleLocation(loc)}
              />
              {loc}
            </label>
          ))}

          <DialogFooter>
            <Button onClick={saveLocations}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ADD LOCATION MODAL */}
      <Dialog open={addLocDialogOpen} onOpenChange={setAddLocDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Location</DialogTitle>
          </DialogHeader>

          <Input
            placeholder="e.g. Newtown"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddLocDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addNewLocation}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
