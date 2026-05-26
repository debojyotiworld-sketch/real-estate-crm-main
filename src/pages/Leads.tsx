import { useCallback, useState, useEffect, type ChangeEvent } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  Plus,
  Phone,
  MessageCircle,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import Properties from "./Properties";
import { Label } from "@/components/ui/label";
import { max } from "date-fns";
import { toast } from "@/components/ui/sonner";
import { useEmployees } from "@/hooks/useEmployees";

export type Lead = {
  id: string
  lead_id: string | null
  name: string | null
  phone: string | null
  alternate_phone: string | null
  email: string | null
  source: string | null
  status: string | null
  priority: string | null
  lead_score: number | null
  budget: string | null
  message: string | null
  location: string | null
  assigned_to: string | null
  created_by: string | null
  last_contacted_at: string | null
  next_followup_at: string | null
  is_active: boolean | null
  created_at: string | null
  updated_at: string | null
  city: string | null
  assignedProperties?: LeadPropertyRow[]

  property_id?: string | null

  properties?: {
    bedrooms: number
  }

  employees?: {
    id: string
    name: string
    department: string
  } | null
}

type BudgetRange = {
  label: string;
  min: number;
  max: number;
};

type ZoneRow = {
  id: string;
  zone_name: string;
  active_locations: string[] | string | null;
};

type PropertySummary = {
  id: string;
  title: string | null;
  price: number | null;
  bedrooms: number | null;
  zone_id?: string | null;
  location?: string | null;
  status?: string | null;
};

type LeadPropertyRow = {
  id: string;
  property_id: string;
  priority: string | null;
  shortlisted: boolean | null;
  is_active: boolean | null;
  properties: PropertySummary | null;
};

type SelectedProperty = PropertySummary & {
  lp_id?: string;
  priority: string;
  shortlisted: boolean;
  is_active: boolean;
};

type LeadWithRelations = Lead & {
  lead_properties?: LeadPropertyRow[] | null;
};

type ImportedLead = {
  name?: string;
  phone?: string;
  email?: string;
  city?: string;
  source?: string;
  requirements?: string;
  message?: string;
  budget?: string;
  priority?: string;
  status?: string;
};

const getErrorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "Something went wrong";

const calculateLeadScore = (
  lead: Lead,
  assignedProperties: LeadPropertyRow[]
) => {
  let score = 0;

  if (lead.phone) score += 15;
  if (lead.email) score += 10;
  if (lead.budget) score += 15;
  if (assignedProperties?.length) {
    score += Math.min(assignedProperties.length * 10, 30);
  }

  if (assignedProperties?.some(p => p.shortlisted)) {
    score += 10;
  }

  if (lead.status === "Hot") score += 20;
  else if (lead.status === "Warm") score += 10;

  if (lead.last_contacted_at) {
    const days =
      (Date.now() - new Date(lead.last_contacted_at).getTime()) /
      (1000 * 60 * 60 * 24);

    if (days <= 7) score += 10;
  }

  return Math.min(score, 100);
};

const statusStyles: Record<string, string> = {
  New: "lead-status-new",
  Hot: "lead-status-hot",
  Warm: "lead-status-warm",
  Cold: "lead-status-cold",
  Converted: "lead-status-converted",
};

const budgetOptions: BudgetRange[] = [
  { label: "Any Price", min: 0, max: Infinity },
  { label: "Under ₹50Lakhs", min: 0, max: 5000000 },
  { label: "₹50Lakhs - ₹1Cr", min: 5000000, max: 10000000 },
  { label: "₹1Cr - ₹10Cr", min: 10000000, max: 100000000 },
  { label: "₹10Cr+", min: 100000000, max: Infinity },
];

const statusOptions = [
  "New",
  "Hot",
  "Warm",
  "Cold",
  "Converted"
];

const priorityOptions = [
  "High",
  "Medium",
  "Low"
];

const sourceOptions = [
  { label: "All Sources", value: "all" },
  { label: "Manual", value: "Manual" },
  { label: "Facebook", value: "Facebook" },
  { label: "Google Ads", value: "Google Ads" },
  { label: "Whatsapp", value: "Whatsapp" },
  { label: "Instagram", value: "Instagram" },
  { label: "Referral", value: "Referral" },
  { label: "Website", value: "Website" },
  { label: "Website Enquiry Form", value: "Website Enquiry Form" },
  { label: "Property Portal", value: "Property Portal" }
];

const Leads = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openAddLead, setOpenAddLead] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const leadsPerPage = 7;
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [openEditLead, setOpenEditLead] = useState(false);
  const [zones, setZones] = useState<ZoneRow[]>([]);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedBhk, setSelectedBhk] = useState<number | null>(null);
  const [locations, setLocations] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [leadHistory, setLeadHistory] = useState<LeadPropertyRow[]>([]);
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [selectedBudgetRange, setSelectedBudgetRange] = useState<BudgetRange | null>(null);
  const [filteredProperties, setFilteredProperties] = useState<PropertySummary[]>([]);
  const [newLead, setNewLead] = useState({
    lead_id: null as string | null,
    name: "",
    phone: "",
    email: "",
    city: "",
    source: "",
    message: "",
    priority: "Medium",
    status: "New",
    assigned_to: "",
    next_followup_at: "",
    budget: null as string | null,
    bhk: null as number | null
  });

  const generateLeadId = () => {
    const year = new Date().getFullYear().toString().slice(-2);

    // random 4 digit (1000–9999)
    const random = Math.floor(1000 + Math.random() * 9000);

    // add timestamp fragment to reduce collision
    const timePart = Date.now().toString().slice(-2);

    return `LEAD-${year}-${random}${timePart}`;
  };

  const [selectedProperties, setSelectedProperties] = useState<SelectedProperty[]>([])
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone?.includes(searchQuery);

    const matchesStatus =
      selectedStatus === "all" ||
      lead.status?.toLowerCase() === selectedStatus.toLowerCase();

    const matchesSource =
      selectedSource === "all" || lead.source === selectedSource;

    return matchesSearch && matchesStatus && matchesSource;
  });

  const indexOfLastLead = currentPage * leadsPerPage;
  const indexOfFirstLead = indexOfLastLead - leadsPerPage;

  const currentLeads = filteredLeads.slice(
    indexOfFirstLead,
    indexOfLastLead
  );

  const totalPages = Math.ceil(filteredLeads.length / leadsPerPage);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNewLead({
      ...newLead,
      [e.target.name]: e.target.value
    });
  };

  const handleAddLead = async () => {
    const leadId = generateLeadId();

    const { data, error } = await supabase
      .from("leads")
      .insert([{
        lead_id: leadId,
        name: newLead.name,
        phone: newLead.phone,
        email: newLead.email,
        city: newLead.city,
        source: newLead.source,
        message: newLead.message,
        budget: newLead.budget,
        priority: newLead.priority,
        status: newLead.status,
      }])
      .select()
      .single();

    if (error) {
      console.error(error);
      toast.error(error.message);
      return;
    }

    if (selectedProperties.length > 0) {
      const inserts = selectedProperties.map(p => ({
        lead_id: data.id,
        property_id: p.id,
        priority: p.priority,
        shortlisted: p.shortlisted
      }));

      await supabase.from("lead_properties").insert(inserts);
    }

    const newLeadFormatted: Lead = {
      id: data.id,
      lead_id: data.lead_id ?? null,
      name: data.name ?? null,
      phone: data.phone ?? null,
      alternate_phone: data.alternate_phone ?? null,
      email: data.email ?? null,
      source: data.source ?? null,
      status: data.status ?? null,
      priority: data.priority ?? null,
      lead_score: data.lead_score ?? 0,
      budget: data.budget ?? null,
      message: data.message ?? null,
      location: data.location ?? null,
      assigned_to: data.assigned_to ?? null,
      created_by: data.created_by ?? null,
      last_contacted_at: data.last_contacted_at ?? null,
      next_followup_at: data.next_followup_at ?? null,
      is_active: data.is_active ?? true,
      created_at: data.created_at ?? null,
      updated_at: data.updated_at ?? null,
      city: data.city ?? null,
      assignedProperties: [],
    };

    setLeads(prev => [newLeadFormatted, ...prev]);
    setSelectedProperties([]);
    toast.success("Lead added");
    setOpenAddLead(false);
  };

  const addProperty = (property: PropertySummary) => {
    setSelectedProperties(prev => {
      if (prev.some(p => p.id === property.id)) return prev;

      return [
        ...prev,
        {
          ...property,
          priority: "medium",
          shortlisted: false,
          is_active: true,
        }
      ];
    });
  };

  const handleUpdateLead = async () => {
    if (!editLead) return;

    try {
      const payload = {
        name: editLead.name ?? null,
        phone: editLead.phone ?? null,
        email: editLead.email ?? null,
        city: editLead.city ?? null,
        source: editLead.source ?? null,
        message: editLead.message ?? null,
        budget: selectedBudgetRange?.label ?? null,
        priority: editLead.priority ?? "Medium",
        status: editLead.status ?? "New",

        assigned_to: editLead.assigned_to || null,

        next_followup_at: editLead.next_followup_at
          ? new Date(editLead.next_followup_at).toISOString()
          : null,

        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("leads")
        .update(payload)
        .eq("id", editLead.id);

      if (error) {
        console.error("UPDATE ERROR:", error);
        toast.error(error.message);
        return;
      }

      if (payload.status?.toLowerCase().trim() === "converted") {
        if (!editLead.phone) {
          toast.error("Phone required for customer");
          return;
        }

        const { data: existingCustomer } = await supabase
          .from("customers")
          .select("id")
          .eq("phone", editLead.phone)
          .maybeSingle();

        if (!existingCustomer) {
          const { error: custError } = await supabase
            .from("customers")
            .insert([
              {
                full_name: editLead.name,
                phone: editLead.phone,
                email: editLead.email,
                source: editLead.source,
                lead_id: editLead.id,
                assigned_employee_id: editLead.assigned_to,
              },
            ]);

          if (custError) {
            console.error("CUSTOMER ERROR:", custError);
            toast.error(custError.message);
            return;
          }

          console.log("Customer created");
        } else {
          console.log("Customer already exists");
        }
      }

      await syncLeadProperties(editLead.id);

      setLeads(prev =>
        prev.map(l =>
          l.id === editLead.id ? { ...l, ...payload } : l
        )
      );

      toast.success("Lead updated");
      setOpenEditLead(false);
      setEditLead(null);

    } catch (err: unknown) {
      console.error(err);
      toast.error(getErrorMessage(err));
    }
  };

  const syncLeadProperties = async (leadId: string) => {
    try {
      const { data: existing, error } = await supabase
        .from("lead_properties")
        .select("id, property_id")
        .eq("lead_id", leadId);

      if (error) throw error;

      const existingIds = existing.map(e => e.property_id);

      // 🔹 UI properties
      const newIds = selectedProperties.map(p => p.id);

      // 🟢 INSERT new
      const toInsert = selectedProperties.filter(
        p => !existingIds.includes(p.id)
      );

      if (toInsert.length > 0) {
        const inserts = toInsert.map(p => ({
          lead_id: leadId,
          property_id: p.id,
          priority: p.priority,
          shortlisted: p.shortlisted,
        }));

        const { error: insertError } = await supabase
          .from("lead_properties")
          .insert(inserts);

        if (insertError) throw insertError;
      }

      // 🔴 REMOVE (soft delete)
      const toRemove = existing.filter(
        e => !newIds.includes(e.property_id)
      );

      for (const item of toRemove) {
        await supabase
          .from("lead_properties")
          .update({
            is_active: false,
            removed_at: new Date().toISOString(),
          })
          .eq("id", item.id);
      }

      // 🟡 UPDATE priority + shortlist
      for (const p of selectedProperties) {
        await supabase
          .from("lead_properties")
          .update({
            priority: p.priority,
            shortlisted: p.shortlisted,
          })
          .eq("lead_id", leadId)
          .eq("property_id", p.id);
      }

    } catch (err) {
      console.error("PROPERTY SYNC ERROR:", err);
    }
  };

  const handleDeleteLead = async (id: string) => {
    const { error } = await supabase
      .from("leads")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("DELETE ERROR:", error);
      toast.error(error.message);
      return;
    }

    setLeads(prev => prev.filter(l => l.id !== id));
    toast.success("Lead archived");
  };

  const fetchLeads = useCallback(async () => {
    const { data, error } = await supabase
      .from("leads")
      .select(`
      *,
      lead_properties (
        id,
        property_id,
        priority,
        shortlisted,
        is_active,
        properties (
          id,
          title,
          price,
          bedrooms
        )
      )
    `)
      .eq("is_active", true);

    if (error) {
      console.error(error);
      return;
    }

    const final = ((data || []) as LeadWithRelations[]).map((lead) => ({
      ...lead,
      assignedProperties: lead.lead_properties || [],
      lead_score: calculateLeadScore(
        lead,
        lead.lead_properties || []
      ),
    }));

    setLeads(final);
  }, []);

  const toggleUpdateProperty = async (lp_id: string) => {
    if (!lp_id) return;

    const { data, error } = await supabase
      .from("lead_properties")
      .select("id, is_active")
      .eq("id", lp_id)
      .single();

    if (error || !data) {
      console.error(error);
      return;
    }

    const newStatus = !data.is_active;

    const { error: updateError } = await supabase
      .from("lead_properties")
      .update({
        is_active: newStatus,
        removed_at: newStatus ? null : new Date().toISOString(),
      })
      .eq("id", lp_id);

    if (updateError) {
      console.error(updateError);
      return;
    }

    setSelectedProperties(prev =>
      prev.map(p =>
        p.lp_id === lp_id
          ? { ...p, is_active: newStatus }
          : p
      )
    );

    await fetchLeads();
  };

  const fetchFilteredProperties = useCallback(async () => {
    let query = supabase
      .from("properties")
      .select("id, title, price, bedrooms, zone_id, location, status")
      .eq("status", "available");

    if (selectedZone) {
      query = query.eq("zone_id", selectedZone);
    }

    if (selectedLocation) {
      query = query.eq("location", selectedLocation);
    }

    if (selectedBhk) {
      query = query.eq("bedrooms", selectedBhk);
    }

    if (selectedBudgetRange) {
      query = query
        .gte("price", selectedBudgetRange.min)
        .lte("price", selectedBudgetRange.max);
    }

    const { data, error } = await query;

    if (error) {
      console.error(error);
    } else {
      setFilteredProperties((data || []) as PropertySummary[]);
    }
  }, [selectedBhk, selectedBudgetRange, selectedLocation, selectedZone]);

  const fetchLeadAssignedProperties = async (leadId: string) => {
    const { data, error } = await supabase
      .from("lead_properties")
      .select("id, property_id, priority, shortlisted, properties(id, title, price, bedrooms)")
      .eq("lead_id", leadId)
      .eq("is_active", true);

    if (error) {
      console.error("Error fetching lead properties:", error);
      setSelectedProperties([]);
      return;
    }

    setSelectedProperties(
      ((data ?? []) as LeadPropertyRow[]).map((item) => ({
        id: item.property_id,
        lp_id: item.id,
        title: item.properties?.title,
        price: item.properties?.price,
        is_active: item.is_active ?? true,
        bedrooms: item.properties?.bedrooms,
        priority: item.priority,
        shortlisted: item.shortlisted
      }))
    );
  };

  const fetchLeadHistory = async (leadId: string) => {
    const { data, error } = await supabase
      .from("lead_properties")
      .select(`
      id,
      property_id,
      priority,
      shortlisted,
      is_active,
      properties (
        id,
        title,
        price,
        bedrooms
      )
    `)
      .eq("lead_id", leadId)
      .eq("is_active", false); // 🔥 ONLY HISTORY

    if (error) {
      console.error(error);
      return;
    }

    setLeadHistory((data || []) as LeadPropertyRow[]);
  };

  const openEditLeadModal = async (lead: Lead) => {
    // clone to avoid mutation bugs
    setEditLead({
      ...lead,
      budget: lead.budget || null
    });

    // budget mapping
    const matchedBudget =
      budgetOptions.find((b) => b.label === lead.budget) || null;

    setSelectedBudgetRange(matchedBudget);

    setSelectedBhk(null);
    setSelectedZone(null);

    await fetchLeadAssignedProperties(lead.id);

    setOpenEditLead(true);
  };

  const handleImportCSV = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const rows = text.split("\n").map(r => r.split(","));

    const headers = rows[0].map(h => h.trim());
    const leadsToInsert = rows.slice(1)
      .map(row => {
        const obj: ImportedLead = {};

        headers.forEach((header, i) => {
          obj[header] = row[i]?.replace(/"/g, "").trim();
        });

        return {
          lead_id: generateLeadId() || null,
          name: obj.name || null,
          phone: obj.phone || null,
          email: obj.email || null,
          city: obj.city || null,
          source: obj.source || null,
          message: obj.message || obj.requirements || null,
          budget: obj.budget || null,
          priority: obj.priority || "Medium",
          status: obj.status || "New",
        };
      });

    const { data, error } = await supabase
      .from("leads")
      .insert(leadsToInsert)
      .select();

    if (error) {
      console.error("CSV Import Error:", error);
      return;
    }

    setLeads(prev => [
      ...prev,
      ...(data ?? []).map((l): Lead => ({
        id: l.id,
        lead_id: l.lead_id ?? null,
        name: l.name ?? null,
        phone: l.phone ?? null,
        alternate_phone: l.alternate_phone ?? null,
        email: l.email ?? null,
        source: l.source ?? null,
        status: l.status ?? null,
        priority: l.priority ?? null,
        lead_score: l.lead_score ?? null,
        budget: l.budget ?? null,
        message: l.message ?? null,
        location: l.location ?? null,
        assigned_to: l.assigned_to ?? null,
        created_by: l.created_by ?? null,
        last_contacted_at: l.last_contacted_at ?? null,
        next_followup_at: l.next_followup_at ?? null,
        is_active: l.is_active ?? null,
        created_at: l.created_at ?? null,
        updated_at: l.updated_at ?? null,
        city: l.city ?? null,
        property_id: null,
        properties: undefined,
        employees: null
      }))
    ]);
  };

  const exportCSV = (data: Lead[], fileName: string) => {
    if (!data.length) return;

    const headers = Object.keys(data[0]) as (keyof Lead)[];

    const escapeCSV = (value: unknown) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [
      headers.join(","),
      ...data.map(row =>
        headers.map(field => escapeCSV(row[field])).join(",")
      )
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.csv`;
    link.click();
  };

/*   useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStatus, selectedSource]); */

  useEffect(() => {
    setCurrentPage(1);
    fetchFilteredProperties();
  }, [fetchFilteredProperties, searchQuery, selectedStatus, selectedSource]);

  useEffect(() => {

    const fetchZones = async () => {
      const { data, error } = await supabase
        .from("zones")
        .select("id, zone_name, active_locations")
        .eq("status", "active");

      if (!error) setZones(data || []);
    };

    fetchLeads();
    fetchZones();
  }, [fetchLeads]);

  useEffect(() => {
    if (!selectedZone) {
      setLocations([]);
      setSelectedLocation(null);
      return;
    }

    const zone = zones.find(z => z.id === selectedZone);

    if (zone?.active_locations) {
      if (Array.isArray(zone.active_locations)) {
        setLocations(zone.active_locations);
      } else {
        setLocations(zone.active_locations.split(","));
      }
    }
  }, [selectedZone, zones]);

  const [openCallDialog, setOpenCallDialog] = useState(false);
  const [selectedLeadForCall, setSelectedLeadForCall] = useState<Lead | null>(null);

  const handleSaveCallLog = async () => {
    if (!selectedLeadForCall) {
      toast.error("Select a lead before saving a call log");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      toast.error("Please sign in before adding a call log");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user?.id)
      .single();

    if (profileError || !profile?.id) {
      console.error(profileError);
      toast.error("Could not find your employee profile");
      return;
    }

    const { error } = await supabase.from("call_logs").insert([
      {
        employee_id: profile.id,
        lead_id: selectedLeadForCall.id,

        call_type: callForm.call_type,
        call_status: callForm.call_status,
        duration_seconds: callForm.duration_seconds,
        note: callForm.note,
      },
    ]);

    if (error) {
      console.error(error);
      toast.error(error.message);
      return;
    }

    await supabase
      .from("leads")
      .update({
        last_contacted_at: new Date().toISOString(),
      })
      .eq("id", selectedLeadForCall.id);

    toast.success("Call log saved");
    setCallForm({
      call_type: "outgoing",
      call_status: "completed",
      duration_seconds: 0,
      note: "",
    });
    setOpenCallDialog(false);
  };
  const [callForm, setCallForm] = useState({
    call_type: "outgoing",
    call_status: "completed",
    duration_seconds: 0,
    note: "",
  });

  return (
    <MainLayout
      title="Lead Management"
      subtitle="Track and manage all your leads"
    >
      <div className="space-y-6">
        {/* Filters and Actions */}
        <div className="flex flex-col gap-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Hot">Hot</SelectItem>
                  <SelectItem value="Warm">Warm</SelectItem>
                  <SelectItem value="Cold">Cold</SelectItem>
                  <SelectItem value="Converted">Converted</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={selectedSource}
                onValueChange={setSelectedSource}
              >
                <SelectTrigger className="w-full sm:w-[130px]">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>

                <SelectContent>
                  {sourceOptions.map((src) => (
                    <SelectItem key={src.value} value={src.value}>
                      {src.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" className="flex-shrink-0">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap justify-end">
            <input
              type="file"
              accept=".csv"
              id="csvUpload"
              className="hidden"
              onChange={handleImportCSV}
            />

            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => document.getElementById("csvUpload")?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Import</span>
            </Button>
            <Button variant="outline" size="sm" className="h-9" onClick={() => exportCSV(leads, "crm_leads")}>
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button
              className="bg-accent hover:bg-accent/90 text-accent-foreground h-9"
              onClick={() => setOpenAddLead(true)}
            >
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Add Lead</span>
            </Button>
          </div>
        </div>

        {/* Leads Table */}
        <div className="stat-card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Lead ID</TableHead>
                  <TableHead className="w-[200px]">Lead</TableHead>
                  <TableHead>Property Interest</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentLeads.map((lead) => (
                  <TableRow key={lead.id} className="table-row-hover">
                    <TableCell>
                      <p className="font-medium truncate">{lead.lead_id}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-accent/10 text-accent text-sm">
                            {((lead.name || "")
                              .split(" ")
                              .map((n) => n[0])
                              .join(""))}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{lead.name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {lead.phone}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">

                        {lead.assignedProperties?.length > 0 ? (
                          <>
                            {lead.assignedProperties
                              ?.filter(p => p.is_active === true)
                              .slice(0, 2)
                              .map((item) => {
                                const property = item.properties;

                                return (
                                  <Badge key={property?.id}>
                                    {property?.bedrooms}BHK · ₹{property?.price}
                                  </Badge>
                                );
                              })}

                            {lead.assignedProperties.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{lead.assignedProperties.length - 2} more
                              </Badge>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            No properties
                          </span>
                        )}

                      </div>
                      <p className="text-xs text-muted-foreground">
                        {lead.last_contacted_at
                          ? `Last contacted: ${new Date(lead.last_contacted_at).toLocaleDateString()
                          }`
                          : "Not contacted yet"}
                      </p>
                    </TableCell>
                    <TableCell className="font-medium">{lead.budget}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-secondary">
                        {lead.source}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("capitalize", statusStyles[lead.status || "New"])}
                      >
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              lead.lead_score >= 80
                                ? "bg-success"
                                : lead.lead_score >= 50
                                  ? "bg-warning"
                                  : "bg-destructive"
                            )}
                            style={{ width: `${lead.lead_score}% ` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{lead.lead_score}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8"
                          onClick={() => {
                            setSelectedLeadForCall(lead);

                            setCallForm({
                              call_type: "outgoing",
                              call_status: "completed",
                              duration_seconds: 0,
                              note: "",
                            });

                            setOpenCallDialog(true);
                          }}
                        >
                          <Phone className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8"
                          onClick={() => {
                            if (!lead.phone) return;

                            const phone = lead.phone.replace(/\D/g, "");
                            const whatsappUrl = `https://wa.me/${phone}`;

                            window.open(whatsappUrl, "_blank");
                          }}>
                          <MessageCircle className="w-4 h-4" />
                        </Button >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-8 h-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedLead(lead);
                                setOpenViewDialog(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                openEditLeadModal(lead);
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Lead
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteLead(lead.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div >
                    </TableCell >
                  </TableRow >
                ))}
              </TableBody >
            </Table >
          </div >
        </div >

        <div className="flex items-center justify-between mt-4">

          {/* Info */}
          <p className="text-sm text-muted-foreground">
            Showing {indexOfFirstLead + 1}–
            {Math.min(indexOfLastLead, filteredLeads.length)} of{" "}
            {filteredLeads.length} leads
          </p>

          {/* Controls */}
          <div className="flex items-center gap-2">

            {/* Prev */}
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              Prev
            </Button>

            {/* Page Numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                size="sm"
                variant={currentPage === page ? "default" : "outline"}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}

            {/* Next */}
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Next
            </Button>

          </div>
        </div>
      </div >

      <Dialog open={openViewDialog} onOpenChange={setOpenViewDialog}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">

          {selectedLead && (
            <>
              {/* 🔷 HEADER */}
              <div className="bg-gradient-to-r from-accent/20 to-accent/5 p-6 flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="text-lg bg-accent text-accent-foreground">
                    {(selectedLead.name || "U")
                      .split(" ")
                      .map(n => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <h2 className="text-xl font-semibold">
                    {selectedLead.name || "Unnamed Lead"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedLead.phone || "No phone"}
                  </p>

                  <div className="flex gap-2 mt-2 flex-wrap">
                    <Badge className="capitalize">
                      {selectedLead.status}
                    </Badge>

                    <Badge variant="outline">
                      {selectedLead.source}
                    </Badge>

                    <Badge variant="secondary">
                      {selectedLead.priority}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* 🔷 BODY */}
              <div className="p-6 space-y-6">

                {/* 🧾 BASIC INFO */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                    Basic Information
                  </h3>

                  <div className="grid grid-cols-2 gap-4 text-sm">

                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium">
                        {selectedLead.email || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground">City</p>
                      <p className="font-medium">
                        {selectedLead.city || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground">Budget</p>
                      <p className="font-medium">
                        {selectedLead.budget || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground">Assigned To</p>
                      <p className="font-medium">
                        {selectedLead.employees?.name || "Unassigned"}
                      </p>
                    </div>

                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                    Property Interest
                  </h3>

                  {selectedLead.assignedProperties?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">

                      {selectedLead.assignedProperties
                        ?.filter(p => p.is_active === true)
                        .map((item) => {
                          const property = item.properties;

                          return (
                            <div
                              key={property?.id}
                              className={cn(
                                "px-3 py-2 rounded-lg text-xs border flex flex-col gap-1 min-w-[120px]",
                                item.shortlisted
                                  ? "bg-green-50 border-green-200"
                                  : "bg-muted/40"
                              )}
                            >
                              <p className="font-medium truncate">
                                {property?.title}
                              </p>

                              <div className="flex justify-between text-muted-foreground">
                                <span>{property?.bedrooms} BHK</span>
                                <span>₹{property?.price}</span>
                              </div>

                              {item.shortlisted && (
                                <span className="text-[10px] text-green-600 font-medium">
                                  ★ Shortlisted
                                </span>
                              )}
                            </div>
                          );
                        })}

                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No properties assigned
                    </p>
                  )}
                </div>

                {/* 🏠 REQUIREMENTS */}
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
                    Requirements
                  </h3>

                  <div className="bg-muted/40 p-3 rounded-lg text-sm">
                    {selectedLead.message || "No messages provided"}
                  </div>
                </div>

                {/* 📊 LEAD SCORE */}
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
                    Lead Score
                  </h3>

                  <div className="flex items-center justify-between">

                    <span className="text-sm text-muted-foreground">
                      Lead Score
                    </span>

                    <div className="flex items-center gap-2">

                      <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            selectedLead.lead_score >= 80
                              ? "bg-green-500"
                              : selectedLead.lead_score >= 50
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          )}
                          style={{ width: `${selectedLead.lead_score || 0}%` }}
                        />
                      </div>

                      <span className="text-xs font-medium">
                        {selectedLead.lead_score || 0}
                      </span>

                    </div>
                  </div>
                </div>

                {/* 📅 META */}
                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">

                  <div>
                    Created:
                    <span className="ml-1 font-medium text-foreground">
                      {selectedLead.created_at
                        ? new Date(selectedLead.created_at).toLocaleDateString()
                        : "—"}
                    </span>
                  </div>

                  <div>
                    Last Contact:
                    <span className="ml-1 font-medium text-foreground">
                      {selectedLead.last_contacted_at
                        ? new Date(selectedLead.last_contacted_at).toLocaleDateString()
                        : "—"}
                    </span>
                  </div>

                </div>

              </div>

              {/* FOOTER */}
              <DialogFooter className="px-6 pb-4">
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (!selectedLead) return;
                    await fetchLeadHistory(selectedLead.id);
                    setOpenHistoryDialog(true);
                  }}
                >
                  <History className="w-4 h-4 mr-2" />
                  Lead History
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={openAddLead} onOpenChange={setOpenAddLead}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4">

            <Input
              placeholder="Lead Name"
              name="name"
              value={newLead.name}
              onChange={handleChange}
            />

            <Input
              placeholder="Phone"
              name="phone"
              value={newLead.phone}
              onChange={handleChange}
            />

            <Input
              placeholder="Email"
              name="email"
              value={newLead.email}
              onChange={handleChange}
            />

            <Input
              placeholder="City"
              name="city"
              value={newLead.city}
              onChange={handleChange}
            />

            {/* Budget */}
            <Select
              value={newLead.budget || ""}
              onValueChange={(value) =>
                setNewLead(prev => ({
                  ...prev,
                  budget: value
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Budget" />
              </SelectTrigger>

              <SelectContent>
                {budgetOptions.map((b) => (
                  <SelectItem key={b.label} value={b.label}>
                    {b.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={newLead.source}
              onValueChange={(value) =>
                setNewLead(prev => ({ ...prev, source: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Source" />
              </SelectTrigger>

              <SelectContent>
                {sourceOptions.map((src) => (
                  <SelectItem key={src.value} value={src.value}>
                    {src.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Priority */}
            <Select
              value={newLead.priority}
              onValueChange={(value) =>
                setNewLead(prev => ({ ...prev, priority: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Lead Priority" />
              </SelectTrigger>

              <SelectContent>
                {priorityOptions.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={newLead.bhk ? String(newLead.bhk) : ""}
              onValueChange={(value) =>
                setNewLead(prev => ({
                  ...prev,
                  bhk: Number(value)
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select BHK" />
              </SelectTrigger>

              <SelectContent>
                {[1, 2, 3, 4, 5].map((b) => (
                  <SelectItem key={b} value={String(b)}>
                    {b} BHK
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              name="next_followup_at"
              value={newLead.next_followup_at}
              onChange={handleChange}
            />

            <Textarea
              placeholder="Property Interest / Requirements"
              name="message"
              value={newLead.message}
              onChange={handleChange}
            />

          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenAddLead(false)}>
              Cancel
            </Button>

            <Button onClick={handleAddLead}>
              Add Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openEditLead} onOpenChange={setOpenEditLead}>
        <DialogContent className="max-w-xl h-[90vh] flex flex-col overflow-hidden rounded-2xl shadow-2xl">
          <DialogHeader className="shrink-0 border-b pb-3 px-4 bg-gradient-to-r from-gray-50 to-white">
            <DialogTitle className="text-lg font-semibold tracking-tight">Edit Lead</DialogTitle>
          </DialogHeader>

          {editLead && (
            <div className="flex-1 overflow-y-auto pl-4 pr-1 py-4 space-y-5">

              {/* Name */}
              <Input
                className="h-10 rounded-lg border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Name"
                value={editLead.name || ""}
                onChange={(e) =>
                  setEditLead(prev => prev && { ...prev, name: e.target.value })
                }
              />

              {/* Phone */}
              <Input
                className="h-10 rounded-lg border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Phone"
                value={editLead.phone || ""}
                onChange={(e) =>
                  setEditLead(prev => prev && { ...prev, phone: e.target.value })
                }
              />

              {/* Email */}
              <Input
                className="h-10 rounded-lg border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Email"
                value={editLead.email || ""}
                onChange={(e) =>
                  setEditLead(prev => prev && { ...prev, email: e.target.value })
                }
              />

              {/* City */}
              <Input
                className="h-10 rounded-lg border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="City"
                value={editLead.city || ""}
                onChange={(e) =>
                  setEditLead(prev => prev && { ...prev, city: e.target.value })
                }
              />

              <div className="grid grid-cols-2 gap-3">

                {/* Zone */}
                <Select
                  value={selectedZone || ""}
                  onValueChange={setSelectedZone}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Zone" />
                  </SelectTrigger>

                  <SelectContent>
                    {zones.map(zone => (
                      <SelectItem key={zone.id} value={zone.id}>
                        {zone.zone_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Location */}
                <Select
                  value={selectedLocation || ""}
                  onValueChange={setSelectedLocation}
                  disabled={!locations.length}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Location" />
                  </SelectTrigger>

                  <SelectContent>
                    {locations.map(loc => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* BHK */}
                <Select
                  value={selectedBhk ? String(selectedBhk) : ""}
                  onValueChange={(val) => setSelectedBhk(Number(val))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="BHK" />
                  </SelectTrigger>

                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(b => (
                      <SelectItem key={b} value={String(b)}>
                        {b} BHK
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Budget */}
                <Select
                  value={selectedBudgetRange?.label || ""}
                  onValueChange={(val) => {
                    const range = budgetOptions.find(b => b.label === val);
                    setSelectedBudgetRange(range || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Budget" />
                  </SelectTrigger>

                  <SelectContent>
                    {budgetOptions.map(b => (
                      <SelectItem key={b.label} value={b.label}>
                        {b.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

              </div>

              {/* Source */}
              <Select
                value={editLead.source || ""}
                onValueChange={(value) =>
                  setEditLead(prev => prev && { ...prev, source: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Source" />
                </SelectTrigger>

                <SelectContent>
                  {sourceOptions.map((src) => (
                    <SelectItem key={src.value} value={src.value}>
                      {src.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status */}
              <Select
                value={editLead.status || ""}
                onValueChange={(value) =>
                  setEditLead(prev => prev && { ...prev, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>

                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Priority */}
              <Select
                value={editLead.priority || ""}
                onValueChange={(value) =>
                  setEditLead(prev => prev && { ...prev, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>

                <SelectContent>
                  {priorityOptions.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="space-y-4 border-t pt-4">

                <Label className="font-semibold">Assign Properties</Label>

                {/* Property Select */}
                <Select
                  onValueChange={(value) => {
                    const property = filteredProperties.find(p => p.id === value);
                    if (property) addProperty(property);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Property" />
                  </SelectTrigger>

                  <SelectContent>
                    {filteredProperties.length === 0 ? (
                      <SelectItem disabled value="none">
                        No property available
                      </SelectItem>
                    ) : (
                      filteredProperties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.title} - ₹{property.price}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                {/* Selected Properties */}
                <div className="space-y-2">
                  {selectedProperties
                    .filter(p => p.is_active !== false)
                    .map((property) => (
                      <div
                        key={property.id}
                        className="flex items-center justify-between border rounded-lg p-3"
                      >
                        <div className="w-full flex items-center justify-between rounded-xl border bg-white px-4 py-3 shadow-sm hover:shadow-md transition">

                          {/* LEFT */}
                          <div className="flex flex-col gap-2">
                            <p className="text-sm font-semibold text-gray-800 leading-tight">
                              {property.title}
                            </p>

                            <div className="flex items-center gap-2">

                              <Button
                                size="sm"
                                className="h-8 px-3 rounded-full text-xs"
                                variant={property.shortlisted ? "default" : "outline"}
                                onClick={() => toggleUpdateProperty(property.lp_id)}
                              >
                                Shortlist
                              </Button>

                              <Select
                                value={property.priority}
                                onValueChange={(value) =>
                                  setSelectedProperties(prev =>
                                    prev.map(p =>
                                      p.id === property.id
                                        ? { ...p, priority: value }
                                        : p
                                    )
                                  )
                                }
                              >
                                <SelectTrigger className="h-8 w-[100px] rounded-full text-xs">
                                  <SelectValue />
                                </SelectTrigger>

                                <SelectContent>
                                  <SelectItem value="high">High</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="low">Low</SelectItem>
                                </SelectContent>
                              </Select>

                            </div>
                          </div>

                          {/* RIGHT (DELETE) */}
                          <Button
                            size="icon"
                            variant="destructive"
                            className="h-8 w-8"
                            onClick={() => property.lp_id && toggleUpdateProperty(property.lp_id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>

                        </div>
                      </div>
                    ))}
                </div>

              </div>

              {/* Requirements */}
              <Textarea
                placeholder="Messages"
                value={editLead.message || ""}
                onChange={(e) =>
                  setEditLead(prev => prev && { ...prev, message: e.target.value })
                }
              />
            </div>
          )}

          <DialogFooter className="shrink-0 border-t pt-3 px-4 bg-white">
            <Button className="w-full h-11 rounded-xl text-base shadow-md hover:shadow-lg transition" onClick={handleUpdateLead}>
              Update Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openHistoryDialog} onOpenChange={setOpenHistoryDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Lead History</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto">

            {leadHistory.length > 0 ? (
              leadHistory.map((item) => {
                const property = item.properties;

                return (
                  <div
                    key={item.id}
                    className="border rounded-lg p-3 bg-muted/40 opacity-70"
                  >
                    <p className="font-medium text-sm">
                      {property?.title}
                    </p>

                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{property?.bedrooms} BHK</span>
                      <span>₹{property?.price}</span>
                    </div>

                    <div className="text-[10px] text-red-500 mt-1">
                      Archived
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center">
                No history found
              </p>
            )}

          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openCallDialog} onOpenChange={setOpenCallDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Add Call Log{" "}
              <br></br>
              {selectedLeadForCall?.lead_id} - {selectedLeadForCall?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">

            {/* CALL TYPE */}
            <div>
              <Label>Call Type</Label>
              <Select
                value={callForm.call_type}
                onValueChange={(val) =>
                  setCallForm({ ...callForm, call_type: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Call Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="incoming">Incoming</SelectItem>
                  <SelectItem value="outgoing">Outgoing</SelectItem>
                  <SelectItem value="missed">Missed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* DURATION */}
            <div>
              <Label>Call Duration (seconds)</Label>
              <Input
                type="number"
                value={callForm.duration_seconds}
                onChange={(e) =>
                  setCallForm({
                    ...callForm,
                    duration_seconds: Number(e.target.value),
                  })
                }
              />
            </div>

            {/* STATUS */}
            <div>
              <Label>Call Status</Label>
              <Select
                value={callForm.call_status}
                onValueChange={(val) =>
                  setCallForm({ ...callForm, call_status: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Call Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="no_answer">No Answer</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* NOTES */}
            <div>
              <Label>Notes</Label>
              <Textarea
                value={callForm.note}
                onChange={(e) =>
                  setCallForm({ ...callForm, note: e.target.value })
                }
              />
            </div>

          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCallDialog(false)}>
              Cancel
            </Button>

            <Button onClick={handleSaveCallLog}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout >
  );
};

export default Leads;
