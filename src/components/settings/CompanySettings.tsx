import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import {
  Building2,
  FileImage,
  Image,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Upload,
} from "lucide-react";

const companySettingsSchema = z.object({
  company_name: z
    .string()
    .min(1, "Company name is required")
    .max(100, "Company name must be less than 100 characters"),
  address: z.string().max(500, "Address must be less than 500 characters").optional(),
  email: z
    .string()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters")
    .optional()
    .or(z.literal("")),
  phone: z.string().max(20, "Phone must be less than 20 characters").optional(),
});

type CompanySettingsForm = z.infer<typeof companySettingsSchema>;

type CompanySettingsRow = {
  id: string;
  company_name: string | null;
  address: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  email: string | null;
  phone: string | null;
};

type UploadField = "logo" | "favicon";

// If your generated Supabase types don't include `company_settings`, `supabase.from("company_settings")`
// becomes typed as `never` which causes TS errors. This narrows the table usage to a safe local type.
const companySettingsTable = () => supabase.from("company_settings") as any;

export function CompanySettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  const [logoUrl, setLogoUrl] = useState<string>("");
  const [faviconUrl, setFaviconUrl] = useState<string>("");

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompanySettingsForm>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: {
      company_name: "",
      address: "",
      email: "",
      phone: "",
    },
  });

  useEffect(() => {
    void fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await companySettingsTable()
        .select("*")
        .eq("id", "05303349-91cd-4651-9572-8c8a11e7e2ad")
        .single();

      if (error) throw error;
      if (!data) return;

      const settings = data as CompanySettingsRow;
      setSettingsId(settings.id);
      setLogoUrl(settings.logo_url ?? "");
      setFaviconUrl(settings.favicon_url ?? "");

      reset({
        company_name: settings.company_name ?? "",
        address: settings.address ?? "",
        email: settings.email ?? "",
        phone: settings.phone ?? "",
      });
    } catch (err) {
      console.error("Error fetching company settings:", err);
      toast.error("Failed to load company settings");
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File, field: UploadField, id: string): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("field", field);
    formData.append("settingsId", id);

    const { data, error } = await supabase.functions.invoke("upload-company-documents", {
      body: formData,
    });

    if (error) throw error;
    const url = (data as { url?: string } | null)?.url;
    if (!url) throw new Error("Upload succeeded but URL was not returned");
    return url;
  };

  const logoPreview = useMemo(() => {
    if (!selectedLogo) return logoUrl;
    return URL.createObjectURL(selectedLogo);
  }, [selectedLogo, logoUrl]);

  useEffect(() => {
    // Avoid memory leaks from createObjectURL
    if (!selectedLogo) return;
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [selectedLogo, logoPreview]);

  const validateImageFile = (file: File, maxMB: number) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return false;
    }
    if (file.size > maxMB * 1024 * 1024) {
      toast.error(`File size must be less than ${maxMB}MB`);
      return false;
    }
    return true;
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validateImageFile(file, 2)) return;

    // Store the file. It will be uploaded on Save.
    setSelectedLogo(file);
    toast.success("Logo selected. Click Save to upload.");
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validateImageFile(file, 1)) return;

    setUploadingFavicon(true);
    try {
      const id = "05303349-91cd-4651-9572-8c8a11e7e2ad";
      const url = await uploadFile(file, "favicon", id);

      setFaviconUrl(url);

      const { error } = await companySettingsTable().update({ favicon_url: url }).eq("id", id);
      if (error) throw error;

      toast.success("Favicon uploaded successfully");
    } catch (err) {
      console.error("Error uploading favicon:", err);
      toast.error("Failed to upload favicon");
    } finally {
      setUploadingFavicon(false);
    }
  };

  const onSubmit = async (form: CompanySettingsForm) => {
    setSaving(true);

    try {
      const id = "05303349-91cd-4651-9572-8c8a11e7e2ad";

      let finalLogoUrl = logoUrl;
      if (selectedLogo) {
        setUploadingLogo(true);
        try {
          finalLogoUrl = await uploadFile(selectedLogo, "logo", id);
          setLogoUrl(finalLogoUrl);
          setSelectedLogo(null);
        } finally {
          setUploadingLogo(false);
        }
      }

      const payload = {
        company_name: form.company_name,
        address: form.address || null,
        email: form.email || null,
        phone: form.phone || null,
        logo_url: finalLogoUrl || null,
      };

      const { error } = await companySettingsTable().update(payload).eq("id", id);
      if (error) throw error;

      toast.success("Company settings saved successfully");
    } catch (err: any) {
      console.error("Error saving company settings:", err);
      toast.error(err?.message || err?.error_description || "Failed to save company settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Information
            </CardTitle>
            <CardDescription>Basic information about your company</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name *</Label>
              <Input id="company_name" placeholder="Enter company name" {...register("company_name")} />
              {errors.company_name && (
                <p className="text-sm text-destructive">{errors.company_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                Phone Number
              </Label>
              <Input id="phone" placeholder="Enter phone number" {...register("phone")} />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input id="email" type="email" placeholder="Enter email address" {...register("email")} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address" className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                Address
              </Label>
              <Input id="address" placeholder="Enter company address" {...register("address")} />
              {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Branding */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Branding
            </CardTitle>
            <CardDescription>Upload your company logo and favicon</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            {/* Logo */}
            <div className="space-y-4">
              <Label className="flex items-center gap-1">
                <Image className="h-4 w-4" />
                Company Logo
              </Label>
              <div className="flex items-center gap-4">
                <div className="h-24 w-24 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden bg-muted">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Company Logo Preview" className="h-full w-full object-contain" />
                  ) : (
                    <Image className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <Label
                    htmlFor="logo-upload"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                  >
                    {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploadingLogo ? "Uploading..." : "Upload Logo"}
                  </Label>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoSelect}
                    disabled={uploadingLogo}
                  />
                  <p className="text-xs text-muted-foreground mt-2">PNG, JPG or SVG. Max 2MB.</p>
                </div>
              </div>
            </div>

            {/* Favicon */}
            <div className="space-y-4">
              <Label className="flex items-center gap-1">
                <FileImage className="h-4 w-4" />
                Favicon
              </Label>
              <div className="flex items-center gap-4">
                <div className="h-24 w-24 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden bg-muted">
                  {faviconUrl ? (
                    <img src={faviconUrl} alt="Favicon" className="h-12 w-12 object-contain" />
                  ) : (
                    <FileImage className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <Label
                    htmlFor="favicon-upload"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                  >
                    {uploadingFavicon ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {uploadingFavicon ? "Uploading..." : "Upload Favicon"}
                  </Label>
                  <input
                    id="favicon-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFaviconUpload}
                    disabled={uploadingFavicon}
                  />
                  <p className="text-xs text-muted-foreground mt-2">ICO, PNG or SVG. Max 1MB.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
