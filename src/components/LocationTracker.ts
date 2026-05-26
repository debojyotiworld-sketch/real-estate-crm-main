import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "@/hooks/useLocation";
import { useAuth } from "@/contexts/AuthContext";

export function LocationTracker() {
  const coords = useLocation();
  const { user } = useAuth();
  const [isAllowed, setIsAllowed] = useState(false);
  const coordsRef = useRef<{ lat: string; long: string } | null>(null);

  useEffect(() => {
    if (coords) {
      coordsRef.current = coords;
    }
  }, [coords]);

  useEffect(() => {
    if (!user) return;

    const checkAccess = async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("department")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error || !data) {
        setIsAllowed(false);
        return;
      }
      setIsAllowed(data.department?.toLowerCase() === "sales");
    };

    checkAccess();
  }, [user?.id]);

  useEffect(() => {
    if (!user || !isAllowed) return;

    console.log("Tracking started");

    const sendLocation = async () => {
      const current = coordsRef.current;

      if (!current) {
        console.warn("No coords yet, skipping...");
        return;
      }
      try {
        const { error } = await supabase
          .from("employee_locations")
          .insert({
            user_id: user.id,
            lat: current.lat,
            long: current.long,
            date: new Date().toLocaleDateString("en-CA", {
              timeZone: "Asia/Kolkata",
            }),
          });

        if (error) {
          console.error("Insert error:", error);
        } else {
          console.log("Location inserted");
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      }
    };

    // first call
    sendLocation();

    const interval = setInterval(sendLocation, 60000);

    return () => {
      clearInterval(interval);
      console.log("Tracking stopped");
    };
  }, [user?.id, isAllowed]);

  return null;
}