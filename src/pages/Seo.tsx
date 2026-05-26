import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RichTextEditor from "@/components/cms/RichTextEditor";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Building2, Edit, Plus, Save, Trash2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

// ---------------- TYPES ----------------
type SeoRow = {
    id: string;
    slug: string;
    title: string;
    meta_title: string | null;
    meta_description: string | null;
    meta_keywords: string | null;
    og_title: string | null;
    og_description: string | null;
    og_image: string | null;
    og_type: string;
    canonical_url: string | null;
    json_ld: any;
    noindex: boolean;
    is_active: boolean;
};

// ---------------- VALIDATION ----------------
const seoSchema = z.object({
    slug: z.string().min(1),
    title: z.string().min(1),
    meta_title: z.string().optional(),
    meta_description: z.string().optional(),
    meta_keywords: z.string().optional(),
    og_title: z.string().optional(),
    og_description: z.string().optional(),
    og_image: z.string().optional(),
    canonical_url: z.string().optional(),
    json_ld: z.string().optional(),
});

type SeoForm = z.infer<typeof seoSchema>;

export default function SeoTable() {
    const [loading, setLoading] = useState(true);
    const [seos, setSeos] = useState<SeoRow[]>([]);
    const [editing, setEditing] = useState<SeoRow | null>(null);
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    // 🔍 Search + Pagination
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const PAGE_SIZE = 5;

    const { register, handleSubmit, reset, setValue, watch } =
        useForm<SeoForm>({
            resolver: zodResolver(seoSchema),
            defaultValues: {
                slug: "",
                title: "",
                meta_title: "",
                meta_description: "",
                meta_keywords: "",
                og_title: "",
                og_description: "",
                og_image: "",
                canonical_url: "",
                json_ld: "",
            },
        });

    // ---------------- LOAD ----------------
    useEffect(() => {
        loadSeos();
    }, [search, page]);

    const loadSeos = async () => {
        try {
            setLoading(true);

            let query = supabase
                .from("page_seo")
                .select("*", { count: "exact" })
                .order("created_at", { ascending: false });

            // 🔍 Search
            if (search) {
                query = query.or(`slug.ilike.%${search}%,title.ilike.%${search}%`);
            }

            // 📄 Pagination
            const from = (page - 1) * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            const { data, error, count } = await query.range(from, to);

            if (error) throw error;

            setSeos(data || []);
            setTotal(count || 0);
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    // ---------------- CREATE ----------------
    const startCreate = () => {
        setEditing(null);
        reset({
            slug: "",
            title: "",
            meta_title: "",
            meta_description: "",
            meta_keywords: "",
            og_title: "",
            og_description: "",
            og_image: "",
            canonical_url: "",
            json_ld: "",
        });
        setOpen(true);
    };

    // ---------------- EDIT ----------------
    const startEdit = (seo: SeoRow) => {
        setEditing(seo);

        reset({
            slug: seo.slug,
            title: seo.title,
            meta_title: seo.meta_title || "",
            meta_description: seo.meta_description || "",
            meta_keywords: seo.meta_keywords || "",
            og_title: seo.og_title || "",
            og_description: seo.og_description || "",
            og_image: seo.og_image || "",
            canonical_url: seo.canonical_url || "",
            json_ld: seo.json_ld
                ? JSON.stringify(seo.json_ld, null, 2)
                : "",
        });

        setOpen(true);
    };

    // ---------------- AUTO SLUG ----------------
    useEffect(() => {
        const title = watch("title");
        if (!editing && title) {
            const slug = title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "");
            setValue("slug", slug);
        }
    }, [watch("title")]);

    // ---------------- SUBMIT ----------------
    const onSubmit = async (values: SeoForm) => {
        setSaving(true);

        let jsonLd = null;
        try {
            jsonLd = values.json_ld ? JSON.parse(values.json_ld) : null;
        } catch {
            toast.error("Invalid JSON-LD");
            setSaving(false);
            return;
        }

        try {
            if (!editing) {
                // ✅ INSERT (slug & title required)
                const payload: TablesInsert<"page_seo"> = {
                    slug: values.slug,
                    title: values.title,
                    meta_title: values.meta_title || null,
                    meta_description: values.meta_description || null,
                    meta_keywords: values.meta_keywords || null,
                    og_title: values.og_title || null,
                    og_description: values.og_description || null,
                    og_image: values.og_image || null,
                    canonical_url: values.canonical_url || null,
                    json_ld: jsonLd,
                    updated_at: new Date().toISOString(),
                };

                const { error } = await supabase
                    .from("page_seo")
                    .insert(payload);

                if (error) throw error;

                toast.success("SEO Created");
            } else {
                // ✅ UPDATE (fields optional)
                const payload: TablesUpdate<"page_seo"> = {
                    slug: values.slug,
                    title: values.title,
                    meta_title: values.meta_title || null,
                    meta_description: values.meta_description || null,
                    meta_keywords: values.meta_keywords || null,
                    og_title: values.og_title || null,
                    og_description: values.og_description || null,
                    og_image: values.og_image || null,
                    canonical_url: values.canonical_url || null,
                    json_ld: jsonLd,
                    updated_at: new Date().toISOString(),
                };

                const { error } = await supabase
                    .from("page_seo")
                    .update(payload)
                    .eq("id", editing.id);

                if (error) throw error;

                toast.success("SEO Updated");
            }

            setOpen(false);
            loadSeos();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setSaving(false);
        }
    };

    // ---------------- DELETE ----------------
    const deleteSeo = async (seo: SeoRow) => {
        await supabase.from("page_seo").delete().eq("id", seo.id);
        loadSeos();
    };

    // ---------------- UI ----------------
    return (
        <MainLayout title="SEO" subtitle="Manage SEO settings">
            <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" /> SEO
                        </CardTitle>
                        <CardDescription>
                            Manage your page SEO
                        </CardDescription>
                    </div>

                    {/* 🔍 Search + Add */}
                    <div className="flex gap-2">
                        <Input
                            placeholder="Search SEO..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            className="w-64"
                        />

                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={startCreate}>
                                    <Plus className="h-4 w-4" /> Add SEO
                                </Button>
                            </DialogTrigger>

                            <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-hidden">
                                <form
                                    onSubmit={handleSubmit(onSubmit)}
                                    className="flex flex-col max-h-[85vh]"
                                >

                                    {/* Scrollable Body */}
                                    <div className="flex-1 overflow-y-auto space-y-5 pr-2">

                                        <div className="space-y-2">
                                            <Label>Slug</Label>
                                            <Input {...register("slug")} placeholder="page-name" />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Title *</Label>
                                            <Input {...register("title")} placeholder="Page Title" />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Meta Title</Label>
                                            <Input {...register("meta_title")} placeholder="SEO Title" />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Meta Description</Label>
                                            <Input {...register("meta_description")} placeholder="SEO Description" />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Meta Keywords</Label>
                                            <Input
                                                {...register("meta_keywords")}
                                                placeholder="real estate, flats, kolkata"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>OG Title</Label>
                                            <Input {...register("og_title")} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>OG Description</Label>
                                            <Input {...register("og_description")} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>OG Image URL</Label>
                                            <Input {...register("og_image")} placeholder="https://..." />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Canonical URL</Label>
                                            <Input
                                                {...register("canonical_url")}
                                                placeholder="https://example.com/page"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>JSON-LD</Label>
                                            <RichTextEditor
                                                value={watch("json_ld") || ""}
                                                onChange={(v) => setValue("json_ld", v)}
                                            />
                                        </div>

                                    </div>

                                    {/* Sticky Footer */}
                                    <div className="pt-4 border-t bg-background">
                                        <Button type="submit" disabled={saving} className="w-full">
                                            <Save className="h-4 w-4" /> Save SEO
                                        </Button>
                                    </div>

                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>

                <CardContent>
                    {loading ? (
                        <p>Loading...</p>
                    ) : (
                        <>
                            {/* TABLE */}
                            <div className="rounded-lg border overflow-hidden">
                                <div className="grid grid-cols-[1.2fr_1.5fr_1.5fr_1fr_0.8fr_0.8fr] bg-muted px-4 py-3 text-sm font-medium">
                                    <div>Slug</div>
                                    <div>Title</div>
                                    <div>Meta Title</div>
                                    <div>Keywords</div>
                                    <div>Status</div>
                                    <div className="text-right">Action</div>
                                </div>

                                {seos.map((s) => (
                                    <div key={s.id} className="grid grid-cols-[1.2fr_1.5fr_1.5fr_1fr_0.8fr_0.8fr] px-4 py-3 border-t items-center">
                                        <div>{s.slug}</div>
                                        <div>{s.title}</div>
                                        <div>{s.meta_title}</div>
                                        <div>{s.meta_keywords}</div>

                                        <div>
                                            <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded">
                                                {s.is_active ? "Active" : "Inactive"}
                                            </span>
                                        </div>

                                        <div className="flex justify-end gap-2">
                                            <Button size="icon" onClick={() => startEdit(s)}>
                                                <Edit />
                                            </Button>
                                            <Button size="icon" variant="destructive" onClick={() => deleteSeo(s)}>
                                                <Trash2 />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* 📄 Pagination */}
                            <div className="flex justify-between items-center mt-4">
                                <p className="text-sm text-muted-foreground">
                                    Showing {(page - 1) * PAGE_SIZE + 1} -{" "}
                                    {Math.min(page * PAGE_SIZE, total)} of {total}
                                </p>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        disabled={page === 1}
                                        onClick={() => setPage((p) => p - 1)}
                                    >
                                        Prev
                                    </Button>

                                    <Button
                                        variant="outline"
                                        disabled={page * PAGE_SIZE >= total}
                                        onClick={() => setPage((p) => p + 1)}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </MainLayout>
    );
}
