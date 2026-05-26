import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type PermissionKey = string;

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<PermissionKey[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        setLoading(true);

        // 1. get user
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth?.user?.id;
        if (!userId) return;

        // 2. get role
        const { data: employee } = await supabase
          .from("employees")
          .select("role_id")
          .eq("user_id", userId)
          .single();

        const roleId = employee?.role_id || null;
        setRole(roleId);

        if (!roleId) {
          setPermissions([]);
          return;
        }

        // 3. get permissions
        const { data: perms } = await supabase
          .from("role_permissions")
          .select("permissions(key)")
          .eq("role_id", roleId);

        const keys =
          perms?.map((p: any) => p.permissions?.key).filter(Boolean) || [];

        setPermissions(keys);

      } catch (err) {
        console.error("Permission load error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, []);

  const can = useCallback(
    (key: PermissionKey) => {
      // admin → allow everything
      if (!role) return true;

      return permissions.includes(key);
    },
    [permissions, role]
  );

  const canAny = useCallback(
    (keys: PermissionKey[]) => {
      if (!role) return true;
      return keys.some((k) => permissions.includes(k));
    },
    [permissions, role]
  );

  const canAll = useCallback(
    (keys: PermissionKey[]) => {
      if (!role) return true;
      return keys.every((k) => permissions.includes(k));
    },
    [permissions, role]
  );

  return {
    permissions, // raw list 
    role,
    loading,

    can,    
    canAny,   // any one match
    canAll,   // all must match
  };
};