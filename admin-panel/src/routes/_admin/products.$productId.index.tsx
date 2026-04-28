import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Pencil } from "lucide-react";
import { productsApi } from "@/lib/api/products";
import { ApiError } from "@/lib/api/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingState, ErrorState } from "@/components/common/States";
import { formatCurrency, formatDate, resolveImageUrl } from "@/lib/utils-format";

export const Route = createFileRoute("/_admin/products/$productId/")({
  component: ProductDetailsPage,
});

function ProductDetailsPage() {
  const { productId } = Route.useParams();
  const q = useQuery({
    queryKey: ["product", productId],
    queryFn: () => productsApi.details(productId),
  });

  if (q.isLoading) return <LoadingState label="Loading product..." />;
  if (q.error) return <ErrorState message={(q.error as ApiError)?.message} onRetry={() => q.refetch()} />;
  const p = q.data!;
  const images = p.images || [];

  return (
    <div>
      <PageHeader
        title={p.product_name}
        description={p.one_liner || undefined}
        actions={
          <>
            <Button variant="outline" asChild><Link to="/products" search={() => ({})}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link></Button>
            <Button asChild><Link to="/products/$productId/edit" params={{ productId: String(p.id) }}><Pencil className="h-4 w-4 mr-1" /> Edit</Link></Button>
          </>
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">Gallery</h3>
            {images.length === 0 ? (
              <div className="text-sm text-muted-foreground">No images uploaded.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {images.map((img: any) => {
                  const url = resolveImageUrl(img.image_url || img.image || img.url);
                  return <img key={String(img.id)} src={url} alt="" className="aspect-square object-cover rounded-md border border-border" />;
                })}
              </div>
            )}
            {p.description && (
              <>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mt-6 mb-2">Description</h3>
                <p className="text-sm whitespace-pre-wrap">{p.description}</p>
              </>
            )}
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6 space-y-2 text-sm">
              <Row label="Brand" value={p.brand?.name} />
              <Row label="Category" value={p.category?.name} />
              <Row label="Purchase price" value={formatCurrency(p.purchase_price)} />
              <Row label="Sell price" value={formatCurrency(p.sell_price)} highlight />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h4 className="text-sm font-semibold mb-3">Offers</h4>
              {(p.offers && p.offers.length > 0) ? (
                <ul className="space-y-3">
                  {p.offers.map((o: any) => (
                    <li key={String(o.id)} className="text-sm border-l-2 border-primary pl-3">
                      <div className="font-medium">{typeof o.offer_category === "string" ? o.offer_category : o.offer_category?.name || "Offer"}</div>
                      <div className="text-emerald-600 font-semibold">{formatCurrency(o.offered_price)}</div>
                      <div className="text-xs text-muted-foreground">Expires {formatDate(o.offer_expires_at)}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-muted-foreground">No offers.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: any; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={highlight ? "font-semibold text-foreground" : "text-foreground"}>{value || "—"}</span>
    </div>
  );
}
