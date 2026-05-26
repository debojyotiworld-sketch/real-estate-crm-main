import html2pdf from "html2pdf.js";

type OfferLetterEmployee = {
  employee_code?: string | null;
  name?: string | null;
  email?: string | null;
  department?: string | null;
  designation?: string | null;
  joining_date?: string | null;
  address?: string | null;
};

type CompanySettings = {
  company_name?: string | null;
  address?: string | null;
  email?: string | null;
  phone?: number | string | null;
  logo_url?: string | null;
};

type OfferLetterInput = {
  employee: OfferLetterEmployee;
  company?: CompanySettings | null;
};

const formatDate = (date?: string | null) => {
  if (!date) return "To be confirmed";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const safe = (value?: string | number | null, fallback = "-") => {
  const text = value == null ? "" : String(value).trim();
  return text || fallback;
};

const fileSafe = (value?: string | null) => {
  return safe(value, "employee").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
};

export async function downloadOfferLetterPdf({ employee, company }: OfferLetterInput) {
  const companyName = safe(company?.company_name, "Phoenix Real Estate CRM");
  const today = formatDate(new Date().toISOString());
  const joiningDate = formatDate(employee.joining_date);
  const employeeName = safe(employee.name, "Employee");
  const designation = safe(employee.designation, "Team Member");
  const department = safe(employee.department, "General");

  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed";
  wrapper.style.left = "-10000px";
  wrapper.style.top = "0";
  wrapper.innerHTML = `
    <section style="width: 794px; min-height: 1123px; padding: 56px; color: #111827; font-family: Arial, sans-serif; background: #ffffff;">
      <header style="display: flex; justify-content: space-between; gap: 24px; border-bottom: 3px solid #0f172a; padding-bottom: 20px;">
        <div>
          <h1 style="margin: 0; font-size: 28px; letter-spacing: -0.02em;">${companyName}</h1>
          <p style="margin: 8px 0 0; font-size: 12px; color: #4b5563; line-height: 1.5;">${safe(company?.address, "")}</p>
          <p style="margin: 4px 0 0; font-size: 12px; color: #4b5563;">${safe(company?.email, "")}${company?.phone ? ` | ${company.phone}` : ""}</p>
        </div>
        ${company?.logo_url ? `<img src="${company.logo_url}" style="max-width: 120px; max-height: 72px; object-fit: contain;" />` : ""}
      </header>

      <main style="padding-top: 40px;">
        <p style="margin: 0 0 28px; text-align: right; font-size: 13px;">Date: ${today}</p>
        <p style="margin: 0 0 8px; font-size: 14px;">To,</p>
        <p style="margin: 0; font-size: 16px; font-weight: 700;">${employeeName}</p>
        <p style="margin: 4px 0 0; font-size: 13px; color: #4b5563;">${safe(employee.address, "")}</p>

        <h2 style="margin: 40px 0 24px; text-align: center; font-size: 22px; text-decoration: underline;">Offer Letter</h2>

        <p style="font-size: 14px; line-height: 1.8;">Dear ${employeeName},</p>
        <p style="font-size: 14px; line-height: 1.8;">
          We are pleased to offer you the position of <strong>${designation}</strong> in the
          <strong>${department}</strong> department at <strong>${companyName}</strong>.
          Your expected date of joining is <strong>${joiningDate}</strong>.
        </p>
        <p style="font-size: 14px; line-height: 1.8;">
          Your employment will be governed by the company's policies, code of conduct, confidentiality obligations,
          and any additional terms communicated during onboarding. This letter is generated dynamically from the CRM
          and does not require a stored file copy.
        </p>

        <table style="width: 100%; margin: 32px 0; border-collapse: collapse; font-size: 13px;">
          <tbody>
            <tr>
              <td style="width: 32%; border: 1px solid #d1d5db; padding: 10px; font-weight: 700;">Employee Code</td>
              <td style="border: 1px solid #d1d5db; padding: 10px;">${safe(employee.employee_code)}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #d1d5db; padding: 10px; font-weight: 700;">Designation</td>
              <td style="border: 1px solid #d1d5db; padding: 10px;">${designation}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #d1d5db; padding: 10px; font-weight: 700;">Department</td>
              <td style="border: 1px solid #d1d5db; padding: 10px;">${department}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #d1d5db; padding: 10px; font-weight: 700;">Joining Date</td>
              <td style="border: 1px solid #d1d5db; padding: 10px;">${joiningDate}</td>
            </tr>
          </tbody>
        </table>

        <p style="font-size: 14px; line-height: 1.8;">
          Please sign and return a copy of this letter as acceptance of the offer. We look forward to having you as
          part of our team.
        </p>
      </main>

      <footer style="margin-top: 80px; display: flex; justify-content: space-between; gap: 48px; font-size: 13px;">
        <div>
          <p style="margin: 0 0 48px;">For ${companyName}</p>
          <p style="margin: 0; border-top: 1px solid #111827; padding-top: 8px;">Authorized Signatory</p>
        </div>
        <div>
          <p style="margin: 0 0 48px;">Accepted by</p>
          <p style="margin: 0; border-top: 1px solid #111827; padding-top: 8px;">${employeeName}</p>
        </div>
      </footer>
    </section>
  `;

  document.body.appendChild(wrapper);

  await html2pdf()
    .set({
      margin: 0,
      filename: `Offer-Letter-${fileSafe(employee.name)}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "px", format: [794, 1123], orientation: "portrait" },
    })
    .from(wrapper.firstElementChild as HTMLElement)
    .save();

  wrapper.remove();
}
