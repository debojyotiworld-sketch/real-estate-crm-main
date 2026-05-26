import React, { forwardRef } from 'react';

interface PayslipProps {
  payroll: any;
}

export const PayslipTemplate = forwardRef<HTMLDivElement, PayslipProps>(
  ({ payroll }, ref) => {
    if (!payroll) return null;

    const getMonthYear = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    return (
      <div ref={ref} className="p-8 bg-white text-black w-full max-w-4xl mx-auto" style={{ minHeight: '842px' }}>
        
        {/* Header Section */}
        <div className="text-center border-b-2 border-gray-300 pb-6 mb-6">
          <h1 className="text-3xl font-bold uppercase tracking-wider text-gray-800">Your Company Name</h1>
          <p className="text-sm text-gray-500 mt-1">123 Tech Park, Sector V, Kolkata, India</p>
          <h2 className="text-xl font-semibold mt-4 text-gray-700">
            Payslip for {getMonthYear(payroll.created_at || new Date().toISOString())}
          </h2>
        </div>

        {/* Employee Information */}
        <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
          <div className="space-y-2">
            <p><span className="font-semibold w-32 inline-block">Employee Name:</span> {payroll.employee?.name || 'N/A'}</p>
            <p><span className="font-semibold w-32 inline-block">Employee ID:</span> {payroll.employee_id}</p>
            <p><span className="font-semibold w-32 inline-block">Department:</span> {payroll.employee?.department || 'N/A'}</p>
          </div>
          <div className="space-y-2">
            <p><span className="font-semibold w-32 inline-block">Designation:</span> {payroll.employee?.designation || 'N/A'}</p>
            <p><span className="font-semibold w-32 inline-block">Payment Date:</span> {new Date(payroll.created_at).toLocaleDateString()}</p>
            <p><span className="font-semibold w-32 inline-block">Bank Account:</span> {payroll.employee?.bank_account || 'XXXX-XXXX-XXXX'}</p>
          </div>
        </div>

        {/* Salary Details Table */}
        <table className="w-full mb-8 border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="border border-gray-300 p-3 text-left w-1/4">Earnings</th>
              <th className="border border-gray-300 p-3 text-right w-1/4">Amount</th>
              <th className="border border-gray-300 p-3 text-left w-1/4">Deductions</th>
              <th className="border border-gray-300 p-3 text-right w-1/4">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 p-3">Basic Salary</td>
              <td className="border border-gray-300 p-3 text-right">₹{payroll.basic_salary || 0}</td>
              <td className="border border-gray-300 p-3">Tax / TDS</td>
              <td className="border border-gray-300 p-3 text-right">₹{payroll.tax_deduction || 0}</td>
            </tr>
            <tr>
              <td className="border border-gray-300 p-3">Allowances</td>
              <td className="border border-gray-300 p-3 text-right">₹{payroll.allowances || 0}</td>
              <td className="border border-gray-300 p-3">Provident Fund (PF)</td>
              <td className="border border-gray-300 p-3 text-right">₹{payroll.pf_deduction || 0}</td>
            </tr>
            {/* Totals */}
            <tr className="font-bold bg-gray-50">
              <td className="border border-gray-300 p-3 text-right">Total Earnings:</td>
              <td className="border border-gray-300 p-3 text-right">
                ₹{(payroll.basic_salary || 0) + (payroll.allowances || 0)}
              </td>
              <td className="border border-gray-300 p-3 text-right">Total Deductions:</td>
              <td className="border border-gray-300 p-3 text-right">
                ₹{(payroll.tax_deduction || 0) + (payroll.pf_deduction || 0)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Net Salary Highlight */}
        <div className="flex justify-end mb-12">
          <div className="bg-green-50 px-6 py-4 rounded-md border border-green-200 shadow-sm text-right">
            <p className="text-gray-600 text-sm mb-1">Net Payable Amount</p>
            <p className="text-2xl font-bold text-green-700">₹{payroll.net_salary || 0}</p>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-4 mt-20 pt-8">
          <div className="text-center">
            <div className="border-t border-gray-400 w-56 mx-auto pt-2 text-sm text-gray-600">Employer Signature</div>
          </div>
          <div className="text-center">
            <div className="border-t border-gray-400 w-56 mx-auto pt-2 text-sm text-gray-600">Employee Signature</div>
          </div>
        </div>
        
        <p className="text-center text-xs text-gray-400 mt-12">This is a system-generated payslip and does not require a physical signature.</p>
      </div>
    );
  }
);

PayslipTemplate.displayName = 'PayslipTemplate';