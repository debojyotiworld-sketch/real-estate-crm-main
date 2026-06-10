// src/components/hr/PayslipTemplate.tsx
import React from "react";
import { format } from "date-fns";

interface PayslipProps {
    payroll: any;
    employee: any;
}

export const PayslipTemplate: React.FC<PayslipProps> = ({ payroll, employee }) => {
    if (!payroll || !employee) return null;

    // Helper to format currency exactly as shown (with dashes for zero)
    const formatCurrency = (amount: number | string) => {
        const value = Number(amount) || 0;
        if (value === 0) return "-";
        return value.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const monthName = new Date(payroll.payroll_year, payroll.payroll_month - 1).toLocaleString("default", { month: "long" });
    const year = payroll.payroll_year;
    
    const basic = Number(payroll.basic || 0);
    const hra = Number(payroll.hra || 0);
    const conveyance = Number(payroll.gross_salary) - basic - hra > 0 ? Number(payroll.gross_salary) - basic - hra : 0; 
    
    const advanceDeduction = Number(payroll.advance_deduction || 0);
    const otherDeductions = Number(payroll.leave_deduction || 0) + Number(payroll.pf_deduction || 0) + Number(payroll.esi_deduction || 0);
    const totalDeductions = Number(payroll.total_deductions || 0);
    const grossSalary = Number(payroll.gross_salary || 0);
    const netSalary = Number(payroll.net_salary || 0);

    return (
        <div className="w-full max-w-[900px] mx-auto bg-white p-12 text-black font-serif" style={{ fontFamily: "'Times New Roman', Times, serif", printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
            
            {/* Header Section */}
            <div className="flex justify-between items-start mb-10">
                <div className="pt-2">
                    <h1 className="text-[28px] tracking-tight">
                        <span className="text-[#c44a88]">Phoenix </span>
                        <span className="text-[#ea82b8]">Realesthatic</span>
                    </h1>
                    <p className="text-[9px] text-[#ea82b8] tracking-[0.15em] text-center mt-0.5 ml-4">Turning Properties into Prosperities</p>
                </div>
                <div className="text-[14px] mt-6 flex items-center">
                    <span>Pay Slip for the month of :</span>
                    <span className="ml-4 w-20">{monthName},</span>
                    <span className="ml-2">{year}</span>
                </div>
            </div>

            {/* Company Info */}
            <div className="text-center mb-12 text-[14px] leading-tight">
                <h2 className="font-bold mb-1">Phoenix Realesthatic</h2>
                <p className="font-bold">Regus, Globsyn Crystals, Street Number 17, EP Block, Sector V, Bidhannagar,</p>
                <p className="font-bold">Kolkata - 700091</p>
            </div>

            {/* Employee Details */}
            <div className="grid grid-cols-2 gap-x-12 mb-14 text-[13px] leading-relaxed">
                {/* Left Column */}
                <div className="space-y-1">
                    <div className="grid grid-cols-[140px_20px_1fr]">
                        <span>Employee Name</span><span>:</span><span>{employee.name || "N/A"}</span>
                    </div>
                    <div className="grid grid-cols-[140px_20px_1fr]">
                        <span>Employee Code</span><span>:</span><span>{employee.employee_code || "N/A"}</span>
                    </div>
                    <div className="grid grid-cols-[140px_20px_1fr]">
                        <span>Date Of Joining</span><span>:</span><span>{employee.doj ? format(new Date(employee.doj), "dd.MM.yyyy") : "N/A"}</span>
                    </div>
                    <div className="grid grid-cols-[140px_20px_1fr]">
                        <span>Designation</span><span>:</span><span>{employee.designation || "N/A"}</span>
                    </div>
                    <div className="grid grid-cols-[140px_20px_1fr]">
                        <span>Department</span><span>:</span><span>{employee.department || "N/A"}</span>
                    </div>
                    <div className="grid grid-cols-[140px_20px_1fr]">
                        <span>Location</span><span>:</span><span>Kolkata</span>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-1 pl-4">
                    <div className="grid grid-cols-[140px_20px_1fr]">
                        <span>Pay Mode</span><span>:</span><span>RTGS/NEFT</span>
                    </div>
                    <div className="grid grid-cols-[140px_20px_1fr]">
                        <span>Bank Name</span><span>:</span><span>{employee.bank_name || "N/A"}</span>
                    </div>
                    <div className="grid grid-cols-[140px_20px_1fr]">
                        <span>Bank A/C No</span><span>:</span><span>{employee.bank_account_no || "N/A"}</span>
                    </div>
                    <div className="grid grid-cols-[140px_20px_1fr]">
                        <span>Pan No</span><span>:</span><span>{employee.pan_no || "N/A"}</span>
                    </div>
                    <div className="grid grid-cols-[140px_20px_1fr]">
                        <span>Absent Days</span><span>:</span><span>{payroll.lop_days || 0}</span>
                    </div>
                    <div className="grid grid-cols-[140px_20px_1fr]">
                        <span>Worked Days</span><span>:</span><span>{payroll.present_days || 0}</span>
                    </div>
                </div>
            </div>

            {/* Earnings & Deductions Details */}
            <div className="grid grid-cols-2 gap-x-12 text-[13px]">
                {/* Earnings Column */}
                <div className="grid grid-cols-[200px_20px_1fr] gap-y-2">
                    <div className="font-bold">Earnings</div>
                    <div className="font-bold text-center">:</div>
                    <div className="font-bold text-right pr-6">Amount (INR)</div>

                    <div>Earned Basic</div><div className="text-center">:</div><div className="text-right pr-6">{formatCurrency(basic)}</div>
                    <div>Earned HRA</div><div className="text-center">:</div><div className="text-right pr-6">{formatCurrency(hra)}</div>
                    <div>Earned Conveyance</div><div className="text-center">:</div><div className="text-right pr-6">{formatCurrency(conveyance)}</div>
                    <div>Earned Personal Pay</div><div className="text-center">:</div><div className="text-right pr-6">-</div>
                    <div>Earned Special Allowance</div><div className="text-center">:</div><div className="text-right pr-6">-</div>
                    <div>Travel Allowance</div><div className="text-center">:</div><div className="text-right pr-6">-</div>
                    <div>Loyality Bonus / Annual (Variable)</div><div className="text-center">:</div><div className="text-right pr-6">-</div>
                    <div>Arrear Salary</div><div className="text-center">:</div><div className="text-right pr-6">-</div>
                    <div>Others</div><div className="text-center">:</div><div className="text-right pr-6">-</div>
                </div>

                {/* Deductions Column */}
                <div className="grid grid-cols-[180px_20px_1fr] gap-y-2 pl-4">
                    <div className="font-bold">Deductions</div>
                    <div></div>
                    <div className="font-bold text-right pr-12">Amount (INR)</div>

                    <div>Professional Tax</div><div className="text-center">:</div><div className="text-right pr-12">Nil</div>
                    <div>Advance</div><div className="text-center">:</div><div className="text-right pr-12">{advanceDeduction > 0 ? formatCurrency(advanceDeduction) : "N/A"}</div>
                    <div>Other Deductions</div><div className="text-center">:</div><div className="text-right pr-12">{otherDeductions > 0 ? formatCurrency(otherDeductions) : "N/A"}</div>
                </div>
            </div>

            {/* Totals Section */}
            <div className="mt-12 text-[13px] grid grid-cols-2 gap-x-12">
                <div className="grid grid-cols-[200px_1fr]">
                    <div className="font-normal">Total Earnings (INR)</div>
                    <div className="text-right pr-6">{formatCurrency(grossSalary)}</div>
                </div>
                <div className="grid grid-cols-[200px_1fr] pl-4">
                    <div className="font-normal">Total Deductions (INR)</div>
                    <div className="text-right pr-12">{totalDeductions > 0 ? formatCurrency(totalDeductions) : "-"}</div>
                </div>
            </div>

            {/* Net Pay Section */}
            <div className="mt-2 text-[13px] grid grid-cols-2 gap-x-12">
                <div className="grid grid-cols-[200px_1fr]">
                    <div className="font-bold">Net Pay (INR)</div>
                    <div className="font-normal text-right pr-6">{formatCurrency(netSalary)}</div>
                </div>
                <div></div>
            </div>

        </div>
    );
};
