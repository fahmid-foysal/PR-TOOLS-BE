import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Filter, RefreshCw, Eye, Download } from "lucide-react";
import { ordersApi, type Order } from "@/lib/api/orders";
import { ApiError } from "@/lib/api/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { TableSkeleton, EmptyState, ErrorState } from "@/components/common/States";
import { Pagination } from "@/components/common/Pagination";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatCurrency, formatDateTime } from "@/lib/utils-format";
import { ORDER_STATUSES, PAGE_SIZE } from "@/lib/constants";

type Search = {
  page?: number;
  status?: string;
  search_query?: string;
  from_date?: string;
  to_date?: string;
};

export const Route = createFileRoute("/_admin/orders")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    page: s.page ? Number(s.page) : undefined,
    status: typeof s.status === "string" ? s.status : undefined,
    search_query: typeof s.search_query === "string" ? s.search_query : undefined,
    from_date: typeof s.from_date === "string" ? s.from_date : undefined,
    to_date: typeof s.to_date === "string" ? s.to_date : undefined,
  }),
  component: OrdersPage,
});

const ALL = "__all__";

function OrdersPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const page = search.page ?? 1;
  const [searchInput, setSearchInput] = useState(search.search_query || "");
  const [openOrder, setOpenOrder] = useState<Order | null>(null);

  const q = useQuery({
    queryKey: ["orders", search],
    queryFn: () =>
      ordersApi.list({
        page,
        limit: PAGE_SIZE,
        status: search.status,
        search_query: search.search_query,
        from_date: search.from_date,
        to_date: search.to_date,
      }),
  });

  const raw: any = q.data;
  const orders: Order[] = Array.isArray(raw) ? raw : raw?.data || raw?.orders || [];
  const total: number | undefined = raw?.total ?? raw?.count;
  const totalPages: number = raw?.total_pages ?? (total ? Math.ceil(total / PAGE_SIZE) : orders.length < PAGE_SIZE ? page : page + 1);

  const setParams = (next: Partial<Search>) => {
    navigate({ to: "/orders", search: (prev: Search) => ({ ...prev, ...next, page: 1 }) as Search });
  };

  const goPage = (p: number) =>
    navigate({ to: "/orders", search: (prev: Search) => ({ ...prev, page: p }) as Search });

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setParams({ search_query: searchInput || undefined });
  };

  const clear = () => {
    setSearchInput("");
    navigate({ to: "/orders", search: {} as Search });
  };

  return (
    <div>
      <PageHeader
        title="Orders"
        description="Track, fulfil and update customer orders."
        actions={
          <>
            <Button variant="outline" onClick={() => q.refetch()}>
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
            <Button variant="outline" disabled title="Export coming soon">
              <Download className="h-4 w-4 mr-1" /> Export
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
                placeholder="Search by order #, name, phone..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
          </form>
          <Select value={search.status ?? ALL} onValueChange={(v) => setParams({ status: v === ALL ? undefined : v })}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              {ORDER_STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="date" value={search.from_date || ""} onChange={(e) => setParams({ from_date: e.target.value || undefined })} />
          <Input type="date" value={search.to_date || ""} onChange={(e) => setParams({ to_date: e.target.value || undefined })} />
        </div>
        {(search.search_query || search.status || search.from_date || search.to_date) && (
          <div className="px-4 pb-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" /> Filters active
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={clear}>Clear filters</Button>
          </div>
        )}
      </Card>

      <Card>
        {q.isLoading ? (
          <TableSkeleton cols={6} />
        ) : q.error ? (
          <ErrorState message={(q.error as ApiError)?.message} onRetry={() => q.refetch()} />
        ) : orders.length === 0 ? (
          <EmptyState title="No orders found" description="Try adjusting filters or wait for new orders." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="hidden md:table-cell">Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Placed</TableHead>
                    <TableHead className="w-16 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => (
                    <TableRow key={String(o.id)} className="cursor-pointer hover:bg-accent/30" onClick={() => setOpenOrder(o)}>
                      <TableCell className="font-medium">#{o.order_number || o.id}</TableCell>
                      <TableCell>
                        <div className="text-sm">{o.customer_name || "—"}</div>
                        {o.customer_phone && <div className="text-xs text-muted-foreground">{o.customer_phone}</div>}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{o.items?.length ?? "—"}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(o.total_amount)}</TableCell>
                      <TableCell><StatusBadge status={o.status} /></TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground text-xs">{formatDateTime(o.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setOpenOrder(o); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Pagination page={page} totalPages={totalPages} total={total} onChange={goPage} />
          </>
        )}
      </Card>

      <OrderDetailsDrawer order={openOrder} onClose={() => setOpenOrder(null)} />
    </div>
  );
}

function OrderDetailsDrawer({ order, onClose }: { order: Order | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [confirming, setConfirming] = useState(false);

  // hydrate when order changes
  if (order && status === "" && order.status) {
    setStatus(order.status);
    setNotes(order.admin_notes || "");
  }
  if (!order && (status || notes)) {
    setTimeout(() => {
      setStatus("");
      setNotes("");
      setConfirming(false);
    }, 200);
  }

  const m = useMutation({
    mutationFn: () => ordersApi.updateStatus(order!.id, { status, admin_notes: notes || undefined }),
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["orders"] });
      setConfirming(false);
      onClose();
    },
    onError: (e: any) => toast.error(e?.message || "Update failed"),
  });

  return (
    <Sheet open={!!order} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        {order && (
          <>
            <SheetHeader>
              <SheetTitle>Order #{order.order_number || order.id}</SheetTitle>
              <SheetDescription>Placed {formatDateTime(order.created_at)}</SheetDescription>
            </SheetHeader>
            <div className="py-4 space-y-6">
              <section>
                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Customer</h4>
                <div className="text-sm space-y-1">
                  <div>{order.customer_name || "—"}</div>
                  <div className="text-muted-foreground">{order.customer_phone}</div>
                  <div className="text-muted-foreground">{order.customer_email}</div>
                  {order.delivery_address && <div className="text-muted-foreground whitespace-pre-wrap">{order.delivery_address}</div>}
                </div>
              </section>

              <section>
                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Payment</h4>
                <div className="text-sm space-y-1">
                  <div>Method: {order.payment_method || "—"}</div>
                  <div>Status: <StatusBadge status={order.payment_status} /></div>
                  <div>Total: <span className="font-semibold">{formatCurrency(order.total_amount)}</span></div>
                </div>
              </section>

              <section>
                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Items</h4>
                {order.items && order.items.length > 0 ? (
                  <div className="border border-border rounded-md divide-y divide-border">
                    {order.items.map((it) => (
                      <div key={String(it.id)} className="p-3 flex items-center justify-between text-sm">
                        <div>
                          <div className="font-medium">{it.product_name || it.product?.product_name || it.product?.name || "Item"}</div>
                          <div className="text-xs text-muted-foreground">Qty {it.quantity} × {formatCurrency(it.rate ?? it.price)}</div>
                        </div>
                        <div className="font-medium">{formatCurrency(it.total ?? (Number(it.quantity || 0) * Number(it.rate || it.price || 0)))}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No items.</div>
                )}
              </section>

              <section className="border-t border-border pt-4">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Update status</h4>
                <div className="space-y-2">
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUSES.map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Admin notes (optional)"
                    className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                  {!confirming ? (
                    <Button className="w-full" onClick={() => setConfirming(true)} disabled={!status || status === order.status && notes === (order.admin_notes || "")}>
                      Update status
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => setConfirming(false)} disabled={m.isPending}>Cancel</Button>
                      <Button className="flex-1" onClick={() => m.mutate()} disabled={m.isPending}>
                        {m.isPending ? "Updating..." : "Confirm update"}
                      </Button>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
