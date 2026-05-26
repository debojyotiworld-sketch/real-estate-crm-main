import * as React from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, useMapEvents, Circle, Popup } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import "leaflet-control-geocoder/dist/Control.Geocoder.css";
import "leaflet-control-geocoder";

const RLMapContainer = MapContainer as unknown as React.ComponentType<any>;
const RLTileLayer = TileLayer as unknown as React.ComponentType<any>;
const RLMarker = Marker as unknown as React.ComponentType<any>;
const RLCircle = Circle as unknown as React.ComponentType<any>;
const RLPopup = Popup as unknown as React.ComponentType<any>;
import L from "leaflet";

type MarkerItem = { lat: number; lng: number; label: string; kind?: "admin" | "employee" };

const adminIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const employeeIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

function ClickHandler({
  enabled,
  onPick,
}: {
  enabled: boolean;
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (!enabled) return;
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function GeocoderControl({
  readOnly,
  onPick,
}: {
  readOnly?: boolean;
  onPick: (lat: number, lng: number) => void;
}) {
  const map = useMapEvents({});

  React.useEffect(() => {
    if (!map || readOnly) return;

    const geocoder = (L.Control as any)
      .geocoder({
        defaultMarkGeocode: false,
      })
      .on("markgeocode", function (e: any) {
        const latlng = e.geocode.center;

        map.setView(latlng, 16);

        onPick(latlng.lat, latlng.lng);
      })
      .addTo(map);

    return () => {
      map.removeControl(geocoder);
    };
  }, [map, readOnly]);

  return null;
}

export function MapPicker({
  open,
  onClose,
  onSelect,
  initialLat,
  initialLng,
  title = "Choose Site Location",
  description = "Click on the map to set the exact location. Then click “Use this location”.",
  readOnly,
  markers,
  circle,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
  title?: string;
  description?: string;
  /** If true, disables click-to-pick and hides the "Use" action */
  readOnly?: boolean;
  /** Optional: show multiple markers (e.g., allowed vs punch-in) */
  markers?: MarkerItem[];
  /** Optional: draw a radius circle */
  circle?: { lat: number; lng: number; radiusMeters: number };
}) {
  // Default center (Kolkata)
  const defaultLat = initialLat ?? 22.5726;
  const defaultLng = initialLng ?? 88.3639;

  const [lat, setLat] = React.useState<number>(defaultLat);
  const [lng, setLng] = React.useState<number>(defaultLng);

  // Sync state when dialog opens
  React.useEffect(() => {
    if (!open) return;
    setLat(defaultLat);
    setLng(defaultLng);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialLat, initialLng]);

  const latText = Number.isFinite(lat) ? lat.toFixed(6) : "";
  const lngText = Number.isFinite(lng) ? lng.toFixed(6) : "";

  const canPick = !readOnly && (!markers || markers.length === 0);

  const renderedMarkers: MarkerItem[] = React.useMemo(() => {
    if (markers && markers.length > 0) return markers;
    return Number.isFinite(lat) && Number.isFinite(lng) ? [{ lat, lng, label: "Selected" }] : [];
  }, [markers, lat, lng]);

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : undefined)}>
      <DialogContent className="max-w-5xl p-0 h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Separator className="my-2" />

        <div className="flex-1 px-4 pt-3 pb-3">
          <div className="h-[calc(85vh-290px)] min-h-[260px] w-full overflow-hidden rounded-lg border bg-muted/20">
            <RLMapContainer center={[defaultLat, defaultLng] as LatLngExpression} zoom={15} style={{ height: "100%", width: "100%" }}>
              <RLTileLayer
                attribution="&copy; OpenStreetMap"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <GeocoderControl
                readOnly={readOnly}
                onPick={(a, b) => {
                  setLat(a);
                  setLng(b);
                }}
              />
              <ClickHandler
                enabled={canPick}
                onPick={(a, b) => {
                  setLat(a);
                  setLng(b);
                }}
              />

              {circle && Number.isFinite(circle.lat) && Number.isFinite(circle.lng) && Number.isFinite(circle.radiusMeters) && circle.radiusMeters > 0 && (
                <RLCircle center={[circle.lat, circle.lng] as LatLngExpression} radius={circle.radiusMeters} />
              )}
              
              {renderedMarkers.map((m, idx) => (
                <RLMarker
                  key={`${m.lat}-${m.lng}-${idx}`}
                  position={[m.lat, m.lng] as LatLngExpression}
                  icon={m.kind === "admin" ? adminIcon : employeeIcon}
                >
                  {m.label ? <RLPopup>{m.label}</RLPopup> : null}
                </RLMarker>
              ))}

            </RLMapContainer>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2 text-xs">
            <div className="text-sm">
              <span className="font-medium">Lat:</span> <span className="tabular-nums">{latText}</span>
              <span className="ml-4 font-medium">Lng:</span> <span className="tabular-nums">{lngText}</span>
              {!readOnly && (
                <span className="ml-3 text-[11px] text-muted-foreground">Tip: click on map to move the pin</span>
              )}
            </div>

            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setLat(defaultLat);
                setLng(defaultLng);
              }}
              disabled={readOnly}
            >
              Reset
            </Button>
          </div>
        </div>

        <Separator />

        <DialogFooter className="px-4 py-3 gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            {readOnly ? "Close" : "Cancel"}
          </Button>

          {!readOnly && (
            <Button
              type="button"
              onClick={() => {
                if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
                onSelect(lat, lng);
                onClose();
              }}
            >
              Use this location
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
