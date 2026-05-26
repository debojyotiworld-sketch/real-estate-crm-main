import {
    useCallback,
    useMemo,
    useRef,
    useState,
    useEffect,
} from "react";

import { toast } from "sonner";

import { supabase }
    from "@/integrations/supabase/client";

import { Tables } from "@/integrations/supabase/types";

type SalaryStructure = Tables<"employee_salary_structures">;

import {
    toNum,
    round2,
    calculateGrossSalary,
    calculatePf,
    calculateEsi,
    calculateEmployerEsi,
    calculateGratuity,
    calculateTotalDeductions,
    calculateNetSalary,
    calculateCtc,
} from "@/lib/hr-calculations";

interface SalaryForm {

    salary_type:
    "monthly"
    | "yearly";

    basic: number;

    hra: number;

    conveyance: number;

    medical: number;

    special_allowance: number;

    other_allowance: number;

    pf_applicable: boolean;

    pf_employee_contribution_percent: number;

    pf_employee_contribution_amount: number;

    employer_pf: number;

    esi_applicable: boolean;

    esi_contribution_percent: number;

    esi_employee_contribution: number;

    employer_esi: number;

    gratuity: number;

    professional_tax: number;

    tds: number;

    other_deductions: number;

    gross_salary: number;

    total_deductions: number;

    net_payable: number;

    ctc: number;

    pf_number: string;

    esi_number: string;

    uan_number: string;

    effective_from: string;

    increment_note: string;
}

const defaultForm: SalaryForm = {

    salary_type: "monthly",

    basic: 0,

    hra: 0,

    conveyance: 0,

    medical: 0,

    special_allowance: 0,

    other_allowance: 0,

    pf_applicable: false,

    pf_employee_contribution_percent: 12,

    pf_employee_contribution_amount: 0,

    employer_pf: 0,

    esi_applicable: false,

    esi_contribution_percent: 0.75,

    esi_employee_contribution: 0,

    employer_esi: 0,

    gratuity: 0,

    professional_tax: 0,

    tds: 0,

    other_deductions: 0,

    gross_salary: 0,

    total_deductions: 0,

    net_payable: 0,

    ctc: 0,

    pf_number: "",

    esi_number: "",

    uan_number: "",

    effective_from:
        new Date()
            .toISOString()
            .split("T")[0],

    increment_note: "",
};

export const useSalary = () => {

    const [salaryForm, setSalaryForm] =
        useState<SalaryForm>(
            defaultForm
        );

    const [salaryHistory, setSalaryHistory] =
        useState<SalaryStructure[]>([]);

    const [currentSalary, setCurrentSalary] =
        useState<SalaryStructure | null>(
            null
        );

    const [loading, setLoading] =
        useState(false);

    const [saving, setSaving] =
        useState(false);

    const pfLastEdit =
        useRef<
            "percent"
            | "amount"
            | null
        >(null);

    const esiLastEdit =
        useRef<
            "percent"
            | "amount"
            | null
        >(null);

    // ======================================
    // GROSS SALARY
    // ======================================

    const grossSalary =
        useMemo(() => {

            return calculateGrossSalary({

                basic:
                    toNum(
                        salaryForm.basic
                    ),

                hra:
                    toNum(
                        salaryForm.hra
                    ),

                conveyance:
                    toNum(
                        salaryForm.conveyance
                    ),

                medical:
                    toNum(
                        salaryForm.medical
                    ),

                special_allowance:
                    toNum(
                        salaryForm.special_allowance
                    ),

                other_allowance:
                    toNum(
                        salaryForm.other_allowance
                    ),
            });

        }, [
            salaryForm.basic,
            salaryForm.hra,
            salaryForm.conveyance,
            salaryForm.medical,
            salaryForm.special_allowance,
            salaryForm.other_allowance,
        ]);

    // ======================================
    // PF SYNC
    // ======================================

    useEffect(() => {

        if (
            !salaryForm.pf_applicable
        ) {
            return;
        }

        if (
            pfLastEdit.current ===
            "percent"
        ) {

            const amount =
                calculatePf(
                    salaryForm.basic,
                    salaryForm
                        .pf_employee_contribution_percent
                );

            setSalaryForm(prev => ({
                ...prev,
                pf_employee_contribution_amount:
                    amount,
            }));
        }

        if (
            pfLastEdit.current ===
            "amount"
        ) {

            const percent =
                salaryForm.basic > 0
                    ? round2(
                        (
                            salaryForm
                                .pf_employee_contribution_amount /
                            salaryForm.basic
                        ) * 100
                    )
                    : 0;

            setSalaryForm(prev => ({
                ...prev,
                pf_employee_contribution_percent:
                    percent,
            }));
        }

    }, [
        salaryForm.basic,
        salaryForm.pf_applicable,
        salaryForm.pf_employee_contribution_percent,
        salaryForm.pf_employee_contribution_amount,
    ]);

    // ======================================
    // ESI SYNC
    // ======================================

    useEffect(() => {

        if (
            !salaryForm.esi_applicable
        ) {
            return;
        }

        if (
            esiLastEdit.current ===
            "percent"
        ) {

            const amount =
                calculateEsi(
                    grossSalary,
                    salaryForm
                        .esi_contribution_percent
                );

            setSalaryForm(prev => ({
                ...prev,
                esi_employee_contribution:
                    amount,
            }));
        }

        if (
            esiLastEdit.current ===
            "amount"
        ) {

            const percent =
                grossSalary > 0
                    ? round2(
                        (
                            salaryForm
                                .esi_employee_contribution /
                            grossSalary
                        ) * 100
                    )
                    : 0;

            setSalaryForm(prev => ({
                ...prev,
                esi_contribution_percent:
                    percent,
            }));
        }

    }, [
        grossSalary,
        salaryForm.esi_applicable,
        salaryForm.esi_contribution_percent,
        salaryForm.esi_employee_contribution,
    ]);

    // ======================================
    // AUTO CALCULATIONS
    // ======================================

    useEffect(() => {

        const employerPf =
            salaryForm.pf_applicable
                ? calculatePf(
                    salaryForm.basic,
                    12
                )
                : 0;

        const employerEsi =
            salaryForm.esi_applicable
                ? calculateEmployerEsi(
                    grossSalary
                )
                : 0;

        const gratuity =
            calculateGratuity(
                salaryForm.basic
            );

        const totalDeductions =
            calculateTotalDeductions({

                pf:
                    salaryForm
                        .pf_employee_contribution_amount,

                esi:
                    salaryForm
                        .esi_employee_contribution,

                professional_tax:
                    salaryForm
                        .professional_tax,

                tds:
                    salaryForm.tds,

                other_deductions:
                    salaryForm
                        .other_deductions,
            });

        const netPayable =
            calculateNetSalary(
                grossSalary,
                totalDeductions
            );

        const ctc =
            calculateCtc(
                grossSalary,
                employerPf,
                employerEsi,
                gratuity
            );

        setSalaryForm(prev => ({

            ...prev,

            gross_salary:
                grossSalary,

            employer_pf:
                employerPf,

            employer_esi:
                employerEsi,

            gratuity,

            total_deductions:
                totalDeductions,

            net_payable:
                netPayable,

            ctc,
        }));

    }, [
        grossSalary,
        salaryForm.pf_applicable,
        salaryForm.esi_applicable,
        salaryForm.pf_employee_contribution_amount,
        salaryForm.esi_employee_contribution,
        salaryForm.professional_tax,
        salaryForm.tds,
        salaryForm.other_deductions,
        salaryForm.basic,
    ]);

    // ======================================
    // FETCH CURRENT SALARY
    // ======================================

    const fetchCurrentSalary =
        useCallback(async (
            employeeId: string
        ) => {

            try {

                setLoading(true);

                const response =
                    await supabase
                        .from(
                            "employee_salary_structures"
                        )
                        .select("*")
                        .eq(
                            "employee_id",
                            employeeId
                        )
                        .eq(
                            "is_current",
                            true
                        )
                        .maybeSingle();

                if (
                    response.error
                ) {

                    throw response.error;
                }

                const data =
                    response.data as SalaryStructure | null;

                setCurrentSalary(
                    data
                );

            } catch (err) {

                console.error(err);

                toast.error(
                    "Failed to load salary"
                );

            } finally {

                setLoading(false);

            }

        }, []);

    useEffect(() => {

        if (!currentSalary) {

            setSalaryForm(
                defaultForm
            );

            return;
        }

        setSalaryForm({

            salary_type:
                currentSalary.salary_type as
                "monthly" | "yearly" || "monthly",

            basic:
                toNum(
                    currentSalary.basic
                ),

            hra:
                toNum(
                    currentSalary.hra
                ),

            conveyance:
                toNum(
                    currentSalary.conveyance
                ),

            medical:
                toNum(
                    currentSalary.medical
                ),

            special_allowance:
                toNum(
                    currentSalary.special_allowance
                ),

            other_allowance:
                toNum(
                    currentSalary.other_allowance
                ),

            pf_applicable:
                currentSalary.pf_applicable || false,

            pf_employee_contribution_percent:
                12,

            pf_employee_contribution_amount:
                toNum(
                    currentSalary.pf_employee_contribution
                ),

            employer_pf:
                toNum(
                    currentSalary.employer_pf
                ),

            esi_applicable:
                currentSalary.esi_applicable || false,

            esi_contribution_percent:
                0.75,

            esi_employee_contribution:
                toNum(
                    currentSalary.esi_employee_contribution
                ),

            employer_esi:
                toNum(
                    currentSalary.employer_esi
                ),

            gratuity:
                toNum(
                    currentSalary.gratuity
                ),

            professional_tax:
                toNum(
                    currentSalary.professional_tax
                ),

            tds:
                toNum(
                    currentSalary.tds
                ),

            other_deductions:
                toNum(
                    currentSalary.other_deductions
                ),

            gross_salary:
                toNum(
                    currentSalary.gross_salary
                ),

            total_deductions:
                toNum(
                    currentSalary.total_deductions
                ),

            net_payable:
                toNum(
                    currentSalary.net_payable
                ),

            ctc:
                toNum(
                    currentSalary.ctc
                ),

            pf_number:
                currentSalary.pf_number
                    ? String(
                        currentSalary.pf_number
                    )
                    : "",

            esi_number:
                currentSalary.esi_number
                    ? String(
                        currentSalary.esi_number
                    )
                    : "",

            uan_number:
                currentSalary.uan_number
                    ? String(
                        currentSalary.uan_number
                    )
                    : "",

            effective_from:
                currentSalary.effective_from ||

                new Date()
                    .toISOString()
                    .split("T")[0],

            increment_note:
                currentSalary.increment_note || "",
        });

    }, [currentSalary]);

    // ======================================
    // FETCH HISTORY
    // ======================================

    const fetchSalaryHistory =
        useCallback(async (
            employeeId: string
        ) => {

            try {

                const response =
                    await supabase
                        .from(
                            "employee_salary_structures"
                        )
                        .select("*")
                        .eq(
                            "employee_id",
                            employeeId
                        )
                        .order(
                            "effective_from",
                            {
                                ascending: false,
                            }
                        );

                const data =
                    (response.data ?? []) as SalaryStructure[];

                if (
                    response.error
                ) {

                    throw response.error;
                }

                setSalaryHistory(
                    data
                );

            } catch (err) {

                console.error(err);

            }

        }, []);

    // ======================================
    // SAVE SALARY
    // ======================================

    const saveSalaryStructure =
        async (
            employeeId: string
        ) => {

            try {

                setSaving(true);

                const previousDate =
                    new Date(
                        salaryForm
                            .effective_from
                    );

                previousDate.setDate(
                    previousDate.getDate() - 1
                );

                const prevFormatted =
                    previousDate
                        .toISOString()
                        .split("T")[0];

                await supabase
                    .from(
                        "employee_salary_structures"
                    )
                    .update({
                        is_current: false,
                        effective_to:
                            prevFormatted,
                    })
                    .eq(
                        "employee_id",
                        employeeId
                    )
                    .eq(
                        "is_current",
                        true
                    );

                const payload = {

                    employee_id:
                        employeeId,

                    salary_type:
                        salaryForm.salary_type,

                    basic:
                        salaryForm.basic,

                    hra:
                        salaryForm.hra,

                    conveyance:
                        salaryForm.conveyance,

                    medical:
                        salaryForm.medical,

                    special_allowance:
                        salaryForm
                            .special_allowance,

                    other_allowance:
                        salaryForm
                            .other_allowance,

                    gross_salary:
                        salaryForm
                            .gross_salary,

                    pf_applicable:
                        salaryForm
                            .pf_applicable,

                    pf_employee_contribution:
                        salaryForm
                            .pf_employee_contribution_amount,

                    employer_pf:
                        salaryForm
                            .employer_pf,

                    esi_applicable:
                        salaryForm
                            .esi_applicable,

                    esi_employee_contribution:
                        salaryForm
                            .esi_employee_contribution,

                    employer_esi:
                        salaryForm
                            .employer_esi,

                    gratuity:
                        salaryForm
                            .gratuity,

                    professional_tax:
                        salaryForm
                            .professional_tax,

                    tds:
                        salaryForm.tds,

                    other_deductions:
                        salaryForm
                            .other_deductions,

                    total_deductions:
                        salaryForm
                            .total_deductions,

                    net_payable:
                        salaryForm
                            .net_payable,

                    ctc:
                        salaryForm.ctc,

                    pf_number:
                        salaryForm.pf_number
                            ? Number(
                                salaryForm.pf_number
                            )
                            : null,

                    esi_number:
                        salaryForm.esi_number
                            ? Number(
                                salaryForm.esi_number
                            )
                            : null,

                    uan_number:
                        salaryForm.uan_number
                            ? Number(
                                salaryForm.uan_number
                            )
                            : null,

                    effective_from:
                        salaryForm
                            .effective_from,

                    effective_to:
                        null,

                    increment_note:
                        salaryForm
                            .increment_note,

                    is_current:
                        true,
                };

                const response =
                    await supabase
                        .from(
                            "employee_salary_structures"
                        )
                        .insert(
                            payload
                        );

                if (
                    response.error
                ) {

                    throw response.error;
                }

                toast.success(
                    "Salary updated"
                );

                await fetchCurrentSalary(
                    employeeId
                );

                await fetchSalaryHistory(
                    employeeId
                );

                return true;

            } catch (err) {

                console.error(err);

                toast.error(
                    "Salary save failed"
                );

                return false;

            } finally {

                setSaving(false);

            }
        };

    // ======================================
    // RESET
    // ======================================

    const resetSalaryForm =
        () => {

            setSalaryForm(
                defaultForm
            );
        };

    return {

        salaryForm,
        setSalaryForm,

        currentSalary,
        salaryHistory,

        loading,
        saving,

        grossSalary,

        pfLastEdit,
        esiLastEdit,

        fetchCurrentSalary,
        fetchSalaryHistory,

        saveSalaryStructure,

        resetSalaryForm,
    };
};