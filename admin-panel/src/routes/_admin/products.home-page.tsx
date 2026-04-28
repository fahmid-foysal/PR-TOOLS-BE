import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { productsApi } from "@/lib/api/products";
import { ApiError } from "@/lib/api/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/States";
import { resolveImageUrl, formatCurrency } from "@/lib/utils-format";

export const Route = createFileRoute("/_admin/products/home-page")({
  component: HomePageProducts,
});

function HomePageProducts() {
  const q = useQuery({ queryKey: ["home-page-products"], queryFn: () => productsApi.homePageProducts.list() });

  if (q.isLoading) return <LoadingState label="Loading home page..." />;
  if (q.error) return <ErrorState message={(q.error as ApiError)?.message} onRetry={() => q.refetch()} />;

  const sections: any[] = Array.isArray(q.data) ? q.data : (q.data as any)?.data || [];

  return (
    <div>
      <PageHeader title="Home Page Products" description="Products grouped by home page sections." />
      {sections.length === 0 ? (
        <EmptyState title="No home page sections populated" description="Place products in sections from the product edit page." />
      ) : (
        <div className="space-y-6">
          {sections.map((sec) => {
            const items = sec.products || sec.items || [];
            return (
              <div key={String(sec.id)}>
                <div className="mb-3">
                  <h2 className="text-lg font-semibold">{sec.title || sec.name}</h2>
                  {sec.one_liner && <p className="text-sm text-muted-foreground">{sec.one_liner}</p>}
                </div>
                {items.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No products in this section.</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {items.map((it: any) => {
                      const p = it.product || it;
                      const img = resolveImageUrl(p?.images?.[0]?.image_url || p?.images?.[0]?.image || p?.image);
                      return (
                        <Card key={String(it.id)}>
                          <CardContent className="p-3">
                            {img ? (
                              <img src={img} alt={p?.product_name} className="aspect-square w-full object-cover rounded mb-2" />
                            ) : (
                              <div className="aspect-square w-full bg-muted rounded mb-2" />
                            )}
                            <div className="text-sm font-medium line-clamp-1">{p?.product_name || "Product"}</div>
                            <div className="text-sm font-semibold">{formatCurrency(p?.sell_price)}</div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
