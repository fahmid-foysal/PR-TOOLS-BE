import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Plus, Trash2, X } from "lucide-react";
import { z } from "zod";
import { productsApi } from "@/lib/api/products";
import { configApi } from "@/lib/api/configuration";
import { ApiError } from "@/lib/api/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingState, ErrorState } from "@/components/common/States";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { MultiImageInput } from "@/components/common/ImageInput";
import { formatCurrency, formatDate, resolveImageUrl } from "@/lib/utils-format";

export const Route = createFileRoute("/_admin/products/$productId/edit")({
  component: EditProductPage,
});

const schema = z.object({
  product_name: z.string().trim().min(1).max(200),
  purchase_price: z.coerce.number().nonnegative(),
  sell_price: z.coerce.number().positive(),
  brand_id: z.string().min(1),
  category_id: z.string().min(1),
  one_liner: z.string().max(200).optional().or(z.literal("")),
  description: z.string().max(2000).optional().or(z.literal("")),
});

function EditProductPage() {
  const { productId } = Route.useParams();
  const qc = useQueryClient();
  const productQ = useQuery({ queryKey: ["product", productId], queryFn: () => productsApi.details(productId) });
  const brandsQ = useQuery({ queryKey: ["brands"], queryFn: () => configApi.brands.list() });
  const categoriesQ = useQuery({ queryKey: ["categories"], queryFn: () => configApi.categories.list() });
  const offerCatsQ = useQuery({ queryKey: ["offer-categories"], queryFn: () => configApi.offerCategories.list() });
  const sectionsQ = useQuery({ queryKey: ["home-page-sections"], queryFn: () => configApi.homePageSections.list() });
  const homePageProductsQ = useQuery({ queryKey: ["home-page-products"], queryFn: () => productsApi.homePageProducts.list() });

  const brands = (Array.isArray(brandsQ.data) ? brandsQ.data : (brandsQ.data as any)?.data) || [];
  const categories = (Array.isArray(categoriesQ.data) ? categoriesQ.data : (categoriesQ.data as any)?.data) || [];
  const offerCats = (Array.isArray(offerCatsQ.data) ? offerCatsQ.data : (offerCatsQ.data as any)?.data) || [];
  const sections = (Array.isArray(sectionsQ.data) ? sectionsQ.data : (sectionsQ.data as any)?.data) || [];

  const [form, setForm] = useState({
    product_name: "",
    purchase_price: "",
    sell_price: "",
    brand_id: "",
    category_id: "",
    one_liner: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (productQ.data && !hydrated) {
      const p: any = productQ.data;
      setForm({
        product_name: p.product_name || "",
        purchase_price: String(p.purchase_price ?? ""),
        sell_price: String(p.sell_price ?? ""),
        brand_id: String(p.brand_id ?? p.brand?.id ?? ""),
        category_id: String(p.category_id ?? p.category?.id ?? ""),
        one_liner: p.one_liner || "",
        description: p.description || "",
      });
      setHydrated(true);
    }
  }, [productQ.data, hydrated]);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const saveBasic = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse(form);
      if (!parsed.success) {
        const fe: Record<string, string> = {};
        for (const issue of parsed.error.issues) fe[issue.path[0] as string] = issue.message;
        setErrors(fe);
        throw new Error("Validation failed");
      }
      setErrors({});
      return productsApi.update(productId, parsed.data);
    },
    onSuccess: () => {
      toast.success("Product updated");
      qc.invalidateQueries({ queryKey: ["product", productId] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: any) => {
      if (e instanceof ApiError && e.fieldErrors) setErrors(e.fieldErrors);
      if (e?.message && e.message !== "Validation failed") toast.error(e.message);
    },
  });

  if (productQ.isLoading) return <LoadingState label="Loading product..." />;
  if (productQ.error) return <ErrorState message={(productQ.error as ApiError)?.message} onRetry={() => productQ.refetch()} />;

  const product: any = productQ.data;

  return (
    <div>
      <PageHeader
        title={`Edit: ${product?.product_name || ""}`}
        description="Update product details, images, offers and home page placement."
        actions={
          <Button variant="outline" asChild>
            <Link to="/products" search={() => ({})}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-6xl">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Basic info</h3>
              <div>
                <Label>Product name *</Label>
                <Input value={form.product_name} onChange={(e) => set("product_name", e.target.value)} className="mt-1.5" />
                {errors.product_name && <p className="text-xs text-destructive mt-1">{errors.product_name}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Purchase price *</Label>
                  <Input type="number" step="0.01" value={form.purchase_price} onChange={(e) => set("purchase_price", e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label>Sell price *</Label>
                  <Input type="number" step="0.01" value={form.sell_price} onChange={(e) => set("sell_price", e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label>Brand *</Label>
                  <Select value={form.brand_id} onValueChange={(v) => set("brand_id", v)}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Brand" /></SelectTrigger>
                    <SelectContent>
                      {brands.map((b: any) => (
                        <SelectItem key={b.id} value={String(b.id)}>
                          {b.brand_name} {/* Fixed to match backend */}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Category *</Label>
                  <Select value={form.category_id} onValueChange={(v) => set("category_id", v)}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Category" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c: any) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.category_name} {/* Fixed to match backend */}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>One-liner</Label>
                <Input value={form.one_liner} onChange={(e) => set("one_liner", e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label>Description</Label>
                <textarea value={form.description} onChange={(e) => set("description", e.target.value)} className="mt-1.5 w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div className="flex justify-end">
                <Button onClick={() => saveBasic.mutate()} disabled={saveBasic.isPending}>
                  {saveBasic.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save changes
                </Button>
              </div>
            </CardContent>
          </Card>

          <ImagesSection productId={productId} images={product?.images || []} onChanged={() => qc.invalidateQueries({ queryKey: ["product", productId] })} />
        </div>

        <div className="space-y-4">
          <OffersSection
            productId={productId}
            offers={product?.offers || []}
            offerCats={offerCats}
            onChanged={() => qc.invalidateQueries({ queryKey: ["product", productId] })}
          />
          <HomePageSection
            productId={productId}
            sections={sections}
            placements={homePageProductsQ.data as any[] | undefined}
            onChanged={() => {
              qc.invalidateQueries({ queryKey: ["product", productId] });
              qc.invalidateQueries({ queryKey: ["home-page-products"] });
            }}
          />
        </div>
      </div>
    </div>
  );
}

function ImagesSection({ productId, images, onChanged }: { productId: string; images: any[]; onChanged: () => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [deleting, setDeleting] = useState<any | null>(null);

  const upload = useMutation({
    mutationFn: async () => {
      if (files.length === 0) throw new Error("Select at least one image");
      const fd = new FormData();
      fd.append("product_id", productId);
      files.forEach((f) => fd.append("images", f));
      return productsApi.images.add(fd);
    },
    onSuccess: () => {
      toast.success("Images uploaded");
      setFiles([]);
      onChanged();
    },
    onError: (e: any) => toast.error(e?.message || "Upload failed"),
  });

  const del = useMutation({
    mutationFn: (id: string | number) => productsApi.images.remove(id),
    onSuccess: () => {
      toast.success("Image removed");
      onChanged();
      setDeleting(null);
    },
    onError: (e: any) => toast.error(e?.message || "Delete failed"),
  });

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">Images</h3>
        {images.length === 0 ? (
          <div className="text-sm text-muted-foreground mb-4">No images yet.</div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
            {images.map((img) => {
              const url = resolveImageUrl(img.image_url || img.image || img.url);
              return (
                <div key={String(img.id)} className="relative">
                  <img src={url} alt="" className="aspect-square object-cover rounded-md border border-border" />
                  <button type="button" onClick={() => setDeleting(img)} className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
        <MultiImageInput files={files} onChange={setFiles} label="Add new images" />
        <div className="flex justify-end mt-3">
          <Button onClick={() => upload.mutate()} disabled={upload.isPending || files.length === 0}>
            {upload.isPending ? "Uploading..." : "Upload images"}
          </Button>
        </div>
        <ConfirmDialog
          open={!!deleting}
          onOpenChange={(v) => !v && setDeleting(null)}
          title="Delete this image?"
          loading={del.isPending}
          onConfirm={() => deleting && del.mutate(deleting.id)}
        />
      </CardContent>
    </Card>
  );
}

function OffersSection({ productId, offers, offerCats, onChanged }: { productId: string; offers: any[]; offerCats: any[]; onChanged: () => void }) {
  const [offerCategoryId, setOfferCategoryId] = useState("");
  const [offeredPrice, setOfferedPrice] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [deleting, setDeleting] = useState<any | null>(null);

  const add = useMutation({
    mutationFn: () =>
      productsApi.offers.add({
        product_id: productId,
        offer_category_id: offerCategoryId,
        offered_price: Number(offeredPrice),
        offer_expires_at: expiresAt || undefined,
      }),
    onSuccess: () => {
      toast.success("Offer added");
      setOfferCategoryId("");
      setOfferedPrice("");
      setExpiresAt("");
      onChanged();
    },
    onError: (e: any) => toast.error(e?.message || "Failed to add offer"),
  });

  const del = useMutation({
    mutationFn: (id: string | number) => productsApi.offers.remove(id),
    onSuccess: () => {
      toast.success("Offer removed");
      onChanged();
      setDeleting(null);
    },
    onError: (e: any) => toast.error(e?.message || "Delete failed"),
  });

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">Offers</h3>
        {offers.length === 0 ? (
          <div className="text-sm text-muted-foreground mb-4">No offers yet.</div>
        ) : (
          <ul className="space-y-2 mb-4">
            {offers.map((o) => (
              <li key={String(o.id)} className="flex items-start justify-between gap-2 border border-border rounded-md p-3">
                <div className="text-sm">
                  <div className="font-medium">
                    {/* Fixed to check for offer_category_name */}
                    {typeof o.offer_category === "string" ? o.offer_category : o.offer_category?.offer_category_name || "Offer"}
                  </div>
                  <div className="text-emerald-600 font-semibold">{formatCurrency(o.offered_price)}</div>
                  <div className="text-xs text-muted-foreground">Expires {formatDate(o.offer_expires_at)}</div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setDeleting(o)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <div className="space-y-2 border-t border-border pt-4">
          <Label className="text-xs">Add offer</Label>
          <Select value={offerCategoryId} onValueChange={setOfferCategoryId}>
            <SelectTrigger><SelectValue placeholder="Offer category" /></SelectTrigger>
            <SelectContent>
              {offerCats.map((o: any) => (
                <SelectItem key={o.id} value={String(o.id)}>
                  {o.offer_category_name} {/* Fixed to match backend */}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="number" step="0.01" placeholder="Offered price" value={offeredPrice} onChange={(e) => setOfferedPrice(e.target.value)} />
          <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          <Button className="w-full" onClick={() => add.mutate()} disabled={!offerCategoryId || !offeredPrice || add.isPending}>
            <Plus className="h-4 w-4 mr-1" /> Add offer
          </Button>
        </div>
        <ConfirmDialog
          open={!!deleting}
          onOpenChange={(v) => !v && setDeleting(null)}
          title="Delete this offer?"
          loading={del.isPending}
          onConfirm={() => deleting && del.mutate(deleting.id)}
        />
      </CardContent>
    </Card>
  );
}

function HomePageSection({
  productId,
  sections,
  placements,
  onChanged,
}: {
  productId: string;
  sections: any[];
  placements?: any[];
  onChanged: () => void;
}) {
  const [sectionId, setSectionId] = useState("");
  const [deleting, setDeleting] = useState<any | null>(null);

  const existing: any[] = [];
  if (placements) {
    for (const sec of placements) {
      const list = sec.products || sec.items || [];
      for (const it of list) {
        const pid = String(it.product_id ?? it.product?.id ?? it.id);
        if (pid === String(productId)) existing.push({ ...it, _sectionTitle: sec.section_name || sec.title || sec.name });
      }
    }
  }

  const add = useMutation({
    mutationFn: () => productsApi.homePageProducts.add({ product_id: productId, home_page_section_id: sectionId }),
    onSuccess: () => {
      toast.success("Added to home page");
      setSectionId("");
      onChanged();
    },
    onError: (e: any) => toast.error(e?.message || "Failed to add"),
  });

  const del = useMutation({
    mutationFn: (id: string | number) => productsApi.homePageProducts.remove(id),
    onSuccess: () => {
      toast.success("Removed from home page");
      onChanged();
      setDeleting(null);
    },
    onError: (e: any) => toast.error(e?.message || "Delete failed"),
  });

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">Home page placement</h3>
        {existing.length === 0 ? (
          <div className="text-sm text-muted-foreground mb-4">Not on the home page.</div>
        ) : (
          <ul className="space-y-2 mb-4">
            {existing.map((e) => (
              <li key={String(e.id)} className="flex items-center justify-between border border-border rounded-md p-3 text-sm">
                <span>{e._sectionTitle || "Section"}</span>
                <Button variant="ghost" size="icon" onClick={() => setDeleting(e)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <div className="space-y-2 border-t border-border pt-4">
          <Label className="text-xs">Add to a section</Label>
          <Select value={sectionId} onValueChange={setSectionId}>
            <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
            <SelectContent>
              {sections.map((s: any) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.section_name} {/* Fixed to match backend */}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button className="w-full" onClick={() => add.mutate()} disabled={!sectionId || add.isPending}>
            <Plus className="h-4 w-4 mr-1" /> Add to section
          </Button>
        </div>
        <ConfirmDialog
          open={!!deleting}
          onOpenChange={(v) => !v && setDeleting(null)}
          title="Remove from home page?"
          loading={del.isPending}
          onConfirm={() => deleting && del.mutate(deleting.id)}
        />
      </CardContent>
    </Card>
  );
}