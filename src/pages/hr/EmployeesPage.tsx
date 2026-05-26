import {
    useState,
} from "react";

import { Tables } from "@/integrations/supabase/types";

type Employee = Tables<"employees">;

import {
    EmployeeTable,
} from "@/components/hr/EmployeeTable";

import {
    EmployeeViewModal,
} from "@/components/hr/EmployeeViewModal";

import {
    EmployeePayrollModal,
} from "@/components/hr/EmployeePayrollModal";

export default function EmployeesPage() {

    const [

        selectedEmployee,

        setSelectedEmployee,

    ] = useState<Employee | null>(
        null
    );

    const [

        payrollEmployee,

        setPayrollEmployee,

    ] = useState<Employee | null>(
        null
    );

    const [

        viewOpen,

        setViewOpen,

    ] = useState(false);

    const [

        payrollOpen,

        setPayrollOpen,

    ] = useState(false);

    // =====================================
    // VIEW
    // =====================================

    const handleView =
        (
            employee: Employee
        ) => {

            setSelectedEmployee(
                employee
            );

            setViewOpen(true);
        };

    // =====================================
    // PAYROLL
    // =====================================

    const handlePayroll =
        (
            employee: Employee
        ) => {

            setPayrollEmployee(
                employee
            );

            setPayrollOpen(true);
        };

    return (

        <div
            className="
                space-y-6
                w-full
                
            "
        >

            {/* HEADER */}

            <div>

                <h1
                    className="
                        text-3xl
                        font-bold
                    "
                >

                    HR Management

                </h1>

                <p
                    className="
                        text-muted-foreground
                        mt-1
                    "
                >

                    Employee, salary,
                    payroll & attendance
                    management system

                </p>

            </div>

            {/* TABLE */}

            <EmployeeTable

                onViewEmployee={
                    handleView
                }

                onPayroll={
                    handlePayroll
                }
            />

            {/* VIEW */}

            <EmployeeViewModal

                open={viewOpen}

                onOpenChange={
                    setViewOpen
                }

                employee={
                    selectedEmployee
                }
            />

            {/* PAYROLL */}

            <EmployeePayrollModal

                open={payrollOpen}

                onOpenChange={
                    setPayrollOpen
                }

                employee={
                    payrollEmployee
                }
            />

        </div>
    );
}