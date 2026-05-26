import {
    useMemo,
    useState,
} from "react";

import {
    Card,
    CardContent,
} from "@/components/ui/card";

import {
    Button,
} from "@/components/ui/button";

import {
    Badge,
} from "@/components/ui/badge";

import {
    Input,
} from "@/components/ui/input";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";

import {
    Search,
    Plus,
    Eye,
    Wallet,
    Trash2,
    Receipt,
} from "lucide-react";

import { Tables } from "@/integrations/supabase/types";

type Employee = Tables<"employees">;

import {
    useEmployees,
} from "@/hooks/hr/useEmployees";

import {
    EmployeeSalaryModal,
} from "./EmployeeSalaryModal";

import EmployeeForm from "./EmployeeForm";

interface Props {

    onViewEmployee?: (
        employee: Employee
    ) => void;

    onPayroll?: (
        employee: Employee
    ) => void;
}

export const EmployeeTable = ({
    onViewEmployee,
    onPayroll,
}: Props) => {

    const {

        employees,
        loading,

        search,
        setSearch,

        page,
        setPage,

        pageSize,
        totalCount,

        deleteEmployee,

    } = useEmployees();

    const [addOpen, setAddOpen] =
        useState(false);

    const [
        salaryOpen,
        setSalaryOpen,
    ] = useState(false);

    const [
        selectedEmployee,
        setSelectedEmployee,
    ] = useState<Employee | null>(
        null
    );

    // =====================================
    // PAGINATION
    // =====================================

    const totalPages =
        useMemo(() => {

            return Math.ceil(
                totalCount / pageSize
            );

        }, [
            totalCount,
            pageSize,
        ]);

    // =====================================
    // SALARY
    // =====================================

    const openSalary =
        (
            employee: Employee
        ) => {

            setSelectedEmployee(
                employee
            );

            setSalaryOpen(true);
        };

    return (

        <>

            <Card >

                <CardContent
                    className="
                        p-6
                    "
                >

                    {/* HEADER */}

                    <div
                        className="
                            flex
                            flex-col
                            md:flex-row
                            md:items-center
                            md:justify-between
                            gap-4
                            mb-6
                        "
                    >

                        <div className="
                            relative
                            w-full
                            md:w-auto

                        ">

                            <Search
                                className="absolute
                                    w-4
                                    h-4
                                    mt-2
                                    ml-3
                                    text-muted-foreground
                                "
                            />

                            <Input
                                placeholder="
                                    Search employee...
                                "
                                className="
                                    pl-10
                                "
                                value={
                                    search
                                }
                                onChange={(
                                    e
                                ) =>
                                    setSearch(
                                        e.target.value
                                    )
                                }
                            />

                        </div>

                        <Button
                            onClick={() =>
                                setAddOpen(
                                    true
                                )
                            }
                        >

                            <Plus
                                className="
                                    h-4
                                    w-4
                                    mr-2
                                "
                            />

                            Add Employee

                        </Button>

                    </div>

                    {/* TABLE */}

                    <div
                        className="
                        max-w-full
                            border
                            rounded-md
                        "
                    >

                        <Table className="
                            w-full
                        "
                        >

                            <TableHeader>

                                <TableRow>

                                    <TableHead className="w-[280px]">
                                        Employee
                                    </TableHead>

                                    <TableHead className="min-w-[140px]">
                                        Department
                                    </TableHead>

                                    <TableHead className="min-w-[140px]">
                                        Branch
                                    </TableHead>

                                    <TableHead className="min-w-[140px]">
                                        Role
                                    </TableHead>

                                    <TableHead className="min-w-[120px]">
                                        Status
                                    </TableHead>

                                    <TableHead
                                        className="
                        text-right
                        min-w-[220px]
                    "
                                    >
                                        Actions
                                    </TableHead>

                                </TableRow>

                            </TableHeader>

                            <TableBody>

                                {
                                    loading
                                        ? (
                                            <TableRow>

                                                <TableCell
                                                    colSpan={6}
                                                    className="
                                                        text-center
                                                        py-10
                                                    "
                                                >

                                                    Loading...

                                                </TableCell>

                                            </TableRow>
                                        )
                                        : employees.length === 0
                                            ? (
                                                <TableRow>

                                                    <TableCell
                                                        colSpan={6}
                                                        className="
                                                            text-center
                                                            py-10
                                                        "
                                                    >

                                                        No employees found

                                                    </TableCell>

                                                </TableRow>
                                            )
                                            : employees.map(
                                                employee => (

                                                    <TableRow
                                                        key={
                                                            employee.id
                                                        }
                                                    >

                                                        {/* EMPLOYEE */}

                                                        <TableCell>

                                                            <div
                                                                className="
                                                                    flex
                                                                    items-center
                                                                    gap-3
                                                                "
                                                            >

                                                                <Avatar>

                                                                    <AvatarImage
                                                                        src={
                                                                            employee.photo_url || ""
                                                                        }
                                                                    />

                                                                    <AvatarFallback>

                                                                        {
                                                                            employee.name?.charAt(0)
                                                                        }

                                                                    </AvatarFallback>

                                                                </Avatar>

                                                                <div>

                                                                    <div
                                                                        className="
                                                                            font-medium
                                                                        "
                                                                    >

                                                                        {
                                                                            employee.name
                                                                        }

                                                                    </div>

                                                                    <div
                                                                        className="
                                                                            text-xs
                                                                            text-muted-foreground
                                                                        "
                                                                    >

                                                                        {
                                                                            employee.employee_code
                                                                        }

                                                                    </div>

                                                                </div>

                                                            </div>

                                                        </TableCell>

                                                        {/* DEPARTMENT */}

                                                        <TableCell>

                                                            {
                                                                employee.department || "-"
                                                            }

                                                        </TableCell>

                                                        {/* BRANCH */}

                                                        <TableCell>

                                                            {
                                                                employee.branches?.branch_name || "-"
                                                            }

                                                        </TableCell>

                                                        {/* ROLE */}

                                                        <TableCell>

                                                            {
                                                                employee.roles?.name || "-"
                                                            }

                                                        </TableCell>

                                                        {/* STATUS */}

                                                        <TableCell>

                                                            <Badge
                                                                variant={
                                                                    employee.status === "active"
                                                                        ? "default"
                                                                        : "secondary"
                                                                }
                                                            >

                                                                {
                                                                    employee.status || "active"
                                                                }

                                                            </Badge>

                                                        </TableCell>

                                                        {/* ACTIONS */}

                                                        <TableCell
                                                            className="
                                                                text-right
                                                            "
                                                        >

                                                            <div
                                                                className="
                                                                    flex
                                                                    justify-end
                                                                    gap-2
                                                                "
                                                            >

                                                                {/* VIEW */}

                                                                <Button
                                                                    size="icon"
                                                                    variant="outline"
                                                                    onClick={() =>
                                                                        onViewEmployee?.(
                                                                            employee
                                                                        )
                                                                    }
                                                                >

                                                                    <Eye
                                                                        className="
                                                                            h-4
                                                                            w-4
                                                                        "
                                                                    />

                                                                </Button>

                                                                {/* SALARY */}

                                                                <Button
                                                                    size="icon"
                                                                    variant="outline"
                                                                    onClick={() =>
                                                                        openSalary(
                                                                            employee
                                                                        )
                                                                    }
                                                                >

                                                                    <Wallet
                                                                        className="
                                                                            h-4
                                                                            w-4
                                                                        "
                                                                    />

                                                                </Button>

                                                                {/* PAYROLL */}

                                                                <Button
                                                                    size="icon"
                                                                    variant="outline"
                                                                    onClick={() =>
                                                                        onPayroll?.(
                                                                            employee
                                                                        )
                                                                    }
                                                                >

                                                                    <Receipt
                                                                        className="
                                                                            h-4
                                                                            w-4
                                                                        "
                                                                    />

                                                                </Button>

                                                                {/* DELETE */}

                                                                <Button
                                                                    size="icon"
                                                                    variant="destructive"
                                                                    onClick={() =>
                                                                        deleteEmployee(
                                                                            employee.id
                                                                        )
                                                                    }
                                                                >

                                                                    <Trash2
                                                                        className="
                                                                            h-4
                                                                            w-4
                                                                        "
                                                                    />

                                                                </Button>

                                                            </div>

                                                        </TableCell>

                                                    </TableRow>
                                                )
                                            )
                                }

                            </TableBody>

                        </Table>

                    </div>

                    {/* PAGINATION */}

                    <div
                        className="
                            flex
                            items-center
                            justify-between
                            mt-6
                        "
                    >

                        <div
                            className="
                                text-sm
                                text-muted-foreground
                            "
                        >

                            Total:
                            {" "}
                            {
                                totalCount
                            }

                        </div>

                        <div
                            className="
                                flex
                                items-center
                                gap-2
                            "
                        >

                            <Button
                                variant="outline"
                                disabled={
                                    page <= 1
                                }
                                onClick={() =>
                                    setPage(
                                        page - 1
                                    )
                                }
                            >

                                Previous

                            </Button>

                            <div
                                className="
                                    text-sm
                                "
                            >

                                {
                                    page
                                }
                                {" / "}
                                {
                                    totalPages
                                }

                            </div>

                            <Button
                                variant="outline"
                                disabled={
                                    page >= totalPages
                                }
                                onClick={() =>
                                    setPage(
                                        page + 1
                                    )
                                }
                            >

                                Next

                            </Button>

                        </div>

                    </div>

                </CardContent>

            </Card >

            {/* ADD EMPLOYEE */}

            < EmployeeForm
                open={addOpen}
                onOpenChange={
                    setAddOpen
                }
            />

            {/* SALARY */}

            < EmployeeSalaryModal
                open={salaryOpen}
                onOpenChange={
                    setSalaryOpen
                }
                employee={
                    selectedEmployee
                }
            />

        </>
    );
};