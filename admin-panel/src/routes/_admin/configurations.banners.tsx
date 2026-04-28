import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { z } from "zod";
import { configApi, type ConfigItem } from "@/lib/api/configuration";
import { ApiError } from "@/lib/api/client";
import { resolveImageUrl } from "@/lib/utils-format";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TableSkeleton, EmptyState, ErrorState } from "@/components/common/States";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ImageInput } from "@/components/common/ImageInput";

export const Route = createFileRoute("/_admin/configurations/banners")({
  component: BannersPage,
});

const schema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  link: z.string().trim().max(500).optional().or(z.literal("")),
});

function BannersPage() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ConfigItem | null>(null);
  const [deleting, setDeleting] = useState<ConfigItem | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["banners"],
    queryFn: () => configApi.banners.list(),
  });
  const items: ConfigItem[] = Array.isArray(data) ? data : (data as any)?.data || [];

  const onSaved = () => qc.invalidateQueries({ queryKey: ["banners"] });

  const delMutation = useMutation({
    mutationFn: (id: string | number) => configApi.banners.remove(id),
    onSuccess: () => {
      toast.success("Banner deleted");
      onSaved();
      setDeleting(null);
    },
    onError: (e: any) => toast.error(e?.message || "Delete failed"),
  });

  return (
    <div>
      <PageHeader
        title="Banners"
        description="Promotional banners for your storefront."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-1" /> New Banner
          </Button>
        }
      />
      <Card>
        {isLoading ? (
          <TableSkeleton cols={4} />
        ) : error ? (
          <ErrorState message={(error as ApiError)?.message} onRetry={() => refetch()} />
        ) : items.length === 0 ? (
          <EmptyState
            title="No banners yet"
            description="Add banners that appear on your storefront."
            action={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4 mr-1" /> New Banner</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Image</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden md:table-cell">Link</TableHead>
                  <TableHead className="w-32 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((b) => {
                  const img = resolveImageUrl((b.image_url as string) || (b.image as string));
                  return (
                    <TableRow key={String(b.id)}>
                      <TableCell>
                        {img ? (
                          <img src={img} alt={b.title || "banner"} className="h-12 w-20 object-cover rounded border border-border" />
                        ) : (
                          <div className="h-12 w-20 rounded bg-muted" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{b.title || b.name || "—"}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground truncate max-w-xs">
                        {(b.link as string) || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => setEditing(b)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleting(b)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <BannerForm open={creating} onOpenChange={setCreating} onSaved={onSaved} />
      <BannerForm open={!!editing} onOpenChange={(v) => !v && setEditing(null)} item={editing || undefined} onSaved={onSaved} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Delete banner?"
        description={`This will remove "${deleting?.title || deleting?.name}" permanently.`}
        loading={delMutation.isPending}
        onConfirm={() => deleting && delMutation.mutate(deleting.id)}
      />
    </div>
  );
}

function BannerForm({
  open,
  onOpenChange,
  item,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  item?: ConfigItem;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (open && item && title === "" && (item.title || item.name)) {
    setTitle(String(item.title || item.name || ""));
    setLink(String(item.link || ""));
  }
  if (!open && (title || link || image)) {
    setTimeout(() => {
      setTitle("");
      setLink("");
      setImage(null);
      setErrors({});
    }, 200);
  }

  const m = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse({ title, link });
      if (!parsed.success) {
        const fe: Record<string, string> = {};
        for (const issue of parsed.error.issues) fe[issue.path[0] as string] = issue.message;
        setErrors(fe);
        throw new Error("Validation failed");
      }
      if (!item && !image) {
        setErrors({ image: "Image is required" });
        throw new Error("Validation failed");
      }
      setErrors({});
      const fd = new FormData();
      fd.append("title", parsed.data.title);
      if (parsed.data.link) fd.append("link", parsed.data.link);
      if (image) fd.append("image", image);
      if (item) return configApi.banners.updateMultipart(item.id, fd);
      return configApi.banners.createMultipart(fd);
    },
    onSuccess: () => {
      toast.success(item ? "Banner saved" : "Banner created");
      onSaved();
      onOpenChange(false);
    },
    onError: (e: any) => {
      if (e instanceof ApiError && e.fieldErrors) setErrors(e.fieldErrors);
      if (e?.message && e.message !== "Validation failed") toast.error(e.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? "Edit banner" : "New banner"}</DialogTitle>
          <DialogDescription>Upload an image and provide a title.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            m.mutate();
          }}
          className="space-y-4"
          noValidate
        >
          <div>
            <Label htmlFor="bn-title">Title *</Label>
            <Input id="bn-title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5" />
            {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
          </div>
          <div>
            <Label htmlFor="bn-link">Link URL</Label>
            <Input id="bn-link" value={link} onChange={(e) => setLink(e.target.value)} className="mt-1.5" placeholder="https://..." />
            {errors.link && <p className="text-xs text-destructive mt-1">{errors.link}</p>}
          </div>
          <ImageInput
            value={image}
            onChange={setImage}
            existingUrl={(item?.image_url as string) || (item?.image as string)}
            label={item ? "Replace image (optional)" : "Image *"}
          />
          {errors.image && <p className="text-xs text-destructive mt-1">{errors.image}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={m.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={m.isPending}>
              {m.isPending ? "Saving..." : item ? "Save changes" : "Create banner"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
