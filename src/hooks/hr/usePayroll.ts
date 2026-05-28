import { useCallback, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getMonthDateRange, calculatePerDaySalary, calculateLopDays, calculateLeaveDeduction } from "@/lib/payroll-utils";

export const usePayroll = () => {
    const [loading, setLoading] = useState(false);
    const [payrolls, setPayrolls] = useState<any[]>([]);

    const fetchPayrolls = useCallback(async (employeeId?: string, month?: number, year?: number) => {
        try {
            setLoading(true);
            let query = supabase.from("employee_payrolls" as any).select(`*, employees:employee_id (name, employee_code, department, designation)`).order("created_at", { ascending: false });
            
            if (employeeId) query = query.eq("employee_id", employeeId);
            if (month) query = query.eq("payroll_month", month);
            if (year) query = query.eq("payroll_year", year);

            const { data, error } = await query;
            if (error) throw error;
            setPayrolls(data || []);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load payrolls");
        } finally {
            setLoading(false);
        }
    }, []);

    const _processPayrollCore = async (employeeId: string, payrollMonth: number, payrollYear: number) => {
        const existing = await supabase.from("employee_payrolls" as any).select("id").eq("employee_id", employeeId).eq("payroll_month", payrollMonth).eq("payroll_year", payrollYear).maybeSingle();
        if (existing.data) return { success: false, error: "Payroll already exists for this month" };

        const salaryResponse = await supabase.from("employee_salary_structures" as any).select("*").eq("employee_id", employeeId).eq("is_current", true).maybeSingle();
        const salary = salaryResponse.data as any;
        if (!salary) return { success: false, error: "Active salary structure missing" };

        const { startDate, endDate } = getMonthDateRange(payrollMonth, payrollYear);
        const { data: attendance } = await supabase.from("attendance_logs" as any).select("*").eq("employee_id", employeeId).gte("attendance_date", startDate).lte("attendance_date", endDate);
        
        const presentDays = (attendance || []).filter((i: any) => i.status === "present" || i.status === "approved").length;
        const lateDays = (attendance || []).filter((i: any) => i.status === "late").length;
        const absentDays = (attendance || []).filter((i: any) => i.status === "absent").length;
        
        const lopDays = calculateLopDays(absentDays, 0, lateDays);
        const grossSalary = Number(salary.gross_salary || 0);
        const perDaySalary = calculatePerDaySalary(grossSalary, 26);
        const leaveDeduction = calculateLeaveDeduction(perDaySalary, lopDays);
        
        const totalDeductions = Number(salary.total_deductions || 0) + leaveDeduction;
        const finalSalary = grossSalary - totalDeductions;

        const payload = {
            employee_id: employeeId, 
            salary_structure_id: salary.id, 
            payroll_month: payrollMonth, 
            payroll_year: payrollYear,
            working_days: 26, 
            present_days: presentDays, 
            lop_days: lopDays, 
            basic: salary.basic, 
            hra: salary.hra, 
            gross_salary: grossSalary, 
            pf_deduction: salary.pf_employee_contribution, 
            esi_deduction: salary.esi_employee_contribution, 
            leave_deduction: leaveDeduction, 
            total_deductions: totalDeductions, 
            net_salary: finalSalary > 0 ? finalSalary : 0, 
            payroll_status: "processed"
        };

        const { error: insertError } = await supabase.from("employee_payrolls" as any).insert(payload as any);
        if (insertError) return { success: false, error: insertError.message };
        return { success: true };
    };

    // Single Generate
    const generatePayroll = async (employeeId: string, month: number, year: number) => {
        setLoading(true);
        try {
            const res = await _processPayrollCore(employeeId, month, year);
            if(res.success) {
                toast.success("Payroll generated successfully");
                return true;
            } else {
                toast.error(res.error || "Generation failed");
                return false;
            }
        } finally {
            setLoading(false);
        }
    };

    const generateBulkPayroll = async (employees: any[], payrollMonth: number, payrollYear: number) => {
        try {
            setLoading(true);
            let successCount = 0; let failCount = 0;
            
            for (let i = 0; i < employees.length; i += 10) {
                const batch = employees.slice(i, i + 10);
                const results = await Promise.all(batch.map(emp => _processPayrollCore(emp.id, payrollMonth, payrollYear)));
                results.forEach(res => res.success ? successCount++ : failCount++);
            }
            
            if (successCount > 0) toast.success(`Generated payroll for ${successCount} employees.`);
            if (failCount > 0) toast.warning(`Skipped ${failCount} employees (already generated or missing setup).`);
            
            await fetchPayrolls(undefined, payrollMonth, payrollYear);
            return true;
        } catch (err) {
            toast.error("Bulk payroll failed"); 
            return false;
        } finally {
            setLoading(false);
        }
    };

    const updatePayroll = async (payrollId: string, updates: any) => {
        try {
            const { error } = await supabase.from("employee_payrolls" as any).update(updates).eq("id", payrollId);
            if (error) throw error;
            toast.success("Payroll adjusted successfully");
            return true;
        } catch (err) {
            toast.error("Failed to update payroll");
            return false;
        }
    };

    const approvePayroll = async (payrollId: string) => {
        const { error } = await supabase.from("employee_payrolls" as any).update({ payroll_status: "approved" }).eq("id", payrollId);
        if (!error) { toast.success("Approved"); return true; } 
        return false;
    };

    const markPayrollPaid = async (payrollId: string) => {
        const { error } = await supabase.from("employee_payrolls" as any).update({ payroll_status: "paid", paid_at: new Date().toISOString() }).eq("id", payrollId);
        if (!error) { toast.success("Marked Paid"); return true; } 
        return false;
    };

    return { payrolls, loading, fetchPayrolls, generatePayroll, generateBulkPayroll, updatePayroll, approvePayroll, markPayrollPaid };
};