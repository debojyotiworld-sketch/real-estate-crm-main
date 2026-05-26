import { TileLayer, Popup } from "react-leaflet";
import { MapContainer } from "leaflet";
import type { LatLngExpression } from "leaflet";
import { useEmployees } from "../hooks/useEmployees";
import SmoothMarker from "./SmoothMarker";

export default function LiveMap() {
  const employees = useEmployees();

  const center: LatLngExpression = [22.5726, 88.3639];

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {employees.map((emp: any) => (
        <SmoothMarker
          key={`${emp.user_id}-${emp.created_at}`}
          position={[emp.lat, emp.long]}
        >
          <Popup>{emp.user_id}</Popup>
        </SmoothMarker>
      ))}
    </MapContainer>
  );
}
