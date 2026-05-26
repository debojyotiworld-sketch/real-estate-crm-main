import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  Calendar,
  Eye,
  FileText,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { ProfessionalDialog } from "@/components/common/ProfessionalDialog";
import { MainLayout } from "@/components/layout/MainLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type BookingStage = "booking" | "allotment" | "agreement" | "registration" | "completed" | "cancelled";

type CustomerDocument = {
  id: string;
  document_type: string;
  document_url: string;
  created_at: string | null;
};

type CustomerBooking = {
  id: string;
  booking_date: string | null;
  stage: BookingStage | string | null;
  total_amount: number | null;
  balance_amount: number | null;
  properties?: {
    id: string;
    title: string;
    property_code: string | null;
    address: string | null;
    city: string | null;
  } | null;
};

type CustomerRow = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  address: string | null;
  city: string | null;
  source: string | null;
  status: string | null;
  bookings?: CustomerBooking[] | null;
  customer_documents?: CustomerDocument[] | null;
};

type UploadKey = "aadhar_front" | "aadhar_back" | "pan";

type UploadState = Record<UploadKey, File | null>;

const stageStyles: Record<BookingStage, { bg: string; text: string; label: string }> = {
  booking: { bg: "bg-info/10", text: "text-info", label: "Booking" },
  allotment: { bg: "bg-warning/10", text: "text-warning", label: "Allotment" },
  agreement: { bg: "bg-accent/10", text: "text-accent", label: "Agreement" },
  registration: { bg: "bg-success/10", text: "text-success", label: "Registration" },
  completed: { bg: "bg-success/10", text: "text-success", label: "Completed" },
  cancelled: { bg: "bg-destructive/10", text: "text-destructive", label: "Cancelled" },
};

const defaultStage = { bg: "bg-muted", text: "text-muted-foreground", label: "N/A" };

const documentLabels: Record<UploadKey, string> = {
  aadhar_front: "Aadhar Front",
  aadhar_back: "Aadhar Back",
  pan: "PAN Card",
};

const initialFiles: UploadState = {
  aadhar_front: null,
  aadhar_back: null,
  pan: null,
};

const formatMoney = (value?: number | null) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const getInitials = (name?: string | null) => {
  if (!name) return "NA";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

const getErrorMessage = (error: unknown) => {
  return error instanceof Error ? error.message : "Something went wrong";
};

export default function Customers() {
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [customerList, setCustomerList] = useState<CustomerRow[]>([]);
  const [files, setFiles] = useState<UploadState>(initialFiles);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("customers")
      .select(`
        id,
        full_name,
        phone,
        email,
        address,
        city,
        source,
        status,
        bookings (
          id,
          booking_date,
          stage,
          total_amount,
          balance_amount,
          properties (
            id,
            title,
            property_code,
            address,
            city
          )
        ),
        customer_documents (
          id,
          document_type,
          document_url,
          created_at
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      toast.error("Failed to load customers");
      setCustomerList([]);
    } else {
      setCustomerList((data || []) as CustomerRow[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchCustomers();
  }, [fetchCustomers]);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return customerList;

    return customerList.filter((customer) => {
      const booking = customer.bookings?.[0];
      return (
        customer.full_name.toLowerCase().includes(query) ||
        customer.phone.toLowerCase().includes(query) ||
        customer.email?.toLowerCase().includes(query) ||
        booking?.properties?.title?.toLowerCase().includes(query)
      );
    });
  }, [customerList, search]);

  const handleView = (customer: CustomerRow) => {
    setSelectedCustomer(customer);
    setIsViewOpen(true);
  };

  const handleUpload = (customer: CustomerRow) => {
    setSelectedCustomer(customer);
    setFiles(initialFiles);
    setIsUploadOpen(true);
  };

  const handleEdit = (customer: CustomerRow) => {
    setSelectedCustomer(customer);
    toast.info("Customer edit workflow will use the same professional modal shell next.");
  };

  const validateFile = (file: File) => {
    const allowed = ["application/pdf", "image/jpeg", "image/png"];
    const maxBytes = 2 * 1024 * 1024;

    if (!allowed.includes(file.type)) {
      return "Only PDF, JPG, and PNG files are allowed";
    }

    if (file.size > maxBytes) {
      return "Each document must be 2MB or smaller";
    }

    return null;
  };

  const handleFileUpload = async (type: UploadKey, file: File) => {
    if (!selectedCustomer?.id) throw new Error("No customer selected");

    const validationError = validateFile(file);
    if (validationError) throw new Error(validationError);

    const extension = file.name.split(".").pop() || "pdf";
    const filePath = `${selectedCustomer.id}/${type}-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("customer_documents")
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: publicUrl } = supabase.storage
      .from("customer_documents")
      .getPublicUrl(filePath);

    const { data: auth } = await supabase.auth.getUser();

    const { error: metadataError } = await supabase.from("customer_documents").insert({
      customer_id: selectedCustomer.id,
      document_type: type,
      document_url: publicUrl.publicUrl,
      uploaded_by: auth.user?.id ?? null,
    });

    if (metadataError) throw metadataError;
  };

  const uploadDocuments = async () => {
    const selectedFiles = Object.entries(files).filter((entry): entry is [UploadKey, File] => Boolean(entry[1]));

    if (!selectedFiles.length) {
      toast.error("Select at least one document");
      return;
    }

    setUploading(true);

    try {
      for (const [type, file] of selectedFiles) {
        await handleFileUpload(type, file);
      }

      toast.success("Customer documents uploaded");
      setIsUploadOpen(false);
      setFiles(initialFiles);
      await fetchCustomers();
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  return (
    <MainLayout title="Customers" subtitle="Manage customer relationships, bookings, and KYC records">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search customers, phone, email, property..."
              className="pl-10"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => toast.info("Add customer modal is next in the cleanup queue.")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </div>

        <div className="stat-card overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Customer</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Booking Date</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Amount Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    Loading customers...
                  </TableCell>
                </TableRow>
              ) : filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    No customers found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => {
                  const booking = customer.bookings?.[0];
                  const documents = customer.customer_documents || [];
                  const property = booking?.properties;
                  const stageKey = booking?.stage as BookingStage;
                  const stage = stageStyles[stageKey] || defaultStage;
                  const paidAmount = Number(booking?.total_amount || 0) - Number(booking?.balance_amount || 0);

                  return (
                    <TableRow key={customer.id} className="table-row-hover">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-accent/10 text-accent">
                              {getInitials(customer.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{customer.full_name}</p>
                            <p className="text-sm text-muted-foreground">{customer.phone}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="flex items-center gap-1 font-medium">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {property?.title || "-"}
                          </p>
                          <p className="text-sm text-muted-foreground">{property?.property_code || ""}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {booking?.booking_date ? new Date(booking.booking_date).toLocaleDateString("en-IN") : "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(stage.bg, stage.text, "border-0")}>{stage.label}</Badge>
                      </TableCell>
                      <TableCell className="font-medium text-success">{formatMoney(paidAmount)}</TableCell>
                      <TableCell className={Number(booking?.balance_amount || 0) === 0 ? "text-success" : "text-warning"}>
                        {formatMoney(booking?.balance_amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {documents.length > 0 ? (
                            documents.slice(0, 2).map((doc) => (
                              <Badge key={doc.id} variant="outline" className="text-xs">
                                {documentLabels[doc.document_type as UploadKey] ?? doc.document_type}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">None</span>
                          )}
                          {documents.length > 2 ? (
                            <Badge variant="outline" className="text-xs">+{documents.length - 2}</Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <a href={`tel:${customer.phone}`} aria-label={`Call ${customer.full_name}`}>
                              <Phone className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <a href={`https://wa.me/${customer.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${customer.full_name}`}>
                              <MessageCircle className="h-4 w-4" />
                            </a>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleView(customer)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpload(customer)}>
                                <FileText className="mr-2 h-4 w-4" />
                                Upload Documents
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(customer)}>
                                <Mail className="mr-2 h-4 w-4" />
                                Edit / Follow Up
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <ProfessionalDialog
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        title="Customer Profile"
        description="Customer contact, latest booking, and document readiness."
        className="sm:max-w-[720px]"
        footer={<Button variant="outline" onClick={() => setIsViewOpen(false)}>Close</Button>}
      >
        {selectedCustomer ? <CustomerProfile customer={selectedCustomer} /> : null}
      </ProfessionalDialog>

      <ProfessionalDialog
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        title="Upload KYC Documents"
        description="Upload verified customer identity documents. PDF, JPG, and PNG up to 2MB each."
        className="sm:max-w-[620px]"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsUploadOpen(false)} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={() => void uploadDocuments()} disabled={uploading}>
              <Upload className="h-4 w-4" />
              {uploading ? "Uploading..." : "Upload Documents"}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {selectedCustomer ? (
            <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-4">
              <Avatar>
                <AvatarFallback className="bg-accent/10 text-accent">{getInitials(selectedCustomer.full_name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{selectedCustomer.full_name}</p>
                <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4">
            {(Object.keys(documentLabels) as UploadKey[]).map((key) => (
              <FileUpload
                key={key}
                label={documentLabels[key]}
                file={files[key]}
                onChange={(file) => setFiles((previous) => ({ ...previous, [key]: file }))}
              />
            ))}
          </div>
        </div>
      </ProfessionalDialog>
    </MainLayout>
  );
}

function CustomerProfile({ customer }: { customer: CustomerRow }) {
  const booking = customer.bookings?.[0];
  const property = booking?.properties;
  const stageKey = booking?.stage as BookingStage;
  const stage = stageStyles[stageKey] || defaultStage;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 rounded-xl border bg-muted/30 p-4">
        <Avatar className="h-14 w-14">
          <AvatarFallback className="bg-accent text-white text-lg">{getInitials(customer.full_name)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-lg font-semibold">{customer.full_name}</p>
          <p className="text-sm text-muted-foreground">{customer.phone}</p>
        </div>
      </div>

      <section>
        <p className="mb-3 text-sm font-semibold text-muted-foreground">Personal Information</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Info label="Email" value={customer.email} />
          <Info label="City" value={customer.city} />
          <Info label="Address" value={customer.address} />
          <Info label="Source" value={customer.source} />
        </div>
      </section>

      {booking ? (
        <section>
          <p className="mb-3 text-sm font-semibold text-muted-foreground">Latest Booking</p>
          <div className="rounded-xl border bg-muted/30 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Info label="Property" value={property?.title} />
              <Info label="Stage" value={<Badge className={cn(stage.bg, stage.text, "border-0")}>{stage.label}</Badge>} />
              <Info label="Total" value={formatMoney(booking.total_amount)} />
              <Info label="Balance" value={formatMoney(booking.balance_amount)} />
            </div>
          </div>
        </section>
      ) : null}

      <section>
        <p className="mb-3 text-sm font-semibold text-muted-foreground">Documents</p>
        <div className="flex flex-wrap gap-2">
          {(customer.customer_documents || []).length > 0 ? (
            customer.customer_documents?.map((doc) => (
              <Button key={doc.id} variant="outline" size="sm" asChild>
                <a href={doc.document_url} target="_blank" rel="noreferrer">
                  {documentLabels[doc.document_type as UploadKey] ?? doc.document_type}
                </a>
              </Button>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No KYC documents uploaded yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1 font-medium">{value || "-"}</div>
    </div>
  );
}

function FileUpload({
  label,
  file,
  onChange,
}: {
  label: string;
  file: File | null;
  onChange: (file: File) => void;
}) {
  return (
    <div className="space-y-2 rounded-xl border p-4">
      <Label>{label}</Label>
      <Input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        onChange={(event) => {
          const nextFile = event.target.files?.[0];
          if (nextFile) onChange(nextFile);
        }}
      />
      {file ? <p className="text-sm text-success">Selected: {file.name}</p> : null}
    </div>
  );
}
