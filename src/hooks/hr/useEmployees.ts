import {
    useCallback,
    useEffect,
    useState,
} from "react";

import { toast } from "sonner";

import { supabase }
    from "@/integrations/supabase/client";

import { Tables } from "@/integrations/supabase/types";

type Employee = Tables<"employees">;
type Branch = Tables<"branches">;
type Role = Tables<"roles">;
type Zone = Tables<"zones">;

interface CreateEmployeePayload {

    employee_code: string;

    name: string;

    email: string;

    phone?: string;

    department?: string;

    designation?: string;

    branch_id?: string | null;

    zone_id?: string | null;

    joining_date?: string;

    role_id?: string;

    status?: string;

    attendance_type?: string;

    // ADDRESS

    address?: string;

    city?: string;

    state?: string;

    pincode?: string;

    // KYC

    aadhar_number?: string;

    pan_number?: string;

    aadhar_photo?: string | null;

    pan_photo?: string | null;

    // EXPERIENCE

    experience?: string;

    total_experience?: string;

    previous_company?: string;

    previous_document_type?: string;

    previous_document_path?: string | null;

    // REPORTING MANAGER

    reporting_manager_name?: string;

    reporting_manager_email?: string;

    reporting_manager_phone?: string;
}

export const useEmployees = () => {

    const [employees, setEmployees] =
        useState<Employee[]>([]);

    const [loading, setLoading] =
        useState(false);

    const [saving, setSaving] =
        useState(false);

    const [roles, setRoles] =
        useState<Role[]>([]);

    const [branches, setBranches] =
        useState<Branch[]>([]);

    const [zones, setZones] =
        useState<Zone[]>([]);

    const [search, setSearch] =
        useState("");

    const [page, setPage] =
        useState(1);

    const [pageSize] =
        useState(10);

    const [totalCount, setTotalCount] =
        useState(0);

    // =========================================
    // FETCH EMPLOYEES
    // =========================================

    const fetchEmployees =
        useCallback(async () => {

            try {

                setLoading(true);

                const from =
                    (page - 1) * pageSize;

                const to =
                    from + pageSize - 1;

                let query =
                    supabase
                        .from("employees")
                        .select(`
                            *,
                            roles (
                                id,
                                name
                            ),
                            branches (
                                id,
                                branch_name
                            )
                        `,
                            {
                                count: "exact",
                            }
                        );

                if (search.trim()) {

                    query =
                        query.or(`
                            name.ilike.%${search}%,
                            email.ilike.%${search}%,
                            employee_code.ilike.%${search}%,
                            phone.ilike.%${search}%
                        `);
                }

                const response =
                    await query.range(
                        from,
                        to
                    );

                const data =
                    response.data as Employee[] || [];

                const error =
                    response.error;

                if (error) {
                    throw error;
                }

                setEmployees(data);

                setTotalCount(
                    response.count || 0
                );

            } catch (err) {

                console.error(err);

                toast.error(
                    "Failed to load employees"
                );

            } finally {

                setLoading(false);

            }

        }, [
            page,
            pageSize,
            search,
        ]);

    // =========================================
    // FETCH ROLES
    // =========================================

    const fetchRoles =
        useCallback(async () => {

            try {

                const response =
                    await supabase
                        .from("roles")
                        .select(`
                            id,
                            name
                        `)
                        .order(
                            "name"
                        );

                const data =
                    response.data as Role[] || [];

                if (response.error) {
                    throw response.error;
                }

                setRoles(data);

            } catch (err) {

                console.error(err);

            }

        }, []);

    // =========================================
    // FETCH BRANCHES
    // =========================================

    const fetchBranches =
        useCallback(async () => {

            try {

                const response =
                    await supabase
                        .from("branches")
                        .select(`
                            id,
                            branch_name,
                            branch_code
                        `)
                        .order(
                            "branch_name"
                        );

                const data =
                    response.data as Branch[] || [];

                if (response.error) {
                    throw response.error;
                }

                setBranches(data);

            } catch (err) {

                console.error(err);

            }

        }, []);

    // =========================================
    // FETCH ZONES
    // =========================================

    const fetchZones =
        useCallback(async (
            branchId?: string | null
        ) => {

            if (!branchId) {

                setZones([]);

                return;
            }

            try {

                const response =
                    await supabase
                        .from("zones")
                        .select(`
                            id,
                            zone_name,
                            zone_code,
                            city,
                            state
                        `)
                        .eq(
                            "branch_id",
                            branchId
                        )
                        .order(
                            "zone_name"
                        );

                const data =
                    response.data as Zone[] || [];

                if (response.error) {
                    throw response.error;
                }

                setZones(data);

            } catch (err) {

                console.error(err);

                toast.error(
                    "Failed to load zones"
                );

            }

        }, []);

    // =========================================
    // GENERATE EMPLOYEE CODE
    // =========================================

    const generateEmployeeCode =
        async (
            department: string
        ) => {

            try {

                const response =
                    await supabase.rpc(
                        // RPC name not present in generated types; cast to bypass strict union
                        "generate_employee_code" as unknown as any,
                        {
                            dept: department,
                        }
                    );

                if (response.error) {
                    throw response.error;
                }

                return String(response.data);

            } catch (err) {

                console.error(err);

                toast.error(
                    "Failed to generate employee code"
                );

                return "";
            }
        };

    // =========================================
    // FILE UPLOAD
    // =========================================

    const uploadEmployeeFile =
        async (
            file: File,
            folder:
                | "employee-photo"
                | "aadhar"
                | "pan"
                | "experience"
        ) => {

            try {

                const fileExt =
                    file.name
                        .split(".")
                        .pop();

                const fileName =
                    `${folder}/${Date.now()}-${Math.random()}.${fileExt}`;

                const response =
                    await supabase
                        .storage
                        .from("employee-documents")
                        .upload(
                            fileName,
                            file,
                            {
                                upsert: true,
                            }
                        );

                if (response.error) {
                    throw response.error;
                }

                const publicUrl =
                    supabase
                        .storage
                        .from("employee-documents")
                        .getPublicUrl(fileName)
                        .data
                        .publicUrl;

                return publicUrl;

            } catch (err) {

                console.error(err);

                toast.error(
                    "File upload failed"
                );

                return null;
            }
        };

    // =========================================
    // CREATE EMPLOYEE
    // =========================================

    const createEmployee =
        async (
            payload:
                CreateEmployeePayload
        ) => {

            try {

                setSaving(true);

                const employeePayload = {

                    employee_code:
                        payload.employee_code,

                    name:
                        payload.name,

                    email:
                        payload.email,

                    phone:
                        payload.phone,

                    department:
                        payload.department,

                    designation:
                        payload.designation,

                    branch_id:
                        payload.branch_id,

                    zone_id:
                        payload.zone_id,

                    joining_date:
                        payload.joining_date,

                    role_id:
                        payload.role_id,

                    status:
                        payload.status ||

                        "active",

                    attendance_type:
                        payload.attendance_type,

                    // ADDRESS

                    address:
                        payload.address,

                    city:
                        payload.city,

                    state:
                        payload.state,

                    pincode:
                        payload.pincode,

                    // KYC

                    aadhar_number:
                        payload.aadhar_number,

                    pan_number:
                        payload.pan_number,

                    aadhar_photo:
                        payload.aadhar_photo,

                    pan_photo:
                        payload.pan_photo,

                    // EXPERIENCE

                    experience:
                        payload.experience,

                    total_experience:
                        payload.total_experience,

                    previous_company:
                        payload.previous_company,

                    previous_document_type:
                        payload.previous_document_type,

                    previous_document_path:
                        payload.previous_document_path,

                    // REPORTING MANAGER

                    reporting_manager_name:
                        payload.reporting_manager_name,

                    reporting_manager_email:
                        payload.reporting_manager_email,

                    reporting_manager_phone:
                        payload.reporting_manager_phone,
                };

                const response =
                    await supabase
                        .functions
                        .invoke(
                            "create-employee",
                            {
                                body:
                                    employeePayload,
                            }
                        );

                if (
                    response.error ||
                    !response.data?.success
                ) {

                    throw new Error(
                        response.error?.message ||
                        response.data?.message ||
                        "Employee creation failed"
                    );
                }

                toast.success(
                    "Employee created"
                );

                await fetchEmployees();

                return response.data;

            } catch (err) {

                console.error(err);

                toast.error(
                    err instanceof Error
                        ? err.message
                        : "Creation failed"
                );

                return null;

            } finally {

                setSaving(false);
            }
        };

    // =========================================
    // UPDATE EMPLOYEE
    // =========================================

    const updateEmployee =
        async (
            employeeId: string,
            payload:
                Partial<Employee>
        ) => {

            try {

                setSaving(true);

                const response =
                    await supabase
                        .from("employees")
                        .update(payload)
                        .eq(
                            "id",
                            employeeId
                        );

                if (response.error) {
                    throw response.error;
                }

                toast.success(
                    "Employee updated"
                );

                await fetchEmployees();

                return true;

            } catch (err) {

                console.error(err);

                toast.error(
                    "Update failed"
                );

                return false;

            } finally {

                setSaving(false);

            }
        };

    // =========================================
    // DELETE EMPLOYEE
    // =========================================

    const deleteEmployee =
        async (
            employeeId: string
        ) => {

            try {

                const confirmed =
                    confirm(
                        "Delete employee?"
                    );

                if (!confirmed) {
                    return;
                }

                const response =
                    await supabase
                        .from("employees")
                        .delete()
                        .eq(
                            "id",
                            employeeId
                        );

                if (response.error) {
                    throw response.error;
                }

                toast.success(
                    "Employee deleted"
                );

                await fetchEmployees();

            } catch (err) {

                console.error(err);

                toast.error(
                    "Delete failed"
                );

            }
        };

    // =========================================
    // INIT
    // =========================================

    useEffect(() => {

        void fetchEmployees();

    }, [
        fetchEmployees
    ]);

    useEffect(() => {

        void fetchRoles();

        void fetchBranches();

    }, [
        fetchRoles,
        fetchBranches,
    ]);

    return {

        employees,
        loading,
        saving,

        search,
        setSearch,

        page,
        setPage,

        pageSize,
        totalCount,

        roles,
        branches,
        zones,

        fetchEmployees,
        fetchRoles,
        fetchBranches,
        fetchZones,

        generateEmployeeCode,

        uploadEmployeeFile,

        createEmployee,
        updateEmployee,
        deleteEmployee,
    };
};