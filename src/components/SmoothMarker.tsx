import { useEffect, useRef } from "react";
import { Marker } from "react-leaflet";
import L from "leaflet";

export default function SmoothMarker({ position }: any) {
  const markerRef = useRef<L.Marker>(null);
  const prev = useRef(position);

  useEffect(() => {
    if (!markerRef.current) return;

    const marker = markerRef.current;
    const start = prev.current;
    const end = position;

    let t = 0;

    const animate = () => {
      t += 0.05;

      if (t >= 1) {
        marker.setLatLng(end);
        prev.current = end;
        return;
      }

      const lat = start[0] + (end[0] - start[0]) * t;
      const lng = start[1] + (end[1] - start[1]) * t;
      marker.setLatLng([lat, lng]);

      requestAnimationFrame(animate);
    };

    animate();
  }, [position]);

  return <Marker ref={markerRef} position={position} />;
}
