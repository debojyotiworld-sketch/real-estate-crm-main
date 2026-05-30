import React from 'react';
import { format } from 'date-fns';

interface InvoiceProps {
  booking: any;
  currentPayment?: any; // The specific 50% or partial payment object
}

export const InvoiceTemplate = React.forwardRef<HTMLDivElement, InvoiceProps>(({ booking, currentPayment }, ref) => {
  // Default values to prevent crash
  const totalAmount = Number(booking?.total_amount || 0);
  const previouslyPaid = Number(booking?.paid_amount || 0) - Number(currentPayment?.amount || 0);
  const currentReceived = Number(currentPayment?.amount || booking?.paid_amount || 0);
  const balanceDue = totalAmount - (previouslyPaid + currentReceived);

  const receiptNo = currentPayment?.invoice_no || `INV-${booking?.id?.substring(0, 8).toUpperCase()}`;
  const paymentDate = currentPayment?.date ? new Date(currentPayment.date) : new Date();

  return (
    <div ref={ref} className="p-10 bg-white text-black w-full max-w-[800px] mx-auto font-sans" style={{ minHeight: '1056px' }}>
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">PHOENIX REAL ESTATES</h1>
          <p className="text-sm text-slate-500 mt-1">123 Business Avenue, Tech Park</p>
          <p className="text-sm text-slate-500">Kolkata, West Bengal - 700091</p>
          <p className="text-sm text-slate-500">GSTIN: 19ABCDE1234F1Z5</p>
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-bold text-indigo-700 uppercase">Payment Receipt</h2>
          <div className="mt-2 space-y-1">
            <p className="text-sm"><strong>Receipt No:</strong> {receiptNo}</p>
            <p className="text-sm"><strong>Date:</strong> {format(paymentDate, 'dd MMM, yyyy')}</p>
            <p className="text-sm"><strong>Mode:</strong> {currentPayment?.mode || 'N/A'} {currentPayment?.ref_no ? `(${currentPayment.ref_no})` : ''}</p>
          </div>
        </div>
      </div>

      {/* Bill To & Property Details */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Received From</h3>
          <p className="text-lg font-bold text-slate-800">{booking?.customers?.name || 'Customer Name'}</p>
          <p className="text-sm text-slate-600">{booking?.customers?.phone || 'Phone N/A'}</p>
          <p className="text-sm text-slate-600">{booking?.customers?.email || 'Email N/A'}</p>
        </div>
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Against Property / Deal</h3>
          <p className="text-base font-semibold text-slate-800">{booking?.properties?.title || 'Property Details'}</p>
          <p className="text-sm text-slate-600">Booking ID: {booking?.id?.substring(0, 8).toUpperCase()}</p>
        </div>
      </div>

      {/* Payment Details Table */}
      <table className="w-full mb-8 border-collapse">
        <thead>
          <tr className="bg-slate-100">
            <th className="py-3 px-4 text-left text-sm font-bold text-slate-700 border-b">Description</th>
            <th className="py-3 px-4 text-right text-sm font-bold text-slate-700 border-b">Amount (INR)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="py-4 px-4 border-b text-sm text-slate-800">
              <span className="font-semibold">Partial Payment / Installment</span>
              <br />
              <span className="text-xs text-slate-500">Towards deal value for property booking.</span>
            </td>
            <td className="py-4 px-4 border-b text-right text-base font-bold text-slate-800">
              ₹ {currentReceived.toLocaleString()}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Deal Summary / Math */}
      <div className="flex justify-end">
        <div className="w-1/2 space-y-3">
          <div className="flex justify-between text-sm text-slate-600">
            <span>Total Deal Value:</span>
            <span className="font-semibold">₹ {totalAmount.toLocaleString()}</span>
          </div>
          {previouslyPaid > 0 && (
            <div className="flex justify-between text-sm text-slate-600">
              <span>Previously Received:</span>
              <span className="font-semibold">₹ {previouslyPaid.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-slate-800 border-t pt-2 border-slate-200">
            <span>Amount Received Now:</span>
            <span className="text-indigo-700">₹ {currentReceived.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm text-rose-600 font-bold bg-rose-50 p-2 rounded">
            <span>Balance Due:</span>
            <span>₹ {balanceDue > 0 ? balanceDue.toLocaleString() : '0 (Fully Paid)'}</span>
          </div>
        </div>
      </div>

      {/* Footer Signatures */}
      <div className="mt-24 grid grid-cols-2 gap-8 text-center">
        <div>
          <div className="border-t border-slate-300 w-48 mx-auto pt-2 text-sm text-slate-600">Customer Signature</div>
        </div>
        <div>
          <div className="border-t border-slate-300 w-48 mx-auto pt-2 text-sm text-slate-600">Authorized Signatory</div>
        </div>
      </div>
      
      <div className="mt-12 text-center text-xs text-slate-400 border-t pt-4">
        This is a computer-generated receipt and does not require a physical signature for validity.
      </div>
    </div>
  );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';

export default InvoiceTemplate;