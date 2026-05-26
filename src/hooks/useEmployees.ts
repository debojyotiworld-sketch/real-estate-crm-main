import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useEmployees() {
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from("employee_locations")
        .select("*");

      setEmployees(data || []);
    };
    fetchData();

    const channel = supabase
      .channel("live-locations")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "employee_locations",
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return employees;
}
