import { useEffect, useMemo, useRef, useState } from "react";
import html2pdf from "html2pdf.js";
import { CalendarDays, CheckCircle2, FileText, IndianRupee, UserRound } from "lucide-react";

import { ProfessionalDialog } from "@/components/common/ProfessionalDialog";
import { InvoiceTemplate } from "@/components/InvoiceTemplate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type CustomerOption = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  address: string | null;
  lead_id: string | null;
};

type PropertyOption = {
  id: string;
  title: string;
  price: number | null;
  booking_amount: number | null;
  address: string | null;
  city: string | null;
  status: string | null;
  availability: string | null;
  zone_id: string | null;
};

type EmployeeOption = {
  id: string;
  name: string | null;
};

type BookingForm = {
  customer_id: string;
  property_id: string;
  assigned_to: string;
  total_amount: string;
  token_amount: string;
  brokerage_percent: string;
  booking_date: string;
  agreement_duration_days: string;
  brokerage_given: "yes" | "no";
  negotiable_amount: string;
  notes: string;
};

const initialForm = (): BookingForm => ({
  customer_id: "",
  property_id: "",
  assigned_to: "",
  total_amount: "",
  token_amount: "",
  brokerage_percent: "2",
  booking_date: new Date().toISOString().split("T")[0],
  agreement_duration_days: "45",
  brokerage_given: "no",
  negotiable_amount: "",
  notes: "",
});

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

const toNumber = (value: string | number | null | undefined) => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const addDays = (date: string, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString().split("T")[0];
};

const getErrorMessage = (error: unknown) => {
  return error instanceof Error ? error.message : "Something went wrong";
};

export default function NewBookingModal({ open, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<PropertyOption[]>([]);
  const [zoneEmployees, setZoneEmployees] = useState<EmployeeOption[]>([]);
  const [form, setForm] = useState<BookingForm>(() => initialForm());
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const invoiceRef = useRef<HTMLDivElement | null>(null);

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === form.customer_id) ?? null,
    [customers, form.customer_id]
  );

  const selectedProperty = useMemo(
    () => filteredProperties.find((property) => property.id === form.property_id) ?? null,
    [filteredProperties, form.property_id]
  );

  const selectedExecutive = useMemo(
    () => zoneEmployees.find((employee) => employee.id === form.assigned_to) ?? null,
    [form.assigned_to, zoneEmployees]
  );

  const totalAmount = toNumber(form.negotiable_amount || form.total_amount);
  const listedAmount = toNumber(form.total_amount);
  const tokenAmount = toNumber(form.token_amount);
  const brokeragePercent = toNumber(form.brokerage_percent);
  const minimumInitialPayment = Math.round(totalAmount * 0.1);
  const initialPayment = Math.max(tokenAmount, minimumInitialPayment);
  const balanceAmount = Math.max(totalAmount - initialPayment, 0);
  const brokerageAmount = Math.round((totalAmount * brokeragePercent) / 100);
  const agreementDays = Math.max(toNumber(form.agreement_duration_days), 1);

  const updateForm = <K extends keyof BookingForm>(key: K, value: BookingForm[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const resetState = () => {
    setForm(initialForm());
    setFilteredProperties([]);
    setZoneEmployees([]);
    setInvoiceData(null);
  };

  useEffect(() => {
    if (!open) return;

    const loadCustomers = async () => {
      setLoadingOptions(true);
      const { data, error } = await supabase
        .from("customers")
        .select("id, full_name, phone, email, address, lead_id")
        .order("full_name", { ascending: true });

      if (error) {
        console.error(error);
        toast.error("Failed to load customers");
      } else {
        setCustomers((data ?? []) as CustomerOption[]);
      }
      setLoadingOptions(false);
    };

    void loadCustomers();
  }, [open]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (loading) return;
    if (!nextOpen) {
      resetState();
      onClose();
    }
  };

  const handleCustomerChange = async (customerId: string) => {
    const customer = customers.find((item) => item.id === customerId) ?? null;

    setForm((previous) => ({
      ...previous,
      customer_id: customerId,
      property_id: "",
      assigned_to: "",
      total_amount: "",
      token_amount: "",
      negotiable_amount: "",
    }));
    setFilteredProperties([]);
    setZoneEmployees([]);

    if (!customer?.lead_id) {
      toast.info("This customer is not linked to a lead, so no shortlisted properties were found.");
      return;
    }

    const { data, error } = await supabase
      .from("lead_properties")
      .select(`
        properties (
          id,
          title,
          price,
          booking_amount,
          address,
          city,
          status,
          availability,
          zone_id
        )
      `)
      .eq("lead_id", customer.lead_id)
      .eq("is_active", true);

    if (error) {
      console.error(error);
      toast.error("Failed to load shortlisted properties");
      return;
    }

    const properties = (data ?? [])
      .map((row) => row.properties)
      .filter(Boolean) as unknown as PropertyOption[];

    setFilteredProperties(
      properties.filter((property) => {
        const status = (property.status ?? "").toLowerCase();
        const availability = (property.availability ?? "").toLowerCase();
        return !["sold", "booked", "cancelled"].includes(status) && availability !== "sold";
      })
    );
  };

  const handlePropertyChange = async (propertyId: string) => {
    const property = filteredProperties.find((item) => item.id === propertyId) ?? null;

    setForm((previous) => ({
      ...previous,
      property_id: propertyId,
      assigned_to: "",
      total_amount: property?.price ? String(property.price) : previous.total_amount,
      token_amount: property?.booking_amount ? String(property.booking_amount) : previous.token_amount,
    }));
    setZoneEmployees([]);

    if (!property?.zone_id) {
      toast.info("This property has no sales zone, so assign the executive manually later if needed.");
      return;
    }

    const { data, error } = await supabase
      .from("employees")
      .select("id, name")
      .eq("zone_id", property.zone_id)
      .eq("department", "Sales")
      .in("status", ["active", "confirmed", "probation"]);

    if (error) {
      console.error(error);
      toast.error("Failed to load zone executives");
      return;
    }

    const executives = (data ?? []) as EmployeeOption[];
    setZoneEmployees(executives);

    if (executives.length === 1) {
      updateForm("assigned_to", executives[0].id);
    }
  };

  const validate = () => {
    if (!form.customer_id) return "Select a customer";
    if (!form.property_id) return "Select a property";
    if (!form.assigned_to) return "Select a sales executive";
    if (!form.booking_date) return "Select a booking date";
    if (listedAmount <= 0) return "Enter a valid property value";
    if (totalAmount <= 0) return "Enter a valid final booking value";
    if (tokenAmount <= 0) return "Enter a valid token amount";
    if (tokenAmount > totalAmount) return "Token amount cannot be greater than final booking value";
    if (brokeragePercent < 0 || brokeragePercent > 100) return "Brokerage percent must be between 0 and 100";
    if (toNumber(form.negotiable_amount) > listedAmount) return "Negotiable/final amount cannot exceed listed value";
    if (tokenAmount < minimumInitialPayment) {
      return `Token amount must be at least 10% of final value (${money(minimumInitialPayment)})`;
    }
    return null;
  };

  const generateBookingCode = async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const year = new Date().getFullYear().toString().slice(-2);
      const month = String(new Date().getMonth() + 1).padStart(2, "0");
      const sequence = String(Math.floor(1000 + Math.random() * 9000));
      const code = `PRBK-${year}${month}-${sequence}`;

      const { count, error } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("booking_code", code);

      if (error) throw error;
      if (!count) return code;
    }

    throw new Error("Unable to generate a unique booking code. Please try again.");
  };

  const downloadInvoice = async (invoice: InvoiceData) => {
    if (!invoiceRef.current) return;

    await html2pdf()
      .set({
        margin: 0.35,
        filename: `Invoice-${invoice.invoice_no}.pdf`,
        image: { type: "jpeg", quality: 1 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
      })
      .from(invoiceRef.current)
      .save();
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setLoading(true);

    try {
      const bookingCode = await generateBookingCode();
      const dueDate = addDays(form.booking_date, agreementDays);

      const bookingPayload = {
        booking_code: bookingCode,
        customer_id: form.customer_id,
        property_id: form.property_id,
        assigned_to: form.assigned_to,
        total_amount: totalAmount,
        token_amount: tokenAmount,
        initial_payment: initialPayment,
        balance_amount: balanceAmount,
        brokerage_percent: brokeragePercent,
        brokerage_amount: brokerageAmount,
        brokerage_given: form.brokerage_given === "yes",
        booking_date: form.booking_date,
        agreement_duration_days: agreementDays,
        negotiable_amount: form.negotiable_amount ? totalAmount : null,
        stage: "booking",
        notes: form.notes.trim() || null,
      };

      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert(bookingPayload)
        .select("id")
        .single();

      if (bookingError) throw bookingError;

      const paymentRows = [
        {
          booking_id: booking.id,
          milestone: "Booking / Token Amount",
          amount: initialPayment,
          paid_amount: tokenAmount,
          due_date: form.booking_date,
          status: tokenAmount >= initialPayment ? "paid" : "partial",
        },
        {
          booking_id: booking.id,
          milestone: "Balance Amount",
          amount: balanceAmount,
          paid_amount: 0,
          due_date: dueDate,
          status: balanceAmount > 0 ? "pending" : "paid",
        },
      ];

      if (brokerageAmount > 0) {
        paymentRows.push({
          booking_id: booking.id,
          milestone: "Brokerage",
          amount: brokerageAmount,
          paid_amount: form.brokerage_given === "yes" ? brokerageAmount : 0,
          due_date: form.booking_date,
          status: form.brokerage_given === "yes" ? "paid" : "pending",
        });
      }

      const { error: paymentError } = await supabase.from("payments").insert(paymentRows);
      if (paymentError) throw paymentError;

      await Promise.all([
        supabase
          .from("properties")
          .update({ status: "booked", availability: "booked" })
          .eq("id", form.property_id),
        supabase.from("customers").update({ status: "booked" }).eq("id", form.customer_id),
      ]);

      const invoice: InvoiceData = {
        customer_name: selectedCustomer?.full_name || "N/A",
        address: selectedCustomer?.address || "N/A",
        invoice_no: bookingCode,
        date: new Date(form.booking_date).toLocaleDateString("en-IN"),
        property_title: selectedProperty?.title || "N/A",
        executive_name: selectedExecutive?.name || "N/A",
        token: tokenAmount,
        brokerage: brokerageAmount,
        due: balanceAmount,
        total: tokenAmount + brokerageAmount,
      };

      setInvoiceData(invoice);

      setTimeout(async () => {
        await downloadInvoice(invoice);
        toast.success("Booking created and invoice generated");
        onSuccess();
        resetState();
        onClose();
      }, 250);
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const stepState = [
    { label: "Customer", done: !!form.customer_id },
    { label: "Property", done: !!form.property_id },
    { label: "Executive", done: !!form.assigned_to },
    { label: "Payment", done: tokenAmount > 0 && totalAmount > 0 },
  ];

  return (
    <ProfessionalDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Create New Booking"
      description="Convert a qualified customer and shortlisted property into a tracked sale with payment milestones."
      className="sm:max-w-[980px] w-[96vw]"
      contentClassName="p-0"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={loading || loadingOptions}>
            {loading ? "Creating Booking..." : "Create Booking"}
          </Button>
        </>
      }
    >
      <div className="grid h-[72vh] grid-cols-1 overflow-hidden lg:grid-cols-[1fr_340px]">
        {/* Left */}
        <div className="overflow-y-auto px-6 py-5">
          <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            {stepState.map((step, index) => (
              <div
                key={step.label}
                className={cn(
                  "rounded-xl border px-3 py-2 text-sm",
                  step.done ? "border-success/30 bg-success/10 text-success" : "bg-muted/30 text-muted-foreground"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-background text-xs font-semibold">
                    {step.done ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                  </span>
                  {step.label}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border p-4">
              <div className="mb-4 flex items-center gap-2">
                <UserRound className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Customer & Property</h3>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Customer</Label>
                  <Select value={form.customer_id} onValueChange={(value) => void handleCustomerChange(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingOptions ? "Loading customers..." : "Select customer"} />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.full_name} {customer.phone ? `- ${customer.phone}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Shortlisted Property</Label>
                  <Select
                    value={form.property_id}
                    onValueChange={(value) => void handlePropertyChange(value)}
                    disabled={!form.customer_id || filteredProperties.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          !form.customer_id
                            ? "Select customer first"
                            : filteredProperties.length === 0
                              ? "No active shortlisted properties"
                              : "Select property"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredProperties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.title} {property.price ? `- ${money(property.price)}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Sales Executive</Label>
                  <Select
                    value={form.assigned_to}
                    onValueChange={(value) => updateForm("assigned_to", value)}
                    disabled={!form.property_id || zoneEmployees.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          !form.property_id
                            ? "Select property first"
                            : zoneEmployees.length === 0
                              ? "No active zone executives"
                              : "Select executive"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {zoneEmployees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Booking Date</Label>
                  <Input
                    type="date"
                    value={form.booking_date}
                    onChange={(event) => updateForm("booking_date", event.target.value)}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border p-4">
              <div className="mb-4 flex items-center gap-2">
                <IndianRupee className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Commercial Terms</h3>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Listed / Property Value</Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.total_amount}
                    placeholder="Enter listed value"
                    onChange={(event) => updateForm("total_amount", event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Final Negotiated Value</Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.negotiable_amount}
                    placeholder="Optional, if different from listed value"
                    onChange={(event) => updateForm("negotiable_amount", event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Token Paid Now</Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.token_amount}
                    placeholder={`Minimum ${money(minimumInitialPayment)}`}
                    onChange={(event) => updateForm("token_amount", event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Brokerage %</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={form.brokerage_percent}
                    onChange={(event) => updateForm("brokerage_percent", event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Agreement Timeline</Label>
                  <Input
                    type="number"
                    min="1"
                    value={form.agreement_duration_days}
                    onChange={(event) => updateForm("agreement_duration_days", event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Brokerage Received?</Label>
                  <Select value={form.brokerage_given} onValueChange={(value) => updateForm("brokerage_given", value as "yes" | "no")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No, mark as receivable</SelectItem>
                      <SelectItem value="yes">Yes, received</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Internal Notes</Label>
                  <Textarea
                    value={form.notes}
                    placeholder="Payment mode, promised documents, special terms, etc."
                    onChange={(event) => updateForm("notes", event.target.value)}
                  />
                </div>
              </div>
            </section>
          </div>
        </div>
        
        {/* Right */}
        <aside className="border-t bg-muted/20 p-5 lg:border-l lg:border-t-0 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Booking Summary</h3>
              <p className="text-sm text-muted-foreground">Review before creating the booking.</p>
            </div>

            <div className="space-y-3 rounded-2xl border bg-background p-4 text-sm">
              <SummaryRow label="Customer" value={selectedCustomer?.full_name || "-"} />
              <SummaryRow label="Property" value={selectedProperty?.title || "-"} />
              <SummaryRow label="Executive" value={selectedExecutive?.name || "-"} />
              <SummaryRow label="Booking Date" value={form.booking_date || "-"} icon={<CalendarDays className="h-4 w-4" />} />
            </div>

            <div className="space-y-3 rounded-2xl border bg-background p-4 text-sm">
              <SummaryRow label="Final Value" value={money(totalAmount)} strong />
              <SummaryRow label="Token Paid" value={money(tokenAmount)} />
              <SummaryRow label="Initial Payment" value={money(initialPayment)} />
              <SummaryRow label="Balance Due" value={money(balanceAmount)} />
              <SummaryRow label="Brokerage" value={`${money(brokerageAmount)} (${brokeragePercent || 0}%)`} />
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <div className="mb-2 flex items-center gap-2 font-medium">
                <FileText className="h-4 w-4" />
                Real-life actions on save
              </div>
              <p>The booking is created, payment milestones are added, the property is marked booked, and an invoice PDF is downloaded.</p>
            </div>
          </div>
        </aside>
      </div>

      <div className="fixed -left-[9999px] top-0">
        {invoiceData ? (
          <div ref={invoiceRef}>
            <InvoiceTemplate booking={invoiceData} currentPayment={null} />
          </div>
        ) : null}
      </div>
    </ProfessionalDialog>
  );
}

function SummaryRow({
  label,
  value,
  strong,
  icon,
}: {
  label: string;
  value: string | number | null | undefined;
  strong?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="flex items-center gap-1 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className={cn("text-right", strong && "font-semibold text-foreground")}>{value ?? "-"}</span>
    </div>
  );
}

type InvoiceData = {
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
