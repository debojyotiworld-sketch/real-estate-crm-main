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
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import { Building2, Edit, Eye, Plus, Save, Trash2, Wifi } from "lucide-react";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Types based on YOUR schema
type BlogRow = {
    id: string;
    title: string;
    category: string | null;
    content: string;
    excerpt: string | null;
    featured_image_url: string | null;
    slug: string | null;
    status: "draft" | "published";
    author_name: string | null;
    tags: string;
    created_at: string;
    updated_at: string;
    published_at: string | null;
};

// ---------------------------
// Form schema (Zod)
// ---------------------------
const blogSchema = z.object({
    title: z.string().min(1, "Title is required").max(200),
    category: z.string().optional().or(z.literal("")),
    content: z.string().min(1, "Content is required"),
    excerpt: z.string().max(300).optional().or(z.literal("")),
    featured_image_url: z.string().url().optional().or(z.literal("")),
    slug: z.string().max(200).optional().or(z.literal("")),
    status: z.enum(["draft", "published"]),
    author_name: z.string().max(120).optional().or(z.literal("")),
    tags: z.string().max(200).optional().or(z.literal("")),
});

type BlogForm = z.infer<typeof blogSchema>;

export default function BlogsTable() {

    const [loading, setLoading] = useState(true);
    const [blogs, setBlogs] = useState<BlogRow[]>([]);
    const [editing, setEditing] = useState<BlogRow | null>(null);
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewBlog, setPreviewBlog] = useState<BlogRow | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<BlogForm>({
        resolver: zodResolver(blogSchema),
        defaultValues: {
            title: "",
            category: "",
            content: "",
            excerpt: "",
            featured_image_url: "",
            slug: "",
            status: "draft",
            author_name: "",
            tags: "",
        },
    });

    const dialogTitle = useMemo(
        () => (editing ? "Edit Blog" : "Add Blog"),
        [editing]
    );

    useEffect(() => {
        void loadBlogs();
    }, []);

    const loadBlogs = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("blogs")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;

            setBlogs((data ?? []) as BlogRow[]);
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    const startCreate = () => {
        setEditing(null);

        reset({
            title: "",
            category: "",
            content: "",
            excerpt: "",
            featured_image_url: "",
            slug: "",
            status: "draft",
            author_name: "Phoenix Realesthatic",
            tags: "",
        });

        setOpen(true);
    };

    const startEdit = (blog: BlogRow) => {
        setEditing(blog);

        reset({
            title: blog.title,
            content: blog.content,
            excerpt: blog.excerpt ?? "",
            featured_image_url: blog.featured_image_url ?? "",
            slug: blog.slug ?? "",
            status: blog.status,
            author_name: blog.author_name ?? "",
            tags: blog.tags,
            category: blog.category ?? "",
        });

        setOpen(true);
    };

    // ONLY showing CHANGED / IMPORTANT parts

    // ✅ FIX: auto slug
    useEffect(() => {
        const title = watch("title");

        if (!editing && title) {
            const slug = title
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "");

            setValue("slug", slug);
        }
    }, [watch("title")]);

    // image upload to Supabase Storage
    const uploadImage = async (file: File) => {
        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-image`,
                {
                    method: "POST",
                    body: formData,
                    headers: {
                        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                    },
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Upload failed");
            }

            return data.url;
        } catch (e: any) {
            toast.error(e.message);
            return null;
        }
    };

    // submit handler for create/update
    const onSubmit = async (values: BlogForm) => {
        setSaving(true);

        try {
            let imageUrl = values.featured_image_url;

            // Upload image during submit
            if (imageFile) {
                const uploadedUrl = await uploadImage(imageFile);
                if (uploadedUrl) {
                    imageUrl = uploadedUrl;
                }
            }

            const payload = {
                title: values.title,
                content: values.content,
                excerpt: values.excerpt || null,
                featured_image_url: imageUrl || null,
                slug: values.slug || null,
                status: values.status,
                author_name: values.author_name || "Phoenix Realesthatic",
                tags: values.tags?.trim() || "general",
                updated_at: new Date().toISOString(),
                published_at:
                    values.status === "published"
                        ? editing?.published_at || new Date().toISOString()
                        : null,
            };

            if (!editing) {
                const { error } = await supabase.from("blogs").insert(payload);
                if (error) throw error;
                toast.success("Blog created");
            } else {
                const { error } = await supabase
                    .from("blogs")
                    .update(payload)
                    .eq("id", editing.id);

                if (error) throw error;
                toast.success("Blog updated");
            }

            setOpen(false);
            setImageFile(null); // ✅ reset
            await loadBlogs();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setSaving(false);
        }
    };

    const deleteBlog = async (blog: BlogRow) => {
        try {
            const { error } = await supabase
                .from("blogs")
                .delete()
                .eq("id", blog.id);

            if (error) throw error;

            toast.success("Blog deleted");
            await loadBlogs();
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            Blogs
                        </CardTitle>
                        <CardDescription>
                            Manage multiple blogs. Configure blog-wise settings for visibility and publishing.
                        </CardDescription>
                    </div>

                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={startCreate} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Add Blog
                            </Button>
                        </DialogTrigger>

                        <DialogContent className="max-w-3xl p-0 overflow-hidden">
                            <form
                                onSubmit={handleSubmit(onSubmit)}
                                className="flex max-h-[85vh] flex-col"
                            >
                                {/* Header */}
                                <DialogHeader className="sticky top-0 z-10 bg-background border-b px-6 py-4">
                                    <DialogTitle>{editing ? "Edit Blog" : "Add Blog"}</DialogTitle>
                                    <DialogDescription>
                                        Create and manage blogs. Published blogs will be visible to users.
                                    </DialogDescription>
                                </DialogHeader>

                                {/* Body */}
                                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                                    {/* Title */}
                                    <div className="space-y-2">
                                        <Label>Title *</Label>
                                        <Input placeholder="Enter blog title" {...register("title")} />
                                        {errors.title && (
                                            <p className="text-sm text-destructive">{errors.title.message}</p>
                                        )}
                                    </div>

                                    {/* Slug */}
                                    <div className="space-y-2">
                                        <Label>Slug</Label>
                                        <Input
                                            placeholder="auto-generated-from-title"
                                            {...register("slug")}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Leave empty to auto-generate from title
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Category</Label>

                                        <Select
                                            value={watch("category")}
                                            onValueChange={(v) => setValue("category", v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>

                                            <SelectContent>
                                                <SelectItem value="Market Trends">Market Trends</SelectItem>
                                                <SelectItem value="Buyer's Guide">Buyer's Guide</SelectItem>
                                                <SelectItem value="Neighborhoods">Neighborhoods</SelectItem>
                                                <SelectItem value="Investment">Investment</SelectItem>
                                                <SelectItem value="Design">Design</SelectItem>
                                                <SelectItem value="Selling">Selling</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Content */}
                                    <div className="space-y-2">
                                        <Label>Content *</Label>
                                        <RichTextEditor
                                            value={watch("content")}
                                            onChange={(val) =>
                                                setValue("content", val, { shouldValidate: true })
                                            }
                                        />
                                        {errors.content && (
                                            <p className="text-sm text-destructive">{errors.content.message}</p>
                                        )}
                                    </div>

                                    {/* Grid Fields */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                        {/* Excerpt */}
                                        <div className="space-y-2 md:col-span-2">
                                            <Label>Excerpt</Label>
                                            <Input
                                                placeholder="Short summary of blog"
                                                {...register("excerpt")}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Featured Image</Label>

                                            <Input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;

                                                    setImageFile(file); // ✅ store file
                                                }}
                                            />

                                            {/* Preview */}
                                            {watch("featured_image_url") && (
                                                <img
                                                    src={watch("featured_image_url")}
                                                    alt="Preview"
                                                    className="h-32 rounded-md border object-cover"
                                                />
                                            )}
                                        </div>

                                        {/* Author */}
                                        <div className="space-y-2">
                                            <Label>Author</Label>
                                            <Input
                                                placeholder="Author name"
                                                {...register("author_name")}
                                            />
                                        </div>

                                        {/* Tags */}
                                        <div className="space-y-2 md:col-span-2">
                                            <Label>Tags</Label>
                                            <Input
                                                placeholder="real estate, investment, property"
                                                {...register("tags")}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Separate tags with commas
                                            </p>
                                        </div>

                                        {/* Status */}
                                        <div className="space-y-2">
                                            <Label>Status</Label>
                                            <Select
                                                value={watch("status")}
                                                onValueChange={(v) =>
                                                    setValue("status", v as "draft" | "published")
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="draft">Draft</SelectItem>
                                                    <SelectItem value="published">Published</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="sticky bottom-0 z-10 bg-background border-t px-6 py-4">
                                    <div className="flex justify-end gap-2">
                                        <Button type="submit" disabled={saving} className="gap-2">
                                            <Save className="h-4 w-4" />
                                            {saving ? "Saving..." : "Save Blog"}
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
                            {/* CLOSE BUTTON */}
                            <div className="absolute right-4 top-4 z-50">
                                <button
                                    onClick={() => setPreviewOpen(false)}
                                    className="bg-white/90 hover:bg-white rounded-full p-2 shadow"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="bg-background">

                                {/* HERO IMAGE */}
                                {previewBlog?.featured_image_url && (
                                    <div className="w-full h-[320px] overflow-hidden">
                                        <img
                                            src={previewBlog.featured_image_url}
                                            alt="Blog"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}

                                {/* CONTENT */}
                                <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">

                                    {/* TITLE */}
                                    <h1 className="text-4xl font-bold leading-tight">
                                        {previewBlog?.title || "Blog Title"}
                                    </h1>
                                    <span className="inline-block bg-accent/10 text-accent text-xs px-3 py-1 rounded-full">
                                        {previewBlog?.category}
                                    </span>

                                    {/* META */}
                                    <div className="flex items-center justify-between text-sm text-muted-foreground border-b pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-semibold">
                                                {(previewBlog?.author_name || "P").charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground">
                                                    {previewBlog?.author_name || "Phoenix Realesthatic"}
                                                </p>
                                                <p className="text-xs">
                                                    {new Date().toLocaleDateString()} • 5 min read
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* EXCERPT */}
                                    {previewBlog?.excerpt && (
                                        <p className="text-lg text-muted-foreground italic border-l-4 pl-4">
                                            {previewBlog.excerpt || "No excerpt"}
                                        </p>
                                    )}

                                    {/* CONTENT */}
                                    <div
                                        className="prose prose-lg max-w-none 
                                            prose-headings:font-semibold 
                                            prose-p:text-muted-foreground 
                                            prose-a:text-primary 
                                            prose-img:rounded-lg"
                                        dangerouslySetInnerHTML={{
                                            __html: previewBlog?.content || "<p>No content</p>",
                                        }}
                                    />

                                    {/* TAGS */}
                                    {previewBlog?.tags && (
                                        <div className="pt-6 border-t">
                                            <div className="flex flex-wrap gap-2">
                                                {previewBlog.tags
                                                    .split(",")
                                                    .map((tag: string, i: number) => (
                                                        <span
                                                            key={i}
                                                            className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full"
                                                        >
                                                            #{tag.trim()}
                                                        </span>
                                                    ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* AUTHOR BOX */}
                                    <div className="mt-10 p-6 rounded-xl border bg-muted/30 flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold">
                                            {(previewBlog?.author_name || "P").charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-semibold">
                                                {previewBlog?.author_name || "Phoenix Realesthatic"}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Sharing insights on real estate, investment & growth.
                                            </p>
                                        </div>
                                    </div>

                                </div>
                            </div>

                        </DialogContent>
                    </Dialog>
                </CardHeader>

                <CardContent>
                    {loading ? (
                        <p className="text-sm text-muted-foreground">Loading blogs...</p>
                    ) : blogs.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No blogs found. Click <span className="font-medium">Add Blog</span>.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {blogs.map((b) => {
                                return (
                                    <div
                                        key={b.id}
                                        className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-lg border p-4"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-medium">{b.title}</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <Button variant="default" onClick={() => startEdit(b)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>

                                            <Button
                                                variant="destructive"
                                                onClick={() => deleteBlog(b)}
                                                disabled={deletingId === b.id}
                                                className="gap-2"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>

                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => { setPreviewBlog(b); setPreviewOpen(true) }}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
