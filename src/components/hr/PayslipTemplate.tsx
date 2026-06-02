import React from "react";

interface PayslipProps {
  employee: any; 
  payroll: any;
   
}

export const PayslipTemplate: React.FC<PayslipProps> = ({ employee, payroll }) => {
  return (
    // 'print:block' এবং 'hidden' এর ব্যবহার খুব জরুরি। এটি শুধু প্রিন্ট করার সময় শো করবে।
    <div id="printable-payslip" className="bg-white p-8 w-full max-w-4xl mx-auto text-black font-sans text-sm">
      
      <div className="border-2 border-black">
        {/* Header */}
        <div className="text-center border-b-2 border-black p-4">
          <h1 className="text-2xl font-bold uppercase tracking-wide">Phoenix Real Estate</h1>
          <p className="text-xs mt-1">123 Business Avenue, Kolkata, West Bengal - 700001</p>
          <h2 className="text-lg font-bold mt-3 underline uppercase">
            Payslip for the month of {payroll?.month || "June"} {payroll?.year || "2026"}
          </h2>
        </div>

        {/* Employee Details */}
        <div className="grid grid-cols-2 border-b-2 border-black">
          <div className="border-r-2 border-black p-3 space-y-2">
            <div className="flex"><span className="w-32 font-bold">Employee Name</span><span>: {employee?.name || "Sayani Dutta"}</span></div>
            <div className="flex"><span className="w-32 font-bold">Employee ID</span><span>: {employee?.employee_code || "PR26H-003"}</span></div>
            <div className="flex"><span className="w-32 font-bold">Designation</span><span>: {employee?.designation || "HR"}</span></div>
          </div>
          <div className="p-3 space-y-2">
            <div className="flex"><span className="w-32 font-bold">Total Days</span><span>: {payroll?.working_days || 26}</span></div>
            <div className="flex"><span className="w-32 font-bold">Paid Days</span><span>: {payroll?.present_days || 26}</span></div>
            <div className="flex"><span className="w-32 font-bold">LOP Days</span><span>: {payroll?.lop_days || 0}</span></div>
          </div>
        </div>

        {/* Earnings & Deductions Table */}
        <div className="flex border-b-2 border-black min-h-[250px]">
          {/* Earnings */}
          <div className="w-1/2 border-r-2 border-black flex flex-col">
            <div className="flex justify-between border-b-2 border-black p-2 font-bold bg-gray-100">
              <span>Earnings</span><span>Amount (₹)</span>
            </div>
            <div className="p-2 space-y-2 flex-grow">
              <div className="flex justify-between"><span>Basic Salary</span><span>{payroll?.basic || 0}</span></div>
              <div className="flex justify-between"><span>House Rent Allowance</span><span>{payroll?.hra || 0}</span></div>
            </div>
          </div>

          {/* Deductions */}
          <div className="w-1/2 flex flex-col">
            <div className="flex justify-between border-b-2 border-black p-2 font-bold bg-gray-100">
              <span>Deductions</span><span>Amount (₹)</span>
            </div>
            <div className="p-2 space-y-2 flex-grow">
              <div className="flex justify-between"><span>Provident Fund (PF)</span><span>{payroll?.pf_deduction || 0}</span></div>
              <div className="flex justify-between"><span>ESI</span><span>{payroll?.esi_deduction || 0}</span></div>
              <div className="flex justify-between text-red-600"><span>Leave Penalty / LOP</span><span>{payroll?.leave_deduction || 0}</span></div>
            </div>
          </div>
        </div>

        {/* Totals */}
        <div className="flex border-b-2 border-black">
          <div className="w-1/2 border-r-2 border-black p-2 flex justify-between font-bold">
            <span>Gross Earnings</span><span>₹ {payroll?.gross_salary || 0}</span>
          </div>
          <div className="w-1/2 p-2 flex justify-between font-bold">
            <span>Total Deductions</span><span>₹ {payroll?.total_deductions || 0}</span>
          </div>
        </div>

        {/* Net Salary Payable */}
        <div className="p-4 flex justify-between items-center text-lg font-bold bg-gray-100">
          <span>NET SALARY PAYABLE</span>
          <span className="text-xl">₹ {payroll?.net_salary || 0}</span>
        </div>
      </div>

      {/* Signatures */}
      <div className="mt-20 flex justify-between px-10">
        <div className="text-center border-t border-black w-48 pt-2">Authorized Signatory</div>
        <div className="text-center border-t border-black w-48 pt-2">Employee Signature</div>
      </div>
      
      <p className="text-center text-xs mt-8 italic text-gray-500">
        This is a computer-generated document. No signature is required.
      </p>
    </div>
  );
};