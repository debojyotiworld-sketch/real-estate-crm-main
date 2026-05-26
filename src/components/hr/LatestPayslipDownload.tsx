import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Download } from 'lucide-react'; // assuming you use lucide-react for icons
import { Button } from '@/components/ui/button'; // Shadcn UI button
import { PayslipTemplate } from './PayslipTemplate';
import { useLatestPayroll } from '@/hooks/hr/useLatestPayroll';

interface Props {
  employeeId: string;
}

export function LatestPayslipDownload({ employeeId }: Props) {
  const { latestPayroll, loading } = useLatestPayroll(employeeId);
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Payslip_${latestPayroll?.employee?.name || 'Employee'}_Latest`,
    pageStyle: "@page { size: auto;  margin: 0mm; } @media print { body { -webkit-print-color-adjust: exact; } }",
  } as any);

  if (loading) {
    return (
      <Button variant="outline" disabled className="animate-pulse">
        Loading Payslip...
      </Button>
    );
  }

  // যদি ওই ইউজারের কোনো পেরোল না থাকে
  if (!latestPayroll) {
    return (
      <Button variant="outline" disabled>
        No Payslip Available
      </Button>
    );
  }

  return (
    <div>
      {/* Hidden Payslip UI (This only renders in the PDF/Print window) */}
      <div className="hidden">
        <div ref={componentRef}>
          <PayslipTemplate payroll={latestPayroll} />
        </div>
      </div>
      
      {/* Visible Action Button */}
      <Button onClick={handlePrint} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
        <Download size={16} />
        Download Latest Payslip
      </Button>
    </div>
  );
}