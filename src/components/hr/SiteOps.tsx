import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { MapPicker } from "./MapPicker";

export type AttendanceLocation = {
  id: string;
  location_name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active?: boolean | null;
};

type Props = {
  /** Selected location id (optional, can be null if choosing ad-hoc coords) */
  locationId: string | null;
  onLocationIdChange: (next: string | null) => void;

  /** Site fields */
  siteName: string;
  onSiteNameChange: (next: string) => void;

  siteLat: number | null;
  siteLng: number | null;
  onSiteCoordsChange: (lat: number | null, lng: number | null) => void;

  radiusMeters: number | null;
  onRadiusMetersChange: (next: number | null) => void;

  /** Optional: lock the UI */
  disabled?: boolean;

  /** Optional: If you want to filter locations by date */
  attendanceDate?: string; // YYYY-MM-DD
};

function clampRadius(n: number) {
  // DB constraint: <= 50
  return Math.max(1, Math.min(50, Math.floor(n)));
}

export default function SiteOps({
  locationId,
  onLocationIdChange,
  siteName,
  onSiteNameChange,
  siteLat,
  siteLng,
  onSiteCoordsChange,
  radiusMeters,
  onRadiusMetersChange,
  disabled,
  attendanceDate,
}: Props) {
  const [isMapOpen, setIsMapOpen] = React.useState(false);
  const [loadingLocations, setLoadingLocations] = React.useState(false);
  const [attendanceLocations, setAttendanceLocations] = React.useState<AttendanceLocation[]>([]);

  const refreshLocations = React.useCallback(async () => {
    setLoadingLocations(true);

    // NOTE: attendance_locations has an attendance_date column in your schema.
    // If you pass attendanceDate, we filter by that date; otherwise load all active.
    let q = supabase
      .from("properties")
      .select("id, title, description, location, status")

//    if (attendanceDate) q = q.eq("attendance_date", attendanceDate);

    const { data, error } = await q.order("title", { ascending: true });

    setLoadingLocations(false);

    if (error) {
      console.error(error);
      toast.error("Failed to load site locations");
      setAttendanceLocations([]);
      return;
    }

    const normalized: AttendanceLocation[] = (data ?? []).map((r: any) => ({
      id: String(r.id),
      location_name: String(r.title ?? ""),
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
      radius_meters: Number(r.radius_meters ?? 50),
    }));

    setAttendanceLocations(normalized);
  }, [attendanceDate]);

  // Load once when component mounts
  React.useEffect(() => {
    if (attendanceLocations.length > 0) return;
    void refreshLocations();
  }, [attendanceLocations.length, refreshLocations]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <Label className="text-base font-semibold">Site Location</Label>
              <p className="text-sm text-muted-foreground">
                Choose an existing site (saved in attendance_locations) or pick coordinates from the map.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              disabled={disabled || loadingLocations}
              onClick={() => void refreshLocations()}
            >
              {loadingLocations ? "Refreshing..." : "Refresh"}
            </Button>
          </div>


          <Select
            value={locationId ?? ""}
            onValueChange={(value) => {
              const nextId = value || null;
              onLocationIdChange(nextId);

              const loc = attendanceLocations.find((x) => x.id === nextId);
              if (!loc) return;

              onSiteNameChange(loc.location_name ?? "");
              onSiteCoordsChange(
                Number.isFinite(loc.latitude) ? loc.latitude : null,
                Number.isFinite(loc.longitude) ? loc.longitude : null
              );
              onRadiusMetersChange(Number.isFinite(loc.radius_meters) ? clampRadius(loc.radius_meters) : 50);
            }}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingLocations ? "Loading locations..." : "Select site location"} />
            </SelectTrigger>
            <SelectContent>
              {attendanceLocations.length === 0 ? (
                <SelectItem value="__none" disabled>
                  No locations found
                </SelectItem>
              ) : (
                attendanceLocations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.location_name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-sm">Latitude</Label>
              <Input value={siteLat ?? ""} readOnly placeholder="-" />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Longitude</Label>
              <Input value={siteLng ?? ""} readOnly placeholder="-" />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Radius (m)</Label>
              <Input value={radiusMeters ?? ""} readOnly placeholder="-" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-sm">Location Name</Label>
              <Input
                value={siteName}
                onChange={(e) => onSiteNameChange(e.target.value)}
                placeholder="Client site / Project site name"
                disabled={disabled}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Radius (meters) (max 50)</Label>
              <Input
                value={radiusMeters ?? 50}
                inputMode="numeric"
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (!Number.isFinite(n)) return;
                  onRadiusMetersChange(clampRadius(n));
                }}
                disabled={disabled}
              />
              <p className="text-xs text-muted-foreground">DB constraint: radius_meters ≤ 50</p>
            </div>
          </div>

          <Button type="button" variant="outline" disabled={disabled} onClick={() => setIsMapOpen(true)}>
            Pick / Update on Map
          </Button>

          <MapPicker
            open={isMapOpen}
            onClose={() => setIsMapOpen(false)}
            initialLat={siteLat ?? undefined}
            initialLng={siteLng ?? undefined}
            title="Choose Site Location"
            description="Click on the map to set the site location. Then click “Use this location”."
            onSelect={(lat, lng) => {
              onSiteCoordsChange(lat, lng);
              if (radiusMeters == null) onRadiusMetersChange(50);
            }}
          />
        </div>
      </div>
    </div>
  );
}
