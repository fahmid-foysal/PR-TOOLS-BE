import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
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
import { MultiImageInput } from "@/components/common/ImageInput";

export const Route = createFileRoute("/_admin/products/new")({
  component: NewProductPage,
});

const schema = z.object({
  product_name: z.string().trim().min(1, "Product name is required").max(200),
  purchase_price: z.coerce.number().nonnegative("Must be ≥ 0"),
  sell_price: z.coerce.number().positive("Must be > 0"),
  brand_id: z.string().min(1, "Brand is required"),
  category_id: z.string().min(1, "Category is required"),
  one_liner: z.string().max(200).optional().or(z.literal("")),
  description: z.string().max(2000).optional().or(z.literal("")),
  offer_category_id: z.string().optional().or(z.literal("")),
  offer_amount: z.string().optional().or(z.literal("")),
});

const NONE = "__none__";

function NewProductPage() {
  const navigate = useNavigate();
  
  // Queries
  const brandsQ = useQuery({ queryKey: ["brands"], queryFn: () => configApi.brands.list() });
  const categoriesQ = useQuery({ queryKey: ["categories"], queryFn: () => configApi.categories.list() });
  const offerCatsQ = useQuery({ queryKey: ["offer-categories"], queryFn: () => configApi.offerCategories.list() });

  // Extracting data safely based on backend field names
  const brands = (Array.isArray(brandsQ.data) ? brandsQ.data : (brandsQ.data as any)?.data) || [];
  const categories = (Array.isArray(categoriesQ.data) ? categoriesQ.data : (categoriesQ.data as any)?.data) || [];
  const offerCats = (Array.isArray(offerCatsQ.data) ? offerCatsQ.data : (offerCatsQ.data as any)?.data) || [];

  const [form, setForm] = useState({
    product_name: "",
    purchase_price: "",
    sell_price: "",
    brand_id: "",
    category_id: "",
    one_liner: "",
    description: "",
    offer_category_id: "",
    offer_amount: "",
  });
  const [images, setImages] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const m = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse(form);
      if (!parsed.success) {
        const fe: Record<string, string> = {};
        for (const issue of parsed.error.issues) fe[issue.path[0] as string] = issue.message;
        setErrors(fe);
        throw new Error("Validation failed");
      }
      setErrors({});
      const fd = new FormData();
      const d = parsed.data;
      
      fd.append("product_name", d.product_name);
      fd.append("purchase_price", String(d.purchase_price));
      fd.append("sell_price", String(d.sell_price));
      fd.append("brand_id", d.brand_id);
      fd.append("category_id", d.category_id);
      
      if (d.one_liner) fd.append("one_liner", d.one_liner);
      if (d.description) fd.append("description", d.description);
      if (d.offer_category_id) fd.append("offer_category_id", d.offer_category_id);
      if (d.offer_amount) fd.append("offer_amount", d.offer_amount);
      
      images.forEach((f) => fd.append("images", f));
      return productsApi.create(fd);
    },
    onSuccess: (res: any) => {
      toast.success("Product created");
      const id = res?.id ?? res?.data?.id;
      if (id) navigate({ to: "/products/$productId/edit", params: { productId: String(id) } });
      else navigate({ to: "/products", search: {} });
    },
    onError: (e: any) => {
      if (e instanceof ApiError && e.fieldErrors) setErrors(e.fieldErrors);
      if (e?.message && e.message !== "Validation failed") toast.error(e.message);
    },
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    m.mutate();
  };

  return (
    <div>
      <PageHeader
        title="Create Product"
        description="Add a new product to your catalog."
        actions={
          <Button variant="outline" asChild>
            <Link to="/products" search={{}}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
          </Button>
        }
      />
      <form onSubmit={onSubmit} noValidate className="space-y-4 max-w-4xl">
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Basic info</h3>
            <div>
              <Label htmlFor="pn">Product name *</Label>
              <Input id="pn" value={form.product_name} onChange={(e) => set("product_name", e.target.value)} className="mt-1.5" />
              {errors.product_name && <p className="text-xs text-destructive mt-1">{errors.product_name}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pp">Purchase price *</Label>
                <Input id="pp" type="number" step="0.01" value={form.purchase_price} onChange={(e) => set("purchase_price", e.target.value)} className="mt-1.5" />
                {errors.purchase_price && <p className="text-xs text-destructive mt-1">{errors.purchase_price}</p>}
              </div>
              <div>
                <Label htmlFor="sp">Sell price *</Label>
                <Input id="sp" type="number" step="0.01" value={form.sell_price} onChange={(e) => set("sell_price", e.target.value)} className="mt-1.5" />
                {errors.sell_price && <p className="text-xs text-destructive mt-1">{errors.sell_price}</p>}
              </div>
              <div>
                <Label>Brand *</Label>
                <Select value={form.brand_id} onValueChange={(v) => set("brand_id", v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select brand" /></SelectTrigger>
                  <SelectContent>
                    {brands.map((b: any) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.brand_name} {/* Fixed: Match backend field brand_name */}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.brand_id && <p className="text-xs text-destructive mt-1">{errors.brand_id}</p>}
              </div>
              <div>
                <Label>Category *</Label>
                <Select value={form.category_id} onValueChange={(v) => set("category_id", v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c: any) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.category_name} {/* Fixed: Match backend field category_name */}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category_id && <p className="text-xs text-destructive mt-1">{errors.category_id}</p>}
              </div>
            </div>
            <div>
              <Label htmlFor="ol">One-liner</Label>
              <Input id="ol" value={form.one_liner} onChange={(e) => set("one_liner", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="desc">Description</Label>
              <textarea id="desc" value={form.description} onChange={(e) => set("description", e.target.value)} className="mt-1.5 w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Optional offer</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Offer category</Label>
                <Select value={form.offer_category_id || NONE} onValueChange={(v) => set("offer_category_id", v === NONE ? "" : v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {offerCats.map((o: any) => (
                      <SelectItem key={o.id} value={String(o.id)}>
                        {o.offer_category_name} {/* Fixed: Match backend field offer_category_name */}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="oa">Offer amount</Label>
                <Input id="oa" type="number" step="0.01" value={form.offer_amount} onChange={(e) => set("offer_amount", e.target.value)} className="mt-1.5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">Images</h3>
            <MultiImageInput files={images} onChange={setImages} label="Upload product images" />
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" asChild><Link to="/products" search={{}}>Cancel</Link></Button>
          <Button type="submit" disabled={m.isPending}>
            {m.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {m.isPending ? "Creating..." : "Create product"}
          </Button>
        </div>
      </form>
    </div>
  );
}