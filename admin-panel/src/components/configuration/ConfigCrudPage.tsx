import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { z } from "zod";
import { configApi, type ConfigItem } from "@/lib/api/configuration";
import { ApiError } from "@/lib/api/client";
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
import { LoadingState, EmptyState, ErrorState, TableSkeleton } from "@/components/common/States";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

type ApiClient = ReturnType<typeof getApi>;
function getApi(kind: ConfigKind) {
  return configApi[kind];
}

export type ConfigKind = "brands" | "categories" | "offerCategories" | "homePageSections";

const KIND_META: Record<ConfigKind, { singular: string; plural: string; queryKey: string; description: string }> = {
  brands: { singular: "Brand", plural: "Brands", queryKey: "brands", description: "Manage product brands." },
  categories: { singular: "Category", plural: "Categories", queryKey: "categories", description: "Top-level product categories." },
  offerCategories: { singular: "Offer Category", plural: "Offer Categories", queryKey: "offer-categories", description: "Categorize promotional offers." },
  homePageSections: { singular: "Home Page Section", plural: "Home Page Sections", queryKey: "home-page-sections", description: "Sections that appear on your storefront home page." },
};

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  one_liner: z.string().max(200).optional().or(z.literal("")),
  description: z.string().max(1000).optional().or(z.literal("")),
});

export function ConfigCrudPage({ kind }: { kind: ConfigKind }) {
  const meta = KIND_META[kind];
  const api = getApi(kind);
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<ConfigItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<ConfigItem | null>(null);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: [meta.queryKey],
    queryFn: () => api.list(),
  });

  const items: ConfigItem[] = Array.isArray(data) ? data : (data as any)?.data || [];
  const filtered = items.filter((i) => {
    if (!search) return true;
    const hay = `${i.name || i.title || ""} ${i.one_liner || ""}`.toLowerCase();
    return hay.includes(search.toLowerCase());
  });

  const onSaved = () => {
    qc.invalidateQueries({ queryKey: [meta.queryKey] });
  };

  return (
    <div>
      <PageHeader
        title={meta.plural}
        description={meta.description}
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-1" /> New {meta.singular}
          </Button>
        }
      />

      <Card>
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${meta.plural.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="text-xs text-muted-foreground">{filtered.length} item(s)</div>
        </div>

        {isLoading ? (
          <TableSkeleton />
        ) : error ? (
          <ErrorState message={(error as ApiError)?.message} onRetry={() => refetch()} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={`No ${meta.plural.toLowerCase()} yet`}
            description={`Create your first ${meta.singular.toLowerCase()} to get started.`}
            action={
              <Button onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4 mr-1" /> New {meta.singular}
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">One-liner</TableHead>
                  <TableHead className="w-32 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((it) => (
                  <TableRow key={String(it.id)}>
                    <TableCell className="font-medium">{it.name || it.title || "—"}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {it.one_liner || it.description || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setEditing(it)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleting(it)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {isFetching && !isLoading && (
          <div className="px-4 py-2 text-xs text-muted-foreground">Refreshing...</div>
        )}
      </Card>

      <ConfigFormDialog
        open={creating}
        onOpenChange={setCreating}
        title={`New ${meta.singular}`}
        api={api}
        onSaved={onSaved}
      />
      <ConfigFormDialog
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        title={`Edit ${meta.singular}`}
        api={api}
        item={editing || undefined}
        onSaved={onSaved}
      />
      <DeleteConfig deleting={deleting} setDeleting={setDeleting} api={api} onDone={onSaved} singular={meta.singular} />
    </div>
  );
}

function DeleteConfig({
  deleting,
  setDeleting,
  api,
  onDone,
  singular,
}: {
  deleting: ConfigItem | null;
  setDeleting: (v: ConfigItem | null) => void;
  api: ApiClient;
  onDone: () => void;
  singular: string;
}) {
  const m = useMutation({
    mutationFn: (id: string | number) => api.remove(id),
    onSuccess: () => {
      toast.success(`${singular} deleted`);
      onDone();
      setDeleting(null);
    },
    onError: (e: any) => toast.error(e?.message || "Delete failed"),
  });
  return (
    <ConfirmDialog
      open={!!deleting}
      onOpenChange={(v) => !v && setDeleting(null)}
      title={`Delete ${singular}?`}
      description={`This will permanently remove "${deleting?.name || deleting?.title}".`}
      loading={m.isPending}
      onConfirm={() => deleting && m.mutate(deleting.id)}
    />
  );
}

function ConfigFormDialog({
  open,
  onOpenChange,
  title,
  api,
  item,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  api: ApiClient;
  item?: ConfigItem;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [oneLiner, setOneLiner] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset on open
  useState(() => null);
  if (open && item && name === "" && (item.name || item.title)) {
    // hydrate once
    setName(String(item.name || item.title || ""));
    setOneLiner(String(item.one_liner || ""));
    setDescription(String(item.description || ""));
  }
  // Clear when closed
  if (!open && (name || oneLiner || description)) {
    setTimeout(() => {
      setName("");
      setOneLiner("");
      setDescription("");
      setErrors({});
    }, 200);
  }

  const m = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse({ name, one_liner: oneLiner, description });
      if (!parsed.success) {
        const fe: Record<string, string> = {};
        for (const issue of parsed.error.issues) fe[issue.path[0] as string] = issue.message;
        setErrors(fe);
        throw new Error("Validation failed");
      }
      setErrors({});
      const body: Record<string, unknown> = { name: parsed.data.name };
      if (parsed.data.one_liner) body.one_liner = parsed.data.one_liner;
      if (parsed.data.description) body.description = parsed.data.description;
      if (item) return api.update(item.id, body);
      return api.create(body);
    },
    onSuccess: () => {
      toast.success(item ? "Saved" : "Created");
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
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Fill in the details below.</DialogDescription>
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
            <Label htmlFor="cf-name">Name *</Label>
            <Input id="cf-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
          </div>
          <div>
            <Label htmlFor="cf-one">One-liner</Label>
            <Input id="cf-one" value={oneLiner} onChange={(e) => setOneLiner(e.target.value)} className="mt-1.5" />
            {errors.one_liner && <p className="text-xs text-destructive mt-1">{errors.one_liner}</p>}
          </div>
          <div>
            <Label htmlFor="cf-desc">Description</Label>
            <textarea
              id="cf-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5 w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            {errors.description && <p className="text-xs text-destructive mt-1">{errors.description}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={m.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={m.isPending}>
              {m.isPending ? "Saving..." : item ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { LoadingState };
