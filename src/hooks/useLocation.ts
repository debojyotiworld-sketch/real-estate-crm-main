import { useEffect, useState } from "react";

type Coords = {
  lat: string;
  long: string;
};

export function useLocation() {
  const [coords, setCoords] = useState<Coords | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      console.error("❌ Geolocation not supported");
      return;
    }

    const getLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newCoords = {
            lat: pos.coords.latitude.toString(),
            long: pos.coords.longitude.toString(),
          };

          setCoords(newCoords);
        },
        (err) => {
          console.error("GPS error:", err);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,    
          timeout: 20000,
        }
      );
    };

    getLocation();

    const interval = setInterval(getLocation, 15000);

    return () => clearInterval(interval);
  }, []);

  return coords;
}