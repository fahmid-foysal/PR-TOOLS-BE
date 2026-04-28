import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Filter, Eye, Pencil, RefreshCw } from "lucide-react";
import { productsApi, type Product } from "@/lib/api/products";
import { configApi } from "@/lib/api/configuration";
import { ApiError } from "@/lib/api/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableSkeleton, EmptyState, ErrorState } from "@/components/common/States";
import { Pagination } from "@/components/common/Pagination";
import { formatCurrency, formatDate, resolveImageUrl } from "@/lib/utils-format";
import { PAGE_SIZE } from "@/lib/constants";

type Search = {
  page?: number;
  search_query?: string;
  brand_id?: string;
  category_id?: string;
  offer_category_id?: string;
};

export const Route = createFileRoute("/_admin/products/")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    page: s.page ? Number(s.page) : undefined,
    search_query: typeof s.search_query === "string" ? s.search_query : undefined,
    brand_id: typeof s.brand_id === "string" ? s.brand_id : undefined,
    category_id: typeof s.category_id === "string" ? s.category_id : undefined,
    offer_category_id: typeof s.offer_category_id === "string" ? s.offer_category_id : undefined,
  }),
  component: ProductsListPage,
});

function ProductsListPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const page = search.page ?? 1;
  const [searchInput, setSearchInput] = useState(search.search_query || "");

  const brandsQ = useQuery({ queryKey: ["brands"], queryFn: () => configApi.brands.list() });
  const categoriesQ = useQuery({ queryKey: ["categories"], queryFn: () => configApi.categories.list() });
  const offerCatsQ = useQuery({ queryKey: ["offer-categories"], queryFn: () => configApi.offerCategories.list() });

  const productsQ = useQuery({
    queryKey: ["products", search],
    queryFn: () =>
      productsApi.list({
        page,
        limit: PAGE_SIZE,
        search_query: search.search_query,
        brand_id: search.brand_id,
        category_id: search.category_id,
        offer_category_id: search.offer_category_id,
      }),
  });

  const raw: any = productsQ.data;
  const items: Product[] = Array.isArray(raw) ? raw : raw?.data || [];
  const total: number | undefined = raw?.total ?? raw?.count;
  const totalPages: number = raw?.total_pages ?? (total ? Math.ceil(total / PAGE_SIZE) : items.length < PAGE_SIZE ? page : page + 1);

  const setParams = (next: Partial<Search>) => {
    navigate({ to: "/products", search: (prev: Search) => ({ ...prev, ...next, page: 1 }) as Search });
  };

  const goPage = (p: number) => navigate({ to: "/products", search: (prev: Search) => ({ ...prev, page: p }) as Search });

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setParams({ search_query: searchInput || undefined });
  };

  const clearFilters = () => {
    setSearchInput("");
    navigate({ to: "/products", search: {} as Search });
  };

  const brands = (Array.isArray(brandsQ.data) ? brandsQ.data : (brandsQ.data as any)?.data) || [];
  const categories = (Array.isArray(categoriesQ.data) ? categoriesQ.data : (categoriesQ.data as any)?.data) || [];
  const offerCats = (Array.isArray(offerCatsQ.data) ? offerCatsQ.data : (offerCatsQ.data as any)?.data) || [];

  const ALL = "__all__";

  return (
    <div>
      <PageHeader
        title="Products"
        description="Browse and manage your product catalog."
        actions={
          <>
            <Button variant="outline" onClick={() => productsQ.refetch()}>
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
            <Button asChild>
              <Link to="/products/new"><Plus className="h-4 w-4 mr-1" /> New Product</Link>
            </Button>
          </>
        }
      />

      <Card className="mb-4">
        <div className="p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
          <form onSubmit={onSearch} className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
          </form>
          
          {/* Brand Filter */}
          <Select
            value={search.brand_id ?? ALL}
            onValueChange={(v) => setParams({ brand_id: v === ALL ? undefined : v })}
          >
            <SelectTrigger><SelectValue placeholder="Brand" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All brands</SelectItem>
              {brands.map((b: any) => (
                <SelectItem key={b.id} value={String(b.id)}>
                  {b.brand_name} {/* Fixed */}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Category Filter */}
          <Select
            value={search.category_id ?? ALL}
            onValueChange={(v) => setParams({ category_id: v === ALL ? undefined : v })}
          >
            <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All categories</SelectItem>
              {categories.map((c: any) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.category_name} {/* Fixed */}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Offer Filter */}
          <Select
            value={search.offer_category_id ?? ALL}
            onValueChange={(v) => setParams({ offer_category_id: v === ALL ? undefined : v })}
          >
            <SelectTrigger><SelectValue placeholder="Offer category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All offer categories</SelectItem>
              {offerCats.map((o: any) => (
                <SelectItem key={o.id} value={String(o.id)}>
                  {o.offer_category_name} {/* Fixed */}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {(search.search_query || search.brand_id || search.category_id || search.offer_category_id) && (
          <div className="px-4 pb-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            <span>Filters active</span>
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={clearFilters}>Clear</Button>
          </div>
        )}
      </Card>

      <Card>
        {productsQ.isLoading ? (
          <TableSkeleton cols={6} />
        ) : productsQ.error ? (
          <ErrorState message={(productsQ.error as ApiError)?.message} onRetry={() => productsQ.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState
            title="No products found"
            description="Try adjusting filters or create a new product."
            action={<Button asChild><Link to="/products/new"><Plus className="h-4 w-4 mr-1" /> New Product</Link></Button>}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16"></TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="hidden md:table-cell">Brand</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead className="text-right">Sell price</TableHead>
                    <TableHead className="hidden lg:table-cell">Offer</TableHead>
                    <TableHead className="w-32 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((p) => {
                    const img = resolveImageUrl((p.images?.[0] as any)?.image_url || (p.images?.[0] as any)?.image || (p.images?.[0] as any)?.url);
                    
                    // Fixed: Access the correct field names within the joined objects
                    const brandName = p.brand?.brand_name || (p as any).brand_name;
                    const catName = p.category?.category_name || (p as any).category_name;
                    const offerCatName = typeof p.offer_category === "string" 
                      ? p.offer_category 
                      : (p.offer_category as any)?.offer_category_name;

                    return (
                      <TableRow key={String(p.id)}>
                        <TableCell>
                          {img ? (
                            <img src={img} alt={p.product_name} className="h-10 w-10 rounded object-cover border border-border" />
                          ) : (
                            <div className="h-10 w-10 rounded bg-muted" />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{p.product_name}</div>
                          {p.one_liner && <div className="text-xs text-muted-foreground line-clamp-1">{p.one_liner}</div>}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {brandName || "—"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {catName || "—"}
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(p.sell_price)}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {p.offered_price != null ? (
                            <div className="text-xs">
                              <div className="font-semibold text-emerald-600">{formatCurrency(p.offered_price)}</div>
                              <div className="text-muted-foreground">{offerCatName || "—"} · exp {formatDate(p.offer_expires_at)}</div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" asChild>
                            <Link to="/products/$productId" params={{ productId: String(p.id) }}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild>
                            <Link to="/products/$productId/edit" params={{ productId: String(p.id) }}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              onChange={goPage}
            />
          </>
        )}
      </Card>
    </div>
  );
}