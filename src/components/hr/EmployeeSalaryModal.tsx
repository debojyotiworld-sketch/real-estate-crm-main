import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import {
    Input,
} from "@/components/ui/input";

import {
    Label,
} from "@/components/ui/label";

import {
    Button,
} from "@/components/ui/button";

import {
    Switch,
} from "@/components/ui/switch";

import {
    Textarea,
} from "@/components/ui/textarea";

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";

import {
    Separator,
} from "@/components/ui/separator";

import {
    Card,
    CardContent,
} from "@/components/ui/card";

import {
    IndianRupee,
    Plus,
    TrendingUp,
    History,
} from "lucide-react";
import {
    useEffect,
} from "react";

import { Tables } from "@/integrations/supabase/types";

type Employee = Tables<"employees">;

import {
    useSalary,
} from "@/hooks/hr/useSalary";
import {

    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,

} from "@/components/ui/select";

interface Props {

    open: boolean;

    onOpenChange: (
        open: boolean
    ) => void;

    employee: Employee | null;
}

export const EmployeeSalaryModal = ({
    open,
    onOpenChange,
    employee,
}: Props) => {

    const {

        salaryForm,
        setSalaryForm,

        loading,
        saving,

        salaryHistory,

        pfLastEdit,
        esiLastEdit,

        fetchCurrentSalary,
        fetchSalaryHistory,

        saveSalaryStructure,

    } = useSalary();

    // =====================================
    // LOAD
    // =====================================

    const loadData =
        async () => {

            if (!employee?.id) {
                return;
            }

            await Promise.all([

                fetchCurrentSalary(
                    employee.id
                ),

                fetchSalaryHistory(
                    employee.id
                ),
            ]);
        };

    useEffect(() => {

        if (
            open &&
            employee?.id
        ) {

            void loadData();
        }

    }, [
        open,
        employee?.id,
    ]);
    // =====================================
    // SAVE
    // =====================================

    const handleSave =
        async () => {

            if (!employee?.id) {
                return;
            }

            await saveSalaryStructure(
                employee.id
            );

            onOpenChange(false);
        };

    return (

        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >

            <DialogContent
                className="
            max-w-7xl
            h-[94vh]
            overflow-hidden
            rounded-3xl
            border-0
            bg-background
            shadow-2xl
            p-0
            gap-0
        "
            >

                {/* HEADER */}

                <div
                    className="
                border-b
                bg-gradient-to-r
                from-slate-50
                to-white
                px-8
                py-6
            "
                >

                    <div
                        className="
                    flex
                    items-start
                    justify-between
                    gap-6
                "
                    >

                        <div>

                            <DialogTitle
                                className="
                            text-2xl
                            font-bold
                            tracking-tight
                        "
                            >

                                Salary Structure

                            </DialogTitle>

                            <p
                                className="
                            mt-1
                            text-sm
                            text-muted-foreground
                        "
                            >

                                Configure salary components,
                                statutory deductions,
                                payroll structure &
                                employee salary lifecycle.

                            </p>

                            {
                                employee && (

                                    <div
                                        className="
                                    mt-5
                                "
                                    >

                                        <h2
                                            className="
                                        text-xl
                                        font-semibold
                                    "
                                        >

                                            {employee.name}

                                        </h2>

                                        <p
                                            className="
                                        text-sm
                                        text-muted-foreground
                                    "
                                        >

                                            {employee.employee_code}

                                        </p>

                                    </div>
                                )
                            }

                        </div>

                        {/* NET SALARY */}

                        <div
                            className="
                        min-w-[240px]
                        rounded-2xl
                        border
                        bg-primary/5
                        px-6
                        py-5
                    "
                        >

                            <div
                                className="
                            text-xs
                            uppercase
                            tracking-wider
                            text-muted-foreground
                            font-semibold
                        "
                            >

                                Net Salary

                            </div>

                            <div
                                className="
                            mt-3
                            flex
                            items-center
                            justify-end
                            gap-1
                            text-4xl
                            font-bold
                            text-primary
                        "
                            >

                                <IndianRupee
                                    className="
                                h-7
                                w-7
                            "
                                />

                                {
                                    salaryForm.net_payable.toLocaleString()
                                }

                            </div>

                        </div>

                    </div>

                </div>

                {/* BODY */}

                <div
                    className="
                flex
                h-[calc(94vh-145px)]
                flex-col
            "
                >

                    {/* SCROLL AREA */}

                    <div
                        className="
                    flex-1
                    overflow-y-auto
                    px-8
                    py-6
                    pr-5
                "
                    >

                        <Tabs
                            defaultValue="salary"
                            className="space-y-6"
                        >

                            {/* TABS */}

                            <TabsList
                                className="
                            grid
                            h-14
                            w-full
                            grid-cols-3
                            rounded-2xl
                            bg-muted/60
                            p-1
                        "
                            >

                                <TabsTrigger
                                    value="salary"
                                    className="
                                rounded-xl
                            "
                                >

                                    Salary Structure

                                </TabsTrigger>

                                <TabsTrigger
                                    value="increment"
                                    className="
                                rounded-xl
                            "
                                >

                                    Increment

                                </TabsTrigger>

                                <TabsTrigger
                                    value="history"
                                    className="
                                rounded-xl
                            "
                                >

                                    History

                                </TabsTrigger>

                            </TabsList>

                            {/* ================================= */}
                            {/* SALARY */}
                            {/* ================================= */}

                            <TabsContent
                                value="salary"
                                className="space-y-6"
                            >

                                <div
                                    className="
                                grid
                                gap-6
                                lg:grid-cols-2
                            "
                                >

                                    {/* LEFT */}

                                    <Card
                                        className="
                                    rounded-2xl
                                    border-0
                                    shadow-sm
                                "
                                    >

                                        <CardContent
                                            className="
                                        p-6
                                        space-y-6
                                    "
                                        >

                                            {/* SALARY TYPE */}

                                            <div
                                                className="
                                            space-y-2
                                        "
                                            >

                                                <Label>
                                                    Salary Type
                                                </Label>

                                                <Select
                                                    value={
                                                        salaryForm.salary_type
                                                    }
                                                    onValueChange={(v) =>
                                                        setSalaryForm(prev => ({
                                                            ...prev,
                                                            salary_type:
                                                                v as
                                                                | "monthly"
                                                                | "yearly",
                                                        }))
                                                    }
                                                >

                                                    <SelectTrigger
                                                        className="
                                                    h-11
                                                    rounded-xl
                                                "
                                                    >

                                                        <SelectValue />

                                                    </SelectTrigger>

                                                    <SelectContent>

                                                        <SelectItem value="monthly">
                                                            Monthly
                                                        </SelectItem>

                                                        <SelectItem value="yearly">
                                                            Yearly
                                                        </SelectItem>

                                                    </SelectContent>

                                                </Select>

                                            </div>

                                            <Separator />

                                            {/* EARNINGS */}

                                            <div
                                                className="
                                            grid
                                            grid-cols-2
                                            gap-4
                                        "
                                            >

                                                <div className="space-y-2">

                                                    <Label>
                                                        Basic
                                                    </Label>

                                                    <Input
                                                        type="number"
                                                        value={
                                                            salaryForm.basic
                                                        }
                                                        className="
                                                    h-11
                                                    rounded-xl
                                                "
                                                        onChange={(e) =>
                                                            setSalaryForm(prev => ({
                                                                ...prev,
                                                                basic:
                                                                    Number(
                                                                        e.target.value
                                                                    ),
                                                            }))
                                                        }
                                                    />

                                                </div>

                                                <div className="space-y-2">

                                                    <Label>
                                                        HRA
                                                    </Label>

                                                    <Input
                                                        type="number"
                                                        value={
                                                            salaryForm.hra
                                                        }
                                                        className="
                                                    h-11
                                                    rounded-xl
                                                "
                                                        onChange={(e) =>
                                                            setSalaryForm(prev => ({
                                                                ...prev,
                                                                hra:
                                                                    Number(
                                                                        e.target.value
                                                                    ),
                                                            }))
                                                        }
                                                    />

                                                </div>

                                                <div className="space-y-2">

                                                    <Label>
                                                        Conveyance
                                                    </Label>

                                                    <Input
                                                        type="number"
                                                        value={
                                                            salaryForm.conveyance
                                                        }
                                                        className="
                                                    h-11
                                                    rounded-xl
                                                "
                                                        onChange={(e) =>
                                                            setSalaryForm(prev => ({
                                                                ...prev,
                                                                conveyance:
                                                                    Number(
                                                                        e.target.value
                                                                    ),
                                                            }))
                                                        }
                                                    />

                                                </div>

                                                <div className="space-y-2">

                                                    <Label>
                                                        Medical
                                                    </Label>

                                                    <Input
                                                        type="number"
                                                        value={
                                                            salaryForm.medical
                                                        }
                                                        className="
                                                    h-11
                                                    rounded-xl
                                                "
                                                        onChange={(e) =>
                                                            setSalaryForm(prev => ({
                                                                ...prev,
                                                                medical:
                                                                    Number(
                                                                        e.target.value
                                                                    ),
                                                            }))
                                                        }
                                                    />

                                                </div>

                                                <div className="space-y-2">

                                                    <Label>
                                                        Special Allowance
                                                    </Label>

                                                    <Input
                                                        type="number"
                                                        value={
                                                            salaryForm.special_allowance
                                                        }
                                                        className="
                                                    h-11
                                                    rounded-xl
                                                "
                                                        onChange={(e) =>
                                                            setSalaryForm(prev => ({
                                                                ...prev,
                                                                special_allowance:
                                                                    Number(
                                                                        e.target.value
                                                                    ),
                                                            }))
                                                        }
                                                    />

                                                </div>

                                                <div className="space-y-2">

                                                    <Label>
                                                        Other Allowance
                                                    </Label>

                                                    <Input
                                                        type="number"
                                                        value={
                                                            salaryForm.other_allowance
                                                        }
                                                        className="
                                                    h-11
                                                    rounded-xl
                                                "
                                                        onChange={(e) =>
                                                            setSalaryForm(prev => ({
                                                                ...prev,
                                                                other_allowance:
                                                                    Number(
                                                                        e.target.value
                                                                    ),
                                                            }))
                                                        }
                                                    />

                                                </div>

                                            </div>

                                            <Separator />

                                            {/* PF */}

                                            <div
                                                className="
                                            flex
                                            items-center
                                            justify-between
                                        "
                                            >

                                                <Label>
                                                    PF Applicable
                                                </Label>

                                                <Switch
                                                    checked={
                                                        salaryForm.pf_applicable
                                                    }
                                                    onCheckedChange={(checked) =>
                                                        setSalaryForm(prev => ({
                                                            ...prev,
                                                            pf_applicable:
                                                                checked,
                                                        }))
                                                    }
                                                />

                                            </div>

                                            {
                                                salaryForm.pf_applicable && (

                                                    <div
                                                        className="
                                                    grid
                                                    gap-4
                                                    md:grid-cols-2
                                                "
                                                    >

                                                        <div className="space-y-2">

                                                            <Label>
                                                                PF %
                                                            </Label>

                                                            <Input
                                                                type="number"
                                                                value={
                                                                    salaryForm
                                                                        .pf_employee_contribution_percent
                                                                }
                                                                className="
                                                            h-11
                                                            rounded-xl
                                                        "
                                                                onChange={(e) => {

                                                                    const percent =
                                                                        Number(
                                                                            e.target.value
                                                                        );

                                                                    pfLastEdit.current =
                                                                        "percent";

                                                                    const amount =
                                                                        (
                                                                            salaryForm.basic *
                                                                            percent
                                                                        ) / 100;

                                                                    setSalaryForm(prev => ({

                                                                        ...prev,

                                                                        pf_employee_contribution_percent:
                                                                            percent,

                                                                        pf_employee_contribution_amount:
                                                                            amount,
                                                                    }));
                                                                }}
                                                            />

                                                        </div>

                                                        <div className="space-y-2">

                                                            <Label>
                                                                PF Amount
                                                            </Label>

                                                            <Input
                                                                type="number"
                                                                value={
                                                                    salaryForm
                                                                        .pf_employee_contribution_amount
                                                                }
                                                                className="
                                                            h-11
                                                            rounded-xl
                                                        "
                                                                onChange={(e) => {

                                                                    const amount =
                                                                        Number(
                                                                            e.target.value
                                                                        );

                                                                    pfLastEdit.current =
                                                                        "amount";

                                                                    const percent =
                                                                        salaryForm.basic > 0
                                                                            ? (
                                                                                amount /
                                                                                salaryForm.basic
                                                                            ) * 100
                                                                            : 0;

                                                                    setSalaryForm(prev => ({

                                                                        ...prev,

                                                                        pf_employee_contribution_amount:
                                                                            amount,

                                                                        pf_employee_contribution_percent:
                                                                            Number(
                                                                                percent.toFixed(2)
                                                                            ),
                                                                    }));
                                                                }}
                                                            />

                                                        </div>

                                                        <div className="space-y-2">

                                                            <Label>
                                                                PF Number
                                                            </Label>

                                                            <Input
                                                                value={
                                                                    salaryForm.pf_number
                                                                }
                                                                className="
                                                            h-11
                                                            rounded-xl
                                                        "
                                                                onChange={(e) =>
                                                                    setSalaryForm(prev => ({
                                                                        ...prev,
                                                                        pf_number:
                                                                            e.target.value,
                                                                    }))
                                                                }
                                                            />

                                                        </div>

                                                        <div className="space-y-2">

                                                            <Label>
                                                                UAN Number
                                                            </Label>

                                                            <Input
                                                                value={
                                                                    salaryForm.uan_number
                                                                }
                                                                className="
                                                            h-11
                                                            rounded-xl
                                                        "
                                                                onChange={(e) =>
                                                                    setSalaryForm(prev => ({
                                                                        ...prev,
                                                                        uan_number:
                                                                            e.target.value,
                                                                    }))
                                                                }
                                                            />

                                                        </div>

                                                    </div>
                                                )
                                            }

                                            <Separator />

                                            {/* ESI */}

                                            <div
                                                className="
                                            flex
                                            items-center
                                            justify-between
                                        "
                                            >

                                                <Label>
                                                    ESI Applicable
                                                </Label>

                                                <Switch
                                                    checked={
                                                        salaryForm.esi_applicable
                                                    }
                                                    onCheckedChange={(checked) =>
                                                        setSalaryForm(prev => ({
                                                            ...prev,
                                                            esi_applicable:
                                                                checked,
                                                        }))
                                                    }
                                                />

                                            </div>

                                            {
                                                salaryForm.esi_applicable && (

                                                    <div
                                                        className="
                                                    grid
                                                    gap-4
                                                    md:grid-cols-2
                                                "
                                                    >

                                                        <div className="space-y-2">

                                                            <Label>
                                                                ESI %
                                                            </Label>

                                                            <Input
                                                                type="number"
                                                                value={
                                                                    salaryForm
                                                                        .esi_contribution_percent
                                                                }
                                                                className="
                                                            h-11
                                                            rounded-xl
                                                        "
                                                                onChange={(e) => {

                                                                    const percent =
                                                                        Number(
                                                                            e.target.value
                                                                        );

                                                                    esiLastEdit.current =
                                                                        "percent";

                                                                    const amount =
                                                                        (
                                                                            salaryForm.gross_salary *
                                                                            percent
                                                                        ) / 100;

                                                                    setSalaryForm(prev => ({

                                                                        ...prev,

                                                                        esi_contribution_percent:
                                                                            percent,

                                                                        esi_employee_contribution:
                                                                            amount,
                                                                    }));
                                                                }}
                                                            />

                                                        </div>

                                                        <div className="space-y-2">

                                                            <Label>
                                                                ESI Amount
                                                            </Label>

                                                            <Input
                                                                type="number"
                                                                value={
                                                                    salaryForm
                                                                        .esi_employee_contribution
                                                                }
                                                                className="
                                                            h-11
                                                            rounded-xl
                                                        "
                                                                onChange={(e) => {

                                                                    const amount =
                                                                        Number(
                                                                            e.target.value
                                                                        );

                                                                    esiLastEdit.current =
                                                                        "amount";

                                                                    const percent =
                                                                        salaryForm.gross_salary > 0
                                                                            ? (
                                                                                amount /
                                                                                salaryForm.gross_salary
                                                                            ) * 100
                                                                            : 0;

                                                                    setSalaryForm(prev => ({

                                                                        ...prev,

                                                                        esi_employee_contribution:
                                                                            amount,

                                                                        esi_contribution_percent:
                                                                            Number(
                                                                                percent.toFixed(2)
                                                                            ),
                                                                    }));
                                                                }}
                                                            />

                                                        </div>

                                                        <div className="space-y-2">

                                                            <Label>
                                                                ESI Number
                                                            </Label>

                                                            <Input
                                                                value={
                                                                    salaryForm.esi_number
                                                                }
                                                                className="
                                                            h-11
                                                            rounded-xl
                                                        "
                                                                onChange={(e) =>
                                                                    setSalaryForm(prev => ({
                                                                        ...prev,
                                                                        esi_number:
                                                                            e.target.value,
                                                                    }))
                                                                }
                                                            />

                                                        </div>

                                                    </div>
                                                )
                                            }

                                            <Separator />

                                            {/* OTHER */}

                                            <div
                                                className="
                                            grid
                                            grid-cols-2
                                            gap-4
                                        "
                                            >

                                                <div className="space-y-2">

                                                    <Label>
                                                        Professional Tax
                                                    </Label>

                                                    <Input
                                                        type="number"
                                                        value={
                                                            salaryForm.professional_tax
                                                        }
                                                        className="
                                                    h-11
                                                    rounded-xl
                                                "
                                                        onChange={(e) =>
                                                            setSalaryForm(prev => ({
                                                                ...prev,
                                                                professional_tax:
                                                                    Number(
                                                                        e.target.value
                                                                    ),
                                                            }))
                                                        }
                                                    />

                                                </div>

                                                <div className="space-y-2">

                                                    <Label>
                                                        TDS
                                                    </Label>

                                                    <Input
                                                        type="number"
                                                        value={
                                                            salaryForm.tds
                                                        }
                                                        className="
                                                    h-11
                                                    rounded-xl
                                                "
                                                        onChange={(e) =>
                                                            setSalaryForm(prev => ({
                                                                ...prev,
                                                                tds:
                                                                    Number(
                                                                        e.target.value
                                                                    ),
                                                            }))
                                                        }
                                                    />

                                                </div>

                                            </div>

                                            {/* DATE */}

                                            <div className="space-y-2">

                                                <Label>
                                                    Effective From
                                                </Label>

                                                <Input
                                                    type="date"
                                                    value={
                                                        salaryForm.effective_from
                                                    }
                                                    className="
                                                h-11
                                                rounded-xl
                                            "
                                                    onChange={(e) =>
                                                        setSalaryForm(prev => ({
                                                            ...prev,
                                                            effective_from:
                                                                e.target.value,
                                                        }))
                                                    }
                                                />

                                            </div>

                                        </CardContent>

                                    </Card>

                                    {/* RIGHT */}

                                    <Card
                                        className="
                                    rounded-2xl
                                    border-0
                                    shadow-sm
                                "
                                    >

                                        <CardContent
                                            className="
                                        p-6
                                        space-y-5
                                    "
                                        >

                                            <div
                                                className="
                                            flex
                                            items-center
                                            justify-between
                                            text-lg
                                            font-semibold
                                        "
                                            >

                                                <span>
                                                    Gross Salary
                                                </span>

                                                <span>
                                                    ₹
                                                    {
                                                        salaryForm.gross_salary.toLocaleString()
                                                    }
                                                </span>

                                            </div>

                                            <Separator />

                                            <div
                                                className="
                                            flex
                                            items-center
                                            justify-between
                                        "
                                            >

                                                <span>
                                                    PF Deduction
                                                </span>

                                                <span>
                                                    ₹
                                                    {
                                                        salaryForm.pf_employee_contribution_amount.toLocaleString()
                                                    }
                                                </span>

                                            </div>

                                            <div
                                                className="
                                            flex
                                            items-center
                                            justify-between
                                        "
                                            >

                                                <span>
                                                    ESI Deduction
                                                </span>

                                                <span>
                                                    ₹
                                                    {
                                                        salaryForm.esi_employee_contribution.toLocaleString()
                                                    }
                                                </span>

                                            </div>

                                            <div
                                                className="
                                            flex
                                            items-center
                                            justify-between
                                        "
                                            >

                                                <span>
                                                    Total Deductions
                                                </span>

                                                <span>
                                                    ₹
                                                    {
                                                        salaryForm.total_deductions.toLocaleString()
                                                    }
                                                </span>

                                            </div>

                                            <Separator />

                                            <div
                                                className="
                                            rounded-2xl
                                            border
                                            bg-primary/5
                                            p-5
                                        "
                                            >

                                                <div
                                                    className="
                                                flex
                                                items-center
                                                justify-between
                                                text-2xl
                                                font-bold
                                            "
                                                >

                                                    <span>
                                                        Net Salary
                                                    </span>

                                                    <span>
                                                        ₹
                                                        {
                                                            salaryForm.net_payable.toLocaleString()
                                                        }
                                                    </span>

                                                </div>

                                                <div
                                                    className="
                                                mt-3
                                                flex
                                                items-center
                                                justify-between
                                                text-sm
                                                text-muted-foreground
                                            "
                                                >

                                                    <span>
                                                        Monthly CTC
                                                    </span>

                                                    <span>
                                                        ₹
                                                        {
                                                            salaryForm.ctc.toLocaleString()
                                                        }
                                                    </span>

                                                </div>

                                            </div>

                                            <div className="space-y-2">

                                                <Label>
                                                    Increment Note
                                                </Label>

                                                <Textarea
                                                    rows={8}
                                                    value={
                                                        salaryForm.increment_note
                                                    }
                                                    className="
                                                rounded-xl
                                                resize-none
                                            "
                                                    onChange={(e) =>
                                                        setSalaryForm(prev => ({
                                                            ...prev,
                                                            increment_note:
                                                                e.target.value,
                                                        }))
                                                    }
                                                />

                                            </div>

                                        </CardContent>

                                    </Card>

                                </div>

                            </TabsContent>

                            {/* ================================= */}
                            {/* INCREMENT */}
                            {/* ================================= */}

                            <TabsContent value="increment">

                                <Card
                                    className="
                                rounded-2xl
                                border-0
                                shadow-sm
                            "
                                >

                                    <CardContent
                                        className="
                                    p-6
                                    space-y-6
                                "
                                    >

                                        <div
                                            className="
                                        flex
                                        items-center
                                        gap-2
                                        text-xl
                                        font-semibold
                                    "
                                        >

                                            <TrendingUp
                                                className="
                                            h-5
                                            w-5
                                        "
                                            />

                                            Salary Increment

                                        </div>

                                        <div
                                            className="
                                        grid
                                        gap-4
                                        md:grid-cols-2
                                    "
                                        >

                                            <div className="space-y-2">

                                                <Label>
                                                    Current CTC
                                                </Label>

                                                <Input
                                                    disabled
                                                    value={
                                                        salaryForm.ctc
                                                    }
                                                    className="
                                                h-11
                                                rounded-xl
                                            "
                                                />

                                            </div>

                                            <div className="space-y-2">

                                                <Label>
                                                    New Effective Date
                                                </Label>

                                                <Input
                                                    type="date"
                                                    value={
                                                        salaryForm.effective_from
                                                    }
                                                    className="
                                                h-11
                                                rounded-xl
                                            "
                                                    onChange={(e) =>
                                                        setSalaryForm(prev => ({
                                                            ...prev,
                                                            effective_from:
                                                                e.target.value,
                                                        }))
                                                    }
                                                />

                                            </div>

                                        </div>

                                        <div className="space-y-2">

                                            <Label>
                                                Increment Note
                                            </Label>

                                            <Textarea
                                                rows={5}
                                                value={
                                                    salaryForm.increment_note
                                                }
                                                className="
                                            rounded-xl
                                            resize-none
                                        "
                                                onChange={(e) =>
                                                    setSalaryForm(prev => ({
                                                        ...prev,
                                                        increment_note:
                                                            e.target.value,
                                                    }))
                                                }
                                            />

                                        </div>

                                        <Button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="
                                        rounded-xl
                                        px-6
                                    "
                                        >

                                            <Plus
                                                className="
                                            mr-2
                                            h-4
                                            w-4
                                        "
                                            />

                                            Save Increment

                                        </Button>

                                    </CardContent>

                                </Card>

                            </TabsContent>

                            {/* ================================= */}
                            {/* HISTORY */}
                            {/* ================================= */}

                            <TabsContent
                                value="history"
                            >

                                <div
                                    className="
                                space-y-4
                            "
                                >

                                    {
                                        salaryHistory?.map(
                                            item => (

                                                <Card
                                                    key={item.id}
                                                    className="
                                                rounded-2xl
                                                border-0
                                                shadow-sm
                                            "
                                                >

                                                    <CardContent
                                                        className="
                                                    py-5
                                                "
                                                    >

                                                        <div
                                                            className="
                                                        flex
                                                        items-center
                                                        justify-between
                                                    "
                                                        >

                                                            <div>

                                                                <div
                                                                    className="
                                                                text-lg
                                                                font-semibold
                                                            "
                                                                >

                                                                    ₹
                                                                    {
                                                                        item.net_payable
                                                                    }

                                                                </div>

                                                                <div
                                                                    className="
                                                                mt-1
                                                                text-sm
                                                                text-muted-foreground
                                                            "
                                                                >

                                                                    Effective:
                                                                    {" "}
                                                                    {
                                                                        item.effective_from
                                                                    }

                                                                </div>

                                                            </div>

                                                            <div
                                                                className="
                                                            text-right
                                                        "
                                                            >

                                                                <div
                                                                    className="
                                                                font-medium
                                                            "
                                                                >

                                                                    CTC:
                                                                    {" "}
                                                                    ₹
                                                                    {
                                                                        item.ctc
                                                                    }

                                                                </div>

                                                                <div
                                                                    className="
                                                                mt-1
                                                                text-xs
                                                                text-muted-foreground
                                                            "
                                                                >

                                                                    {
                                                                        item.is_current
                                                                            ? "Current Salary"
                                                                            : "Previous Salary"
                                                                    }

                                                                </div>

                                                            </div>

                                                        </div>

                                                    </CardContent>

                                                </Card>
                                            )
                                        )
                                    }

                                </div>

                            </TabsContent>

                        </Tabs>

                    </div>

                    {/* FOOTER */}

                    <div
                        className="
                            shrink-0
                            border-t
                            bg-background
                            px-8
                            py-3
                            sticky
                            bottom-0
                            z-20
                        "
                    >

                        <div
                            className="
                        flex
                        justify-end
                        gap-3
                    "
                        >

                            <Button
                                variant="outline"
                                size="lg"
                                className="
                            rounded-xl
                        "
                                onClick={() =>
                                    onOpenChange(false)
                                }
                            >

                                Cancel

                            </Button>

                            <Button
                                size="lg"
                                disabled={
                                    saving ||
                                    loading
                                }
                                className="
                            rounded-xl
                            px-8
                            shadow-md
                        "
                                onClick={handleSave}
                            >

                                {
                                    saving
                                        ? "Saving..."
                                        : "Save Salary"
                                }

                            </Button>

                        </div>

                    </div>

                </div>

            </DialogContent>

        </Dialog>
    );
};