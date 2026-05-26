import React from "react";

export type InvoiceData = {
  customer_name: string;
  address: string;
  invoice_no: string;
  date: string;
  property_title: string;
  executive_name: string;
  token: number;
  brokerage: number;
  due: number;
  total: number;
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const InvoiceTemplate = React.forwardRef<HTMLDivElement, { data: InvoiceData }>(({ data }, ref) => {
  return (
    <div ref={ref} style={{ width: 794, minHeight: 1123, padding: 48, fontFamily: "Arial", color: "#111827", background: "#fff" }}>
      <header style={{ display: "flex", justifyContent: "space-between", borderBottom: "3px solid #0f172a", paddingBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, color: "#0f172a", fontSize: 28 }}>Phoenix Realesthatic</h1>
          <p style={{ margin: "8px 0 0", color: "#64748b" }}>Turning Properties into Prosperities</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <h2 style={{ margin: 0, color: "#ea580c", fontSize: 26 }}>BOOKING INVOICE</h2>
          <p style={{ margin: "8px 0 0" }}>#{data.invoice_no}</p>
          <p style={{ margin: "4px 0 0", color: "#64748b" }}>{data.date}</p>
        </div>
      </header>

      <section style={{ display: "flex", justifyContent: "space-between", gap: 32, marginTop: 32 }}>
        <div>
          <p style={{ margin: 0, color: "#64748b", fontSize: 12, textTransform: "uppercase" }}>Invoice To</p>
          <h3 style={{ margin: "8px 0 4px", fontSize: 18 }}>{data.customer_name}</h3>
          <p style={{ margin: 0, color: "#475569", lineHeight: 1.5 }}>{data.address}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0, color: "#64748b", fontSize: 12, textTransform: "uppercase" }}>Property</p>
          <h3 style={{ margin: "8px 0 4px", fontSize: 18 }}>{data.property_title}</h3>
          <p style={{ margin: 0, color: "#475569" }}>Executive: {data.executive_name}</p>
        </div>
      </section>

      <table style={{ width: "100%", marginTop: 40, borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ background: "#0f172a", color: "#fff" }}>
            <th style={{ padding: 12, textAlign: "left" }}>Description</th>
            <th style={{ padding: 12, textAlign: "right" }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          <InvoiceRow label="Token / Booking Amount Received" amount={data.token} />
          <InvoiceRow label="Brokerage Charge" amount={data.brokerage} />
          <InvoiceRow label="Balance Payable by Customer" amount={data.due} muted />
        </tbody>
      </table>

      <div style={{ marginTop: 28, display: "flex", justifyContent: "flex-end" }}>
        <div style={{ width: 300, border: "1px solid #cbd5e1", borderRadius: 12, padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span>Invoice Total</span>
            <strong>{formatMoney(data.total)}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}>
            <span>Pending Balance</span>
            <span>{formatMoney(data.due)}</span>
          </div>
        </div>
      </div>

      <section style={{ marginTop: 48, color: "#475569", fontSize: 13, lineHeight: 1.7 }}>
        <h4 style={{ color: "#111827", marginBottom: 8 }}>Terms</h4>
        <p>This invoice confirms booking creation and received/payable commercial components. Balance payment and documentation milestones remain subject to agreement terms and company policy.</p>
      </section>

      <footer style={{ marginTop: 96, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
        <div>
          <p style={{ marginBottom: 52 }}>For Phoenix Real Estate</p>
          <p style={{ borderTop: "1px solid #111827", paddingTop: 8 }}>Authorized Signatory</p>
        </div>
        <div>
          <p style={{ marginBottom: 52 }}>Customer Acceptance</p>
          <p style={{ borderTop: "1px solid #111827", paddingTop: 8 }}>{data.customer_name}</p>
        </div>
      </footer>
    </div>
  );
});

InvoiceTemplate.displayName = "InvoiceTemplate";

function InvoiceRow({ label, amount, muted }: { label: string; amount: number; muted?: boolean }) {
  return (
    <tr>
      <td style={{ padding: 12, border: "1px solid #cbd5e1", color: muted ? "#64748b" : "#111827" }}>{label}</td>
      <td style={{ padding: 12, border: "1px solid #cbd5e1", textAlign: "right", color: muted ? "#64748b" : "#111827" }}>
        {formatMoney(amount)}
      </td>
    </tr>
  );
}

export default InvoiceTemplate;
