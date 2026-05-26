import { MainLayout } from "@/components/layout/MainLayout";
import { MapPicker } from "@/components/hr/MapPicker";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Filter, Plus, MapPin, Bed, Bath, Eye, Grid3X3, List, Grid2X2, Trash2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import RichTextEditor from "@/components/cms/RichTextEditor";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "@/hooks/useLocation";
import { set } from "date-fns";
import imageCompression from "browser-image-compression";

type Property = Tables<"properties"> & {
  is_visible: boolean;
  property_images?: Tables<"property_images">[];
  project_group?: {
    id: string;
    group_name: string;
    group_site: string | null;
  } | null;
};

type PropertyImage = Tables<"property_images">;

type FormState = {
  title: string;
  description: string;
  price: string;
  location: string;
  bedrooms: string;
  bathrooms: string;
  square_feet: string;
  property_type: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  price_per_sqft: string;
  floor_number: string;
  total_floors: string;
  furnishing: string;
  facing: string;
  age_of_property: string;
  rera_number: string;
  has_floor_plan: boolean;
  floor_plan_url: string;
  floor_plan_file: File | null;
  emi_available: boolean;
  listing_type: "For Sale" | "For Rent";
  zone_id: string;
  negotiable: boolean;
  availability: string;
  expected_by: string;
  parking: string;
  power_backup: string;
  features: string[];
  location_adv: string[];
  amenities: string[];
  maintenance: string;
  expected_rent: string;
  booking_amount: string;
  annual_dues: string;
  status: string;
  project_group_id: string;
};

const EMPTY_STR = "";

const emptyForm: FormState = {
  title: EMPTY_STR,
  description: EMPTY_STR,
  price: EMPTY_STR,
  location: EMPTY_STR,
  bedrooms: EMPTY_STR,
  bathrooms: EMPTY_STR,
  square_feet: EMPTY_STR,
  property_type: EMPTY_STR,
  status: "pending",
  address: EMPTY_STR,
  city: EMPTY_STR,
  state: EMPTY_STR,
  country: "India",
  pincode: EMPTY_STR,
  price_per_sqft: EMPTY_STR,
  floor_number: EMPTY_STR,
  total_floors: EMPTY_STR,
  furnishing: EMPTY_STR,
  facing: EMPTY_STR,
  age_of_property: EMPTY_STR,
  rera_number: EMPTY_STR,
  listing_type: "For Sale",
  negotiable: false,
  emi_available: false,
  zone_id: EMPTY_STR,
  availability: EMPTY_STR,
  expected_by: EMPTY_STR,
  parking: EMPTY_STR,
  power_backup: EMPTY_STR,
  amenities: [],
  features: [],
  location_adv: [],
  maintenance: EMPTY_STR,
  expected_rent: EMPTY_STR,
  booking_amount: EMPTY_STR,
  annual_dues: EMPTY_STR,
  has_floor_plan: false,
  floor_plan_file: null,
  floor_plan_url: EMPTY_STR,
  project_group_id: EMPTY_STR,
};

const PROPERTY_TYPES = ["Apartment", "House", "Commercial", "Land", "New Project"] as const;

const PROPERTY_TYPE_CONFIG = {
  Apartment: {
    label: "Apartment",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  House: {
    label: "House",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  Commercial: {
    label: "Commercial",
    className: "bg-purple-100 text-purple-700 border-purple-200",
  },
  Land: {
    label: "Land",
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  "New Project": {
    label: "New Project",
    className: "bg-indigo-100 text-indigo-700 border-indigo-200 hover:text-white",
  },
} as const;

const STATUS_CONFIG = {
  available: { bg: "bg-success", text: "text-white", label: "Available" },
  pending: { bg: "bg-warning", text: "text-white", label: "Pending" },
  booked: { bg: "bg-info", text: "text-white", label: "Booked" },
  sold: { bg: "bg-destructive", text: "text-white", label: "Sold" },
};

const statusOptions = Object.entries(STATUS_CONFIG);

function formatINR(value: number | null) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return `₹ ${Number(value).toLocaleString("en-IN")}`;
}

function toNum(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function getExt(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function generatePropertyId() {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `PR${random}`;
}

const FILE_RULES = {
  image: {
    ext: new Set(["jpg", "jpeg", "png"]),
    mime: new Set(["image/jpeg", "image/png"]),
  },
  image_or_pdf: {
    ext: new Set(["jpg", "jpeg", "png", "pdf"]),
    mime: new Set(["image/jpeg", "image/png", "application/pdf"]),
  },
} as const;

function validateFile(file: File, kind: keyof typeof FILE_RULES) {
  const ext = getExt(file.name);
  const hasMime = !!file.type;

  const rules = FILE_RULES[kind];

  const mimeOk = hasMime ? rules.mime.has(file.type) : true;
  const extOk = rules.ext.has(ext);

  const ok = hasMime ? mimeOk && extOk : extOk;

  return {
    ok,
    reason: ok
      ? ""
      : `Invalid file "${file.name}". Allowed: ${[...rules.ext].join(", ")}`,
  };
}

const compressImage = async (file: File) => {
  try {
    let compressedFile = file;

    // First compression
    compressedFile = await imageCompression(file, {
      maxSizeMB: 0.3,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
      initialQuality: 0.7,
      fileType: "image/jpeg",
    });

    // If still bigger than 300KB
    while (compressedFile.size > 300 * 1024) {
      compressedFile = await imageCompression(compressedFile, {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 1400,
        useWebWorker: true,
        initialQuality: 0.5,
        fileType: "image/jpeg",
      });
    }

    return new File(
      [compressedFile],
      file.name.replace(/\.\w+$/, ".jpg"),
      {
        type: "image/jpeg",
      }
    );
  } catch (err) {
    console.error("Compression failed:", err);
    return file;
  }
};

async function uploadToBucketDirect(
  bucket: string,
  file: File,
  filePath: string
): Promise<string> {
  const cleanPath = filePath.replace(/^\/+/, "");

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(cleanPath, file, {
      contentType: file.type || undefined,
      upsert: false,
    });

  if (error) throw error;

  const { data: pub } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return pub.publicUrl;
}

const InputField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

export default function Properties() {
  /* const INDIAN_STATES = [
    "Andhra Pradesh",
    "Andaman & Nicobar Islands",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Chandigarh",
    "Goa",
    "Delhi",
    "Dadra & Nagar Haveli and Daman & Diu",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jammu & Kashmir",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Ladakh",
    "Lakshadweep",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Puducherry",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
  ]; */
  const INDIAN_STATES = [
    "West Bengal"
  ];

  const [form, setForm] = useState<FormState>(emptyForm);
  const [properties, setProperties] = useState<Property[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [userZoneId, setUserZoneId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [mapOpen, setMapOpen] = useState(false);
  const [mapProperty, setMapProperty] = useState<any>(null);
  const [projectGroups, setProjectGroups] = useState<any[]>([]);
  const [isOn, setIsOn] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleToggle = () => {
    setIsOn((prev) => !prev);
  };
  const [details, setDetails] = useState({
    open: false,
    property: null as any,
    images: [] as any[],
    loading: false,
    activeImg: 0,
  });

  const [dialog, setDialog] = useState({
    open: false,
    mode: "add" as "add" | "edit",
    editingId: null as string | null,
    editingStatus: "pending"
  });

  const [filters, setFilters] = useState({
    search: "",
    type: "all",
    status: "all",
    projectGroup: "all",
  });

  const [imagesState, setImagesState] = useState({
    existing: [] as PropertyImage[],
    removed: new Set<string>(),
    existingAlt: {} as Record<string, string>,
    newFiles: [] as File[],
    newAlt: {} as Record<number, string>,
  });

  const selectedZone = useMemo(() => {
    return zones.find(z => z.id === form.zone_id);
  }, [zones, form.zone_id]);

  const { can, loading: permissionsLoading } = usePermissions();

  const { user } = useAuth();

  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true);
        const profile = async () => {
          const { data: auth, error } = await supabase
            .from("profiles")
            .select("id")
            .eq("user_id", user?.user_id)
            .maybeSingle();

          if (error) {
            console.error(error);
            return null;
          }

          return auth;
        }

        const userProfile = await profile();

        if (!userProfile) {
          console.warn("No profile found for user:", user?.id);
          return;
        }

        // employee
        const { data: employee } = await supabase
          .from("employees")
          .select("zone_id")
          .eq("user_id", user?.user_id)
          .maybeSingle();

        const zoneId = employee?.zone_id || null;
        console.log("User Zone ID:", zoneId);
        setUserZoneId(zoneId);

        if (permissionsLoading) return;

        const { data: zonesData } = await supabase
          .from("zones")
          .select("*");

        const { data: projectGroupData, error: projectGroupError } = await supabase
          .from("project_group")
          .select("*")
          .order("group_name", { ascending: true });

        if (projectGroupError) {
          console.error(projectGroupError);
        } else {
          setProjectGroups(projectGroupData || []);
        }
        setZones(zonesData || []);

        let query = supabase
          .from("properties")
          .select(`
            *,
            property_images(*),
            project_group (
              id,
              group_name,
              group_site
            )
          `)
          .order("created_at", { ascending: false });

        if (zoneId) {
          query = query.eq("zone_id", zoneId);
        }

        const { data: props } = await query;
        setProperties(props || []);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [permissionsLoading, user?.user_id]);

  useEffect(() => {
    if (userZoneId) {
      setForm(prev => ({
        ...prev,
        zone_id: userZoneId
      }));
    }
  }, [userZoneId]);

  const InfoItem = ({
    label,
    value,
  }: {
    label: string;
    value?: string | number | null;
  }) => {
    const display =
      typeof value === "number"
        ? value.toLocaleString("en-IN")
        : value || "—";

    return (
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span>{display}</span>
      </div>
    );
  };

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleZoneChange = (zoneId: string) => {
    setForm(prev => ({
      ...prev,
      zone_id: zoneId,
      location: ""
    }));
  };

  /*   const addImages = (files: File[]) => {
      setImagesState(prev => ({
        ...prev,
        newFiles: [...prev.newFiles, ...files]
      }));
    };
  */

  const toggleRemoveExisting = (id: string) => {
    setImagesState(prev => {
      const set = new Set(prev.removed);
      set.has(id) ? set.delete(id) : set.add(id);
      return { ...prev, removed: set };
    });
  };

  const validateBasics = () => {
    if (!form.title.trim()) return "Title required";
    if (!form.listing_type) return "Select category";
    if (!form.property_type) return "Select Property Type";

    if (form.property_type === "New Project") {
      if (!form.project_group_id) return "Select Project Group";
      return null;
    }

    if (mode === "add" && !form.address?.trim()) return "Fill address";
    if (!form.location) return "Insert Location";
    if (!form.city) return "Insert City";
    if (!form.pincode) return "Insert PIN Code";
    if (!form.bedrooms) return "Bedroom mandatory";
    if (!form.bathrooms) return "Bathroom field required";
    if (!form.square_feet) return "Square Feet required";
    if (mode === "add" && !form.age_of_property?.trim()) return "Property age required";
    if (!form.availability) return "Insert availability situation";
    //if (!form.rera_number) return "RERA number required";
    if (!form.facing) return "Select Facing of the Property";
    if (mode === "add" && newFiles.length === 0) return "insert Images";
    for (let i = 0; i < newFiles.length; i++) {
      const alt = (newAlt[i] ?? "").trim();
      if (!alt) return `Alternative text required for new image #${i + 1}`;
    }
    if (!form.description) return "Insert description";
    return null;
  };

  const property_location = useLocation();

  const buildPayload = (form: FormState) => {
    const selectedProjectGroup = projectGroups.find(
      (g) => g.id === form.project_group_id
    );

    return {
      title: form.title,
      description: form.description,
      location: form.location,
      property_type: form.property_type,
      bedrooms: toNum(form.bedrooms),
      bathrooms: toNum(form.bathrooms),
      square_feet: toNum(form.square_feet),
      price_per_sqft: toNum(form.price_per_sqft),
      floor_number: toNum(form.floor_number),
      total_floors: toNum(form.total_floors),
      age_of_property: toNum(form.age_of_property),
      booking_amount: toNum(form.booking_amount),
      annual_dues: toNum(form.annual_dues),
      expected_rent: toNum(form.expected_rent),
      maintenance: toNum(form.maintenance),
      address: form.address,
      city: form.city,
      state: form.state,
      country: form.country,
      pincode: form.pincode,
      furnishing: form.furnishing,
      facing: form.facing,
      parking: form.parking,
      power_backup: form.power_backup,
      availability: form.availability,
      expected_by: form.expected_by,
      amenities: form.amenities,
      features: form.features,
      location_adv: form.location_adv,
      negotiable: form.negotiable,
      emi_available: form.emi_available,
      listing_type: form.listing_type,
      rera_number: form.rera_number,
      zone_id: form.zone_id,
      is_visible: isOn,

      price:
        form.property_type === "New Project"
          ? null
          : toNum(form.price),

      // IMPORTANT
      project_group_id: form.project_group_id || null,
    };
  };

  const saveProperty = async () => {
    try {
      setLoading(true);

      const validationError = validateBasics();
      if (validationError) {
        toast.error(validationError);
        setLoading(false);
        return;
      }
      if (!form.title || !form.location) return;
      if (form.property_type !== "New Project" && !form.price) {
        toast.error("Insert Price");
        setLoading(false);
        return;
      }
      const payload = buildPayload(form);
      let savedProperty: any = null;


      if (mode === "add") {
        const { data, error } = await supabase
          .from("properties")
          .insert({
            ...payload,
            is_visible: isOn,
            property_code: generatePropertyId(),
            status: "pending",
            lat: property_location?.lat,
            long: property_location?.long,
            created_at: new Date().toLocaleDateString("en-CA", {
              timeZone: "Asia/Kolkata",
            }),
            created_by: user?.id || null,
          })
          .select()
          .single();


        if (error) throw error;
        const selectedProjectGroup = projectGroups.find(
          (g) => g.id === form.project_group_id
        );

        savedProperty = {
          ...data,
          project_group: selectedProjectGroup
            ? {
              id: selectedProjectGroup.id,
              group_name: selectedProjectGroup.group_name,
              group_site: selectedProjectGroup.group_site,
            }
            : null,
        };
        setProperties(prev => [savedProperty, ...prev]);

        toast.success("Property saved successfully.");

      } else {
        const { data, error } = await supabase
          .from("properties")
          .update({
            ...payload,
            is_visible: isOn,
            status: editingStatus,
            approved_by: user?.id || null,
            approved_at: new Date().toLocaleDateString("en-CA", {
              timeZone: "Asia/Kolkata",
            }),
            updated_by: user?.id || null,
            updated_at: new Date().toLocaleDateString("en-CA", {
              timeZone: "Asia/Kolkata",
            }),
          })
          .eq("id", dialog.editingId)
          .select()
          .single();

        if (error) throw error;
        const selectedProjectGroup = projectGroups.find(
          (g) => g.id === form.project_group_id
        );

        savedProperty = {
          ...data,
          project_group: selectedProjectGroup
            ? {
              id: selectedProjectGroup.id,
              group_name: selectedProjectGroup.group_name,
              group_site: selectedProjectGroup.group_site,
            }
            : null,
        };

        setProperties(prev =>
          prev.map(p =>
            p.id === savedProperty.id
              ? {
                ...p,
                ...savedProperty,
              }
              : p
          )
        );
        toast.success("Property updated successfully.");
      }

      const propertyId = savedProperty?.id || dialog.editingId;


      const floorPlanUrl = await uploadFloorPlanIfNeeded(propertyId);
      if (floorPlanUrl) {
        await supabase
          .from("properties")
          .update({ floor_plan: floorPlanUrl })
          .eq("id", propertyId);

        setProperties(prev =>
          prev.map(p =>
            p.id === propertyId
              ? { ...p, floor_plan: floorPlanUrl }
              : p
          )
        );
      }

      // upload images
      if (imagesState.newFiles.length) {
        const uploads = await Promise.all(
          imagesState.newFiles.map(async (originalFile, i) => {

            const file = await compressImage(originalFile);

            const path = `${propertyId}/${Date.now()}_${i}.jpg`;

            const { data, error } = await supabase.storage
              .from("property-images")
              .upload(path, file, {
                contentType: "image/jpeg",
              });

            if (error) throw error;

            const { data: pub } = supabase.storage
              .from("property-images")
              .getPublicUrl(data.path);

            return {
              property_id: propertyId,
              image_url: pub.publicUrl,
              alt_text: imagesState.newAlt[i],
            };
          })
        );

  await supabase.from("property_images").insert(uploads);

}

const { data: updatedImages } = await supabase
  .from("property_images")
  .select("*")
  .eq("property_id", propertyId);

setProperties(prev =>
  prev.map(p =>
    p.id === propertyId
      ? { ...p, property_images: updatedImages || [] }
      : p
  )
);

// delete removed
if (imagesState.removed.size > 0) {
  const removedIds = Array.from(imagesState.removed);

  await supabase
    .from("property_images")
    .delete()
    .in("id", removedIds);

  setProperties(prev =>
    prev.map(p =>
      p.id === propertyId
        ? {
          ...p,
          property_images: p.property_images?.filter(
            img => !removedIds.includes(img.id)
          )
        }
        : p
    )
  );
}

await Promise.all(
  Object.entries(imagesState.existingAlt).map(([id, alt]) =>
    supabase
      .from("property_images")
      .update({ alt_text: alt })
      .eq("id", id)
  )
);

setDialog(prev => ({ ...prev, open: false }));

    } catch (err: any) {
  console.error(err);
  toast.error(err?.message || "Something went wrong");
} finally {
  setLoading(false);
}
  };

const mapPropertyToForm = (p: any): FormState => ({
  ...emptyForm,
  ...p,

  price: String(p.price || ""),
  bedrooms: String(p.bedrooms || ""),
  bathrooms: String(p.bathrooms || ""),
  square_feet: String(p.square_feet || ""),
  price_per_sqft: String(p.price_per_sqft || ""),
  floor_number: String(p.floor_number || ""),
  total_floors: String(p.total_floors || ""),
  age_of_property: String(p.age_of_property || ""),

  booking_amount: String(p.booking_amount || ""),
  annual_dues: String(p.annual_dues || ""),
  expected_rent: String(p.expected_rent || ""),
  maintenance: String(p.maintenance || ""),

  has_floor_plan: false,
  floor_plan_file: null,
  floor_plan_url: p.floor_plan_url || "",
  project_group_id: p.project_group?.id || "",
});

const searchText = filters.search;
const setSearchText = (val: string) =>
  setFilters(prev => ({ ...prev, search: val }));

const typeFilter = filters.type;
const setTypeFilter = (val: string) =>
  setFilters(prev => ({ ...prev, type: val }));

const statusFilter = filters.status;
const setStatusFilter = (val: string) =>
  setFilters(prev => ({ ...prev, status: val }));
const projectGroupFilter = filters.projectGroup;

const setProjectGroupFilter = (val: string) =>
  setFilters(prev => ({
    ...prev,
    projectGroup: val
  }));

const filtered = properties.filter((p) => {
  const matchSearch =
    p.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
    p.location?.toLowerCase().includes(filters.search.toLowerCase());

  const matchType =
    filters.type === "all" || p.property_type === filters.type;

  const matchStatus =
    filters.status === "all" || p.status === filters.status;

  const matchProjectGroup =
    filters.projectGroup === "all" ||
    p.project_group?.id === filters.projectGroup;
  return (
    matchSearch &&
    matchType &&
    matchStatus &&
    matchProjectGroup
  );
});
const open = dialog.open;
const setOpen = (val: boolean) =>
  setDialog(prev => ({ ...prev, open: val }));

const mode = dialog.mode;

const editingStatus = dialog.editingStatus;
const setEditingStatus = (val: string) =>
  setDialog(prev => ({ ...prev, editingStatus: val }));

const existingImages = imagesState.existing;
const removeImageIds = imagesState.removed;
const existingAlt = imagesState.existingAlt;
const newFiles = imagesState.newFiles;
const newAlt = imagesState.newAlt;

const openAdd = () => {
  setIsOn(false);

  setDialog({
    open: true,
    mode: "add",
    editingId: null,
    editingStatus: "pending"
  });
  setForm(emptyForm);
};

const openEdit = (property: Property) => {
  setIsOn(!!property.is_visible);
  setDialog({
    open: true,
    mode: "edit",
    editingId: property.id,
    editingStatus: property.status || "pending"
  });

  setForm(mapPropertyToForm(property));

  setImagesState({
    existing: property.property_images || [],
    removed: new Set(),
    existingAlt: {},
    newFiles: [],
    newAlt: {}
  });
};

const openDetails = (property: Property) => {
  setDetails(prev => ({
    ...prev,
    open: true,
    property,
    images: property.property_images || []
  }));
};

const toggleArray = (field: string, value: string, checked: boolean) => {
  setForm(prev => {
    const arr = prev[field] || [];
    return {
      ...prev,
      [field]: checked
        ? [...arr, value]
        : arr.filter((v: string) => v !== value)
    };
  });
};

const calculatedPricePerSqft =
  form.price && form.square_feet
    ? Math.round(Number(form.price) / Number(form.square_feet))
    : 0;

const priceInWords = form.price ? `${form.price}` : "";

const detailsOpen = details.open;
const setDetailsOpen = (v: boolean) =>
  setDetails(p => ({ ...p, open: v }));

const selectedProperty = details.property;
const selectedImages = details.images;
const detailsLoading = details.loading;
const activeImg = details.activeImg;

const setActiveImg = (fn: any) =>
  setDetails(p => ({
    ...p,
    activeImg: typeof fn === "function" ? fn(p.activeImg) : fn
  }));

const closeDetails = () =>
  setDetails(p => ({ ...p, open: false }));

const onPickFloorPlan = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const { ok, reason } = validateFile(file, "image_or_pdf");
  if (!ok) return alert(reason);

  setForm(p => ({
    ...p,
    floor_plan_file: file,
    floor_plan_url: "",
  }));
};

const onPickFiles = (files: FileList | null) => {
  if (!files) return;

  const valid: File[] = [];

  Array.from(files).forEach(file => {
    const { ok } = validateFile(file, "image");
    if (ok) valid.push(file);
  });

  setImagesState(prev => ({
    ...prev,
    newFiles: [...prev.newFiles, ...valid]
  }));
};

const uploadFloorPlanIfNeeded = async (propertyId: string): Promise<string | null> => {
  if (!form.has_floor_plan) return null;
  if (form.floor_plan_file) {
    const v = validateFile(form.floor_plan_file, "image_or_pdf");
    if (!v.ok) throw new Error(v.reason || "Invalid floor plan file");

    const ext = getExt(form.floor_plan_file.name) || "pdf";
    const filePath = `${propertyId}/floorplan_${Date.now()}.${ext}`;
    return await uploadToBucketDirect("property-images", form.floor_plan_file, filePath);
  }

  return form.floor_plan_url?.trim() ? form.floor_plan_url.trim() : null;
};

const deleteProperty = async (id: string) => {
  try {
    await supabase.from("properties").delete().eq("id", id);

    setProperties(prev => prev.filter(p => p.id !== id));

    toast.success("Property deleted successfully.");
  } catch (err) {
    console.error(err);
  }
};

return (
  <MainLayout title="Properties" subtitle="Manage your property inventory">
    <div className="space-y-6">
      {/* Filters and Actions */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search properties..."
              className="pl-10"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {PROPERTY_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>


            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>

                {statusOptions.map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.label}
                  </SelectItem>
                ))}
              </SelectContent>

            </Select>

            <Select
              value={projectGroupFilter}
              onValueChange={setProjectGroupFilter}
            >
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Project Group" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">All Project Groups</SelectItem>

                {projectGroups.map((group) => (
                  <SelectItem
                    key={group.id}
                    value={group.id}
                  >
                    {group.group_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="flex-shrink-0">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="text-sm text-muted-foreground">
            {loading ? "Loading..." : `${filtered.length} properties`}
          </div>

          <div className="flex gap-2 flex-wrap justify-end">
            <div className="flex border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="rounded-none h-9 w-9"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="rounded-none h-9 w-9"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            <Button
              className="bg-accent hover:bg-accent/90 text-accent-foreground h-9"
              onClick={openAdd}
            >
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Add Property</span>
            </Button>
          </div>
        </div>
      </div>

      {!loading && filtered.length === 0 ? (
        <div className="border rounded-lg p-8 text-center text-muted-foreground">
          No properties found.
        </div>
      ) : null}

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((property) => {
            const statusKey = (property.status ?? "pending") as string;
            const status =
              statusOptions.find(([key]) => key === statusKey)?.[1] ??
              STATUS_CONFIG.pending;

            return (
              <Card key={property.id} className="overflow-hidden group hover:shadow-lg transition-all duration-300 flex flex-col">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={property.property_images?.[0]?.image_url
                      ?? "https://placehold.co/800x600/png?text=Property"}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  <div className="absolute top-3 right-3 flex gap-2">
                    <Button variant="secondary" size="icon" className="w-8 h-8 bg-white/90 hover:bg-white" onClick={() => openDetails(property)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <p className="text-white text-lg font-semibold">{property.price}</p>
                  </div>
                </div>

                <CardContent className="p-4 flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-foreground border-b border-border pb-2 mb-3">{property.title}</h3>

                      <div className="text-xs text-muted-foreground">
                        Code: {property.property_code}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3 text-red-500" />
                        {property.location ?? "—"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3 w-full">
                    <Badge className={cn(status.bg, status.text, "border-0")}>{status.label}</Badge>

                    <Badge
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md shrink-0",
                        PROPERTY_TYPE_CONFIG[property.property_type]?.className,
                        "transition-all duration-200"
                      )}
                    >
                      {PROPERTY_TYPE_CONFIG[property.property_type]?.label}
                    </Badge>

                    {property.property_type === "New Project" &&
                      property.project_group?.group_name && (
                        <Badge
                          className="
                              bg-orange-100
                              text-orange-700
                              border-orange-200
                              hover:text-orange-700
                            "
                        >
                          {property.project_group.group_name}
                        </Badge>
                      )}
                  </div>

                  <div className="flex items-center gap-4 py-3 border-y border-border my-3">
                    <div className="flex items-center gap-1 text-sm">
                      <Bed className="w-4 h-4 text-muted-foreground" />
                      <span>{property.bedrooms ?? "—"}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Bath className="w-4 h-4 text-muted-foreground" />
                      <span>{property.bathrooms ?? "—"}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Grid2X2 className="w-4 h-4 text-muted-foreground" />
                      <span>{property.square_feet ?? "—"}</span>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground mb-3">
                    {property.address} - {property.city}
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-2">
                    {can("edit_property") && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => openEdit(property)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!can("location_verify_property") && property.status !== "available") return;

                        setMapProperty(property);
                        setMapOpen(true);
                      }}
                      disabled={!can("location_verify_property") && property.status !== "available"}
                      className={cn(
                        "flex items-center gap-2",
                        property.status === "available"
                          ? "border-green-500 text-green-600"
                          : "border-amber-500 text-amber-600"
                      )}
                    >
                      <MapPin className="w-4 h-4" />
                      <span className="text-xs font-medium">
                        {
                          property.status === "available"
                            ? "View Location"
                            : property.lat && property.long
                              ? "Verify Site"
                              : "Pending Location"
                        }
                      </span>
                    </Button>
                    {can("delete_property") && (
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => deleteProperty(property.id)}
                        disabled={loading}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => {
            const statusKey = (p.status ?? "pending") as string;
            const status =
              statusOptions.find(([key]) => key === statusKey)?.[1] ??
              STATUS_CONFIG.pending;

            return (
              <Card key={p.id} className="overflow-hidden">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold truncate">{p.title}</div>
                      <Badge className={cn(status.bg, status.text, "border-0")}>{status.label}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {p.location ?? "—"} • {p.property_type ?? "—"}

                      {p.property_type === "New Project" &&
                        p.project_group?.group_name && (
                          <span className="ml-2 text-xs px-2 py-1 rounded bg-orange-100 text-orange-700">
                            {p.project_group.group_name}
                          </span>
                        )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="font-semibold">{formatINR(p.price)}</div>
                    {can("edit_property") && <Button onClick={() => openEdit(p)}>
                      Edit
                    </Button>}
                    <Button variant="outline" size="sm" onClick={() => openDetails(p)}>
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>

    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setForm(emptyForm);
      }}
    >
      <DialogContent className="max-w-5xl h-[90vh] p-0 flex flex-col overflow-hidden">
        <div className="shrink-0 border-b bg-background px-6 py-4">
          <DialogHeader>
            <DialogTitle>{mode === "add" ? "Add New Property" : "Edit Property"}</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            {mode === "add" ? "New listing will be Pending by default." : "Update listing details and images."}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Basic Info */}
          <div className="rounded-xl border p-4 space-y-4">
            <div className="font-semibold">Basic Info</div>


            <div className="space-y-2">
              <Label>Property Title</Label>
              <Input value={form.title} onChange={(e) => handleChange("title", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <div className="flex gap-2">
                {(["For Sale", "For Rent"] as const).map((t) => (
                  <Button
                    key={t}
                    type="button"
                    variant={form.listing_type === t ? "default" : "outline"}
                    className="rounded-full"
                    onClick={() => handleChange("listing_type", t)}
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Property Type</Label>
              <div className="flex flex-wrap gap-2">
                {PROPERTY_TYPES.map((t) => (
                  <Button
                    key={t}
                    type="button"
                    variant={form.property_type === t ? "default" : "outline"}
                    className="rounded-full"
                    onClick={() => handleChange("property_type", t)}
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </div>

            {form.property_type === "New Project" && (
              <div className="space-y-2">
                <Label>Select Project Group</Label>

                <Select
                  value={form.project_group_id}
                  onValueChange={(v) =>
                    handleChange("project_group_id", v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Project Group" />
                  </SelectTrigger>

                  <SelectContent>
                    {projectGroups.map((group) => (
                      <SelectItem
                        key={group.id}
                        value={group.id}
                      >
                        {group.group_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {mode === "edit" && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editingStatus}
                  onValueChange={(v) => setEditingStatus(v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="booked">Booked</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Location */}
          <div className="rounded-xl border p-4 space-y-4">
            <div className="font-semibold">Location</div>

            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Select Zone</Label>
                <Select
                  value={form.zone_id}
                  onValueChange={handleZoneChange}
                //disabled={!userZoneId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a zone..." />
                  </SelectTrigger>
                  <SelectContent>
                    {zones.filter(z => z.id === userZoneId || !userZoneId)
                      .map((zone) => (
                        <SelectItem key={zone.id} value={zone.id}>
                          {zone.zone_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Select Location</Label>

                <Select
                  value={form.location}
                  disabled={!form.zone_id}
                  onValueChange={(val) => handleChange("location", val)}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !form.zone_id
                          ? "Select zone first..."
                          : "Select location..."
                      }
                    />
                  </SelectTrigger>

                  <SelectContent>
                    {Array.isArray(selectedZone?.active_locations) &&
                      selectedZone.active_locations.length > 0 ? (
                      selectedZone.active_locations.map((location: string, index: number) => (
                        <SelectItem key={`LOC-${index}`} value={location}>
                          {location}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        No locations available
                      </div>
                    )}
                  </SelectContent>
                </Select>

                {zones.length === 0 && (
                  <p className="text-xs text-destructive">
                    No zones assigned to your account. Contact Admin.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => handleChange("address", e.target.value)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={form.city} onChange={(e) => handleChange("city", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>State</Label>
                <Select value={form.state} onValueChange={(v) => setForm((p) => ({ ...p, state: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your state" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {INDIAN_STATES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Zip</Label>
                <Input value={form.pincode} onChange={(e) => handleChange("pincode", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Country</Label>
                <Input value={form.country} onChange={(e) => handleChange("country", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Property Details */}
          <div className="rounded-xl border p-5 space-y-5">
            <div className="text-lg font-semibold">Property Details</div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bedrooms</Label>
                <Input value={form.bedrooms} onChange={(e) => handleChange("bedrooms", e.target.value)} />
              </div>
              <InputField
                label="Bathrooms"
                value={form.bathrooms}
                onChange={(v) => handleChange("bathrooms", v)}
              />

              <InputField
                label="Square Feet"
                value={form.square_feet}
                onChange={(v) => handleChange("square_feet", v)}
              />

              <InputField
                label="Total Floors"
                value={form.total_floors}
                onChange={(v) => handleChange("total_floors", v)}
              />

              <InputField
                label="Floor Number"
                value={form.floor_number}
                onChange={(v) => handleChange("floor_number", v)}
              />

              {/* Availability */}
              <div className="space-y-2">
                <Label>Availability</Label>
                <Select onValueChange={(v) => handleChange("availability", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ready">Ready to Move</SelectItem>
                    <SelectItem value="under_construction">Under Construction</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Expected By */}
              {form.availability === "under_construction" && (
                <div className="space-y-2">
                  <Label>Expected By</Label>
                  <Select onValueChange={(v) => handleChange("expected_by", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3m">Within 3 Months</SelectItem>
                      <SelectItem value="6m">Within 6 Months</SelectItem>
                      <SelectItem value="2026">By 2026</SelectItem>
                      <SelectItem value="2027">By 2027</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Age of Property</Label>
                <Input value={form.age_of_property} onChange={(e) => handleChange("age_of_property", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>RERA Number</Label>
                <Input value={form.rera_number} onChange={(e) => handleChange("rera_number", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Furnishing</Label>
                <Select value={form.furnishing} onValueChange={(v) => handleChange("furnishing", v)}>
                  <SelectTrigger><SelectValue placeholder="Furnishing" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="furnished">Furnished</SelectItem>
                    <SelectItem value="semi">Semi Furnished</SelectItem>
                    <SelectItem value="unfurnished">Unfurnished</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Parking</Label>
                <Select onValueChange={(v) => handleChange("parking", v)}>
                  <SelectTrigger><SelectValue placeholder="Parking" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="covered">Covered</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                  </SelectContent>
                </Select>

              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="rounded-xl border p-5 space-y-5">
            <div className="text-lg font-semibold">Pricing</div>

            <div className="grid md:grid-cols-2 gap-4">

              <Label>Price</Label>
              <Label>Price per Sq.Ft</Label>
              <Input
                type="number"
                placeholder="Total Price"
                min={0}
                max={100000000}
                value={form.price}
                onChange={(e) => {
                  const value = e.target.value;

                  if (Number(value) <= 100000000) {
                    handleChange("price", value);
                  }
                }}
              />

              <Input
                type="number"
                placeholder="Price per sq.ft (auto)"
                value={calculatedPricePerSqft}
                disabled
              />
              {priceInWords && (
                <span className="text-sm text-red-500">
                  {priceInWords}
                </span>
              )}

            </div>

            <div className="flex gap-6">
              <Checkbox checked={form.negotiable} onCheckedChange={(v) => handleChange("negotiable", !!v)} />
              <span>Negotiable</span>

              <Checkbox checked={form.emi_available} onCheckedChange={(v) => handleChange("emi_available", !!v)} />
              <span>EMI Available</span>
            </div>
          </div>

          <div className="rounded-xl border p-5 space-y-5">
            <div className="space-y-3">
              <div className="text-lg font-semibold border-b pb-2">
                Amenities & Features
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  "Lift",
                  "Security",
                  "Park",
                  "Visitor Parking",
                  "Intercom",
                  "Water Storage"
                ].map((item) => (
                  <label key={item} className="flex items-center gap-2">
                    <Checkbox
                      checked={form.amenities?.includes(item)}
                      onCheckedChange={(v) => toggleArray("amenities", item, !!v)}
                    />
                    {item}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Property Features</Label>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  "Corner Property",
                  "Pet Friendly",
                  "Vaastu Compliant",
                  "Natural Light",
                  "Airy Rooms",
                  "Spacious Interiors"
                ].map((item) => (
                  <label key={item} className="flex items-center gap-2">
                    <Checkbox
                      checked={form.features?.includes(item)}
                      onCheckedChange={(v) => toggleArray("features", item, !!v)}
                    />
                    {item}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <Label>Location Advantages</Label>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  "Metro",
                  "School",
                  "Hospital",
                  "Market",
                  "Airport",
                  "Mall"
                ].map((item) => (
                  <label key={item} className="flex items-center gap-2">
                    <Checkbox
                      checked={form.location_adv?.includes(item)}
                      onCheckedChange={(v) => toggleArray("location_adv", item, !!v)}
                    />
                    {item}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">

              <Select onValueChange={(v) => handleChange("power_backup", v)}>
                <SelectTrigger><SelectValue placeholder="Power Backup" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="full">Full</SelectItem>
                </SelectContent>
              </Select>

              <Select onValueChange={(v) => handleChange("facing", v)}>
                <SelectTrigger><SelectValue placeholder="Facing" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="north">North</SelectItem>
                  <SelectItem value="south">South</SelectItem>
                  <SelectItem value="east">East</SelectItem>
                  <SelectItem value="west">West</SelectItem>
                </SelectContent>
              </Select>

            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Label>Expected Rent</Label>
              <Label>Booking Amount</Label>
              <Input
                placeholder="Expected Rent"
                value={form.expected_rent}
                onChange={(e) => handleChange("expected_rent", e.target.value)}
              />
              <Input
                placeholder="Booking Amount"
                value={form.booking_amount}
                onChange={(e) => handleChange("booking_amount", e.target.value)}
              />
              <Label>Maintenance Cost</Label>
              <Input
                placeholder="Maintenance"
                value={form.maintenance}
                onChange={(e) => handleChange("maintenance", e.target.value)}
              />

            </div>
          </div>

          <div className="rounded-xl border p-5 space-y-5">
            <div className="font-semibold">Images and Documents</div>
            <div className="rounded-xl border p-5 space-y-5">
              <div className="space-y-2">
                <Label>Floor Plan</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={form.has_floor_plan ? "default" : "outline"}
                    className="rounded-full"
                    onClick={() => setForm((p) => ({ ...p, has_floor_plan: true }))}
                  >
                    Yes
                  </Button>

                  <Button
                    type="button"
                    variant={!form.has_floor_plan ? "default" : "outline"}
                    className="rounded-full"
                    onClick={() =>
                      setForm((p) => ({
                        ...p,
                        has_floor_plan: false,
                        floor_plan_file: null,
                        floor_plan_url: "",
                      }))
                    }
                  >
                    No
                  </Button>
                </div>
              </div>

              {form.has_floor_plan ? (
                <div className="space-y-2">
                  <Label>Upload Floor Plan (JPG/JPEG/PNG/PDF)</Label>
                  <Input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                    onChange={onPickFloorPlan}
                  />
                  {form.floor_plan_file ? (
                    <div className="text-xs text-muted-foreground">Selected: {form.floor_plan_file.name}</div>
                  ) : form.floor_plan_url ? (
                    <div className="text-xs text-muted-foreground">Existing: {form.floor_plan_url}</div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="rounded-xl border p-4 space-y-4">
              <div className="flex items-center justify-between mt-auto pt-3">
                <div className="font-semibold">Images (JPG/JPEG/PNG)</div>

                <label className="cursor-pointer">
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    onChange={(e) => onPickFiles(e.target.files)}
                  />
                  <span className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-muted">
                    + Add Images
                  </span>
                </label>
              </div>

              {mode === "edit" && existingImages.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Existing Images</div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {existingImages.map((img) => {
                      const removed = removeImageIds.has(img.id);
                      const altTextValue = existingAlt[img.id] ?? "";

                      return (
                        <div key={img.id} className="rounded-xl border p-3 space-y-3">
                          <div className={cn("relative rounded-lg overflow-hidden border", removed && "opacity-50")}>
                            <img src={img.image_url} alt={altTextValue || ""} className="h-28 w-full object-cover" />

                            <Button
                              type="button"
                              size="icon"
                              variant={removed ? "secondary" : "destructive"}
                              className="absolute top-2 right-2 h-7 w-7 rounded-full"
                              onClick={() => toggleRemoveExisting(img.id)}
                            >
                              ✕
                            </Button>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Alternative text</Label>
                            <Input
                              value={altTextValue}
                              disabled={removed}
                              onChange={(e) =>
                                setImagesState(prev => ({
                                  ...prev,
                                  existingAlt: { ...prev.existingAlt, [img.id]: e.target.value }
                                }))
                              }
                              placeholder="e.g. Front elevation view"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {newFiles.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-sm font-medium">New Images</div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {newFiles.map((f, idx) => {
                      const preview = URL.createObjectURL(f);
                      const altTextValue = newAlt[idx] ?? "";

                      return (
                        <div key={`${f.name}-${idx}`} className="rounded-xl border p-3 space-y-3">
                          <div className="relative rounded-lg overflow-hidden border">
                            <img src={preview} alt={altTextValue || ""} className="h-28 w-full object-cover" />

                            <Button
                              type="button"
                              size="icon"
                              variant="destructive"
                              className="absolute top-2 right-2 h-7 w-7 rounded-full"
                              onClick={() => {
                                setImagesState(prev => {
                                  const newFiles = prev.newFiles.filter((_, i) => i !== idx);

                                  const newAlt: Record<number, string> = {};
                                  newFiles.forEach((_, newIdx) => {
                                    const oldIdx = newIdx >= idx ? newIdx + 1 : newIdx;
                                    newAlt[newIdx] = prev.newAlt[oldIdx] ?? "";
                                  });

                                  return {
                                    ...prev,
                                    newFiles,
                                    newAlt
                                  };
                                });
                              }}
                            >
                              ✕
                            </Button>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Alternative text</Label>
                            <Input
                              value={altTextValue}
                              onChange={(e) => setImagesState(prev => ({
                                ...prev,
                                newAlt: { ...prev.newAlt, [idx]: e.target.value }
                              }))}
                              placeholder="e.g. Living room"
                              required
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Description */}
          <div className="rounded-xl border p-4 space-y-3">
            <div className="font-semibold">Description</div>
            <Label>Property Description</Label>
            <RichTextEditor
              value={form.description}
              onChange={(value) => handleChange("description", value)}
              className="min-h-[120px]"
            />
          </div>
          <Label>Is this property should show on Website?</Label>
          <div>
            <button
              onClick={handleToggle}
              className={`px-4 py-2 rounded-md text-white transition ${isOn ? "bg-green-500" : "bg-gray-500"
                }`}
            >
              {isOn ? "YES" : "NO"}
            </button>
          </div>
        </div>

        <div className="sticky bottom-0 border-t bg-background px-6 py-4 shadow">
          <div className="grid grid-cols-2 gap-3">
            <Button type="button" onClick={saveProperty} disabled={loading}>
              {loading ? "Saving..." : mode === "add" ? "Add Property" : "Update Property"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog >

    < Dialog
      open={detailsOpen}
      onOpenChange={(v) => {
        if (!v) closeDetails();
        else setDetailsOpen(true);
      }
      }
    >
      <DialogContent className="max-w-4xl h-[90vh] p-0 flex flex-col overflow-hidden">
        <div className="shrink-0 border-b bg-background px-6 py-4">
          <DialogHeader>
            <DialogTitle>Property Details</DialogTitle>
          </DialogHeader>
          {selectedProperty?.title ? (
            <div className="mt-1 text-sm text-muted-foreground">{selectedProperty.title}</div>
          ) : null}
        </div>

        <div className="flex-1 overflow-auto px-6 py-4 space-y-6">
          {detailsLoading ? (
            <div className="text-sm text-muted-foreground">Loading details...</div>
          ) : selectedProperty ? (
            <>
              {selectedImages.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-sm font-medium">Images</div>

                  <div className="relative rounded-xl border overflow-hidden bg-muted/20">
                    <img
                      src={selectedImages[activeImg]?.image_url}
                      alt={selectedImages[activeImg]?.alt_text ?? selectedProperty?.title ?? "Property image"}
                      className="w-full h-[320px] md:h-[380px] object-cover"
                      loading="lazy"
                    />

                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 hover:bg-white shadow"
                      onClick={() => setActiveImg((i) => (i - 1 + selectedImages.length) % selectedImages.length)}
                      disabled={selectedImages.length <= 1}
                    >
                      ‹
                    </Button>

                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 hover:bg-white shadow"
                      onClick={() => setActiveImg((i) => (i + 1) % selectedImages.length)}
                      disabled={selectedImages.length <= 1}
                    >
                      ›
                    </Button>

                    {selectedImages[activeImg]?.alt_text ? (
                      <div className="absolute bottom-3 left-3 rounded-full bg-background/90 px-3 py-1 text-xs">
                        {selectedImages[activeImg]?.alt_text}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {selectedImages.map((img, idx) => (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => setActiveImg(idx)}
                        className={cn(
                          "shrink-0 rounded-lg border overflow-hidden w-24 h-16",
                          idx === activeImg ? "ring-2 ring-primary" : "opacity-80 hover:opacity-100"
                        )}
                        title={img.alt_text ?? ""}
                      >
                        <img src={img.image_url} alt={img.alt_text ?? ""} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No images found.</div>
              )}

              <>
                {/* Top Summary Section */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-2xl font-semibold">
                      ₹ {selectedProperty.price?.toLocaleString() ?? "-"}
                    </span>

                    {selectedProperty.negotiable && (
                      <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
                        Negotiable
                      </span>
                    )}

                    {selectedProperty.featured && (
                      <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700">
                        Featured
                      </span>
                    )}
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {selectedProperty.bedrooms ?? "-"} BHK •{" "}
                    {selectedProperty.square_feet ?? "-"} sqft •{" "}
                    {selectedProperty.property_type ?? "-"}
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {selectedProperty.address}, {selectedProperty.city},{" "}
                    {selectedProperty.state} - {selectedProperty.pincode}
                  </div>
                </div>

                {/* Key Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                  <InfoItem label="Listing Type" value={selectedProperty.listing_type} />
                  <InfoItem label="Status" value={selectedProperty.status} />
                  <InfoItem label="Property Code" value={selectedProperty.property_code} />
                  <InfoItem label="Price / Sqft" value={selectedProperty.price_per_sqft} />
                  <InfoItem label="Floor" value={`${selectedProperty.floor_number ?? "-"} / ${selectedProperty.total_floors ?? "-"}`} />
                  <InfoItem label="Furnishing" value={selectedProperty.furnishing} />
                  <InfoItem label="Facing" value={selectedProperty.facing} />
                  <InfoItem label="Age" value={selectedProperty.age_of_property} />
                  <InfoItem label="RERA" value={selectedProperty.rera_number} />
                  <InfoItem label="Parking" value={selectedProperty.parking} />
                  <InfoItem label="Power Backup" value={selectedProperty.power_backup} />
                  <InfoItem label="Availability" value={selectedProperty.availability} />
                  <InfoItem label="Expected By" value={selectedProperty.expected_by} />
                  <InfoItem label="Maintenance" value={selectedProperty.maintenance} />
                  <InfoItem label="Expected Rent" value={selectedProperty.expected_rent} />
                  <InfoItem label="Booking Amount" value={selectedProperty.booking_amount} />
                </div>

                {/* Amenities */}
                {Array.isArray(selectedProperty.amenities) && selectedProperty.amenities?.length > 0 && (
                  <Card className="mt-6">
                    <CardContent className="p-4">
                      <div className="text-sm font-semibold mb-2">Amenities</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedProperty.amenities.map((a: string) => (
                          <span key={a} className="text-xs px-2 py-1 bg-muted rounded">
                            {a}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Features */}
                {Array.isArray(selectedProperty.features) &&
                  selectedProperty.features.length > 0 && (
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm font-semibold mb-2">Features</div>
                        <div className="flex flex-wrap gap-2">
                          {selectedProperty.features.map((f, i) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-1 bg-muted rounded"
                            >
                              {String(f)}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                {/* Location Advantages */}
                {Array.isArray(selectedProperty.location_adv) && selectedProperty.location_adv?.length > 0 && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm font-semibold mb-2">Location Advantages</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedProperty.location_adv.map((l: string) => (
                          <span key={l} className="text-xs px-2 py-1 bg-muted rounded">
                            {l}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Description */}
                {selectedProperty.description && (
                  <Card>
                    <CardContent className="p-4">
                      <div
                        className="text-sm prose max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: selectedProperty.description || "",
                        }}
                      />
                    </CardContent>
                  </Card>
                )}
              </>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">No property selected.</div>
          )}
        </div>
      </DialogContent>
    </Dialog >

    <MapPicker
      open={mapOpen}
      onClose={() => {
        setMapOpen(false);
        setMapProperty(null);
      }}
      key={mapProperty?.id ?? "map-picker"}
      readOnly={!can("location_verify_property")}

      initialLat={
        mapProperty?.lat ? Number(mapProperty.lat) : undefined
      }
      initialLng={
        mapProperty?.long ? Number(mapProperty.long) : undefined
      }

      onSelect={async (lat: number, lng: number) => {
        if (!mapProperty) return;

        setMapOpen(false);

        try {
          const { error } = await supabase
            .from("properties")
            .update({
              lat: lat.toString(),
              long: lng.toString(),
              status: "available",
              updated_at: new Date().toISOString(),
              approved_by: user?.id ?? undefined
            })
            .eq("id", mapProperty.id);

          if (error) throw error;

          toast.success("Site verified. Location updated successfully.");

          setProperties(prev =>
            prev.map(p =>
              p.id === mapProperty.id
                ? {
                  ...p,
                  lat: lat.toString(),
                  long: lng.toString(),
                  status: "available",
                }
                : p
            )
          );

          setMapOpen(false);
          setMapProperty(null);
        } catch (e: any) {
          console.error(e);
          toast.error(e?.message ?? "Failed to update location");
        }
      }}
    />
  </MainLayout >
);
}
