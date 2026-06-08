// src/hooks/hr/useAdvances.ts
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useAdvances = () => {
    const [loading, setLoading] = useState(false);
    const [advances, setAdvances] = useState<any[]>([]);

    const fetchAdvances = useCallback(async (month?: number, year?: number) => {
        setLoading(true);
        try {
            let query = supabase
                .from("salary_advances" as any)
                .select(`*, employees (name, employee_code, department)`)
                .order("created_at", { ascending: false });

            if (month) query = query.eq("target_month", month);
            if (year) query = query.eq("target_year", year);

            const { data, error } = await query;
            if (error) throw error;
            setAdvances(data || []);
        } catch (err: any) {
            console.error(err);
            toast.error("Failed to load advances");
        } finally {
            setLoading(false);
        }
    }, []);

    const requestAdvance = async (payload: { employee_id: string; amount: number; target_month: number; target_year: number; reason: string, deduction_type: string, emi_amount?: number, remaining_amount?: number }) => {
        try {
            const { error } = await supabase.from("salary_advances" as any).insert(payload as any);
            if (error) throw error;
            toast.success("Advance requested successfully");
            fetchAdvances(payload.target_month, payload.target_year);
            return true;
        } catch (err: any) {
            toast.error(err.message || "Failed to request advance");
            return false;
        }
    };

    const updateStatus = async (id: string, status: string, month: number, year: number) => {
        try {
            const { error } = await supabase.from("salary_advances" as any).update({ status } as any).eq("id", id);
            if (error) throw error;
            toast.success(`Advance marked as ${status}`);
            fetchAdvances(month, year);
            return true;
        } catch (err: any) {
            toast.error(err.message || "Failed to update status");
            return false;
        }
    };

    return { loading, advances, fetchAdvances, requestAdvance, updateStatus };
};