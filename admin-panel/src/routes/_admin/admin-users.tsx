import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Mail, Phone, Shield } from "lucide-react";
import { z } from "zod";
import { usersApi } from "@/lib/api/users";
import { ApiError } from "@/lib/api/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LoadingState, EmptyState } from "@/components/common/States";

export const Route = createFileRoute("/_admin/admin-users")({
  component: AdminUsersPage,
});

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "Min 6 characters"),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  role: z.string().optional().or(z.literal("")),
});

function AdminUsersPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-users"], queryFn: () => usersApi.list() });
  const [creating, setCreating] = useState(false);

  const users = Array.isArray(q.data) ? q.data : [];

  return (
    <div>
      <PageHeader
        title="Admin Users"
        description="Manage administrator accounts for PR TOOLS."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-1" /> New Admin
          </Button>
        }
      />

      {q.isLoading ? (
        <LoadingState />
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              title="No admin users to display"
              description="Add new administrators using the button above. (Listing requires a GET /users/all endpoint — wire it in src/lib/api/users.ts when available.)"
              action={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4 mr-1" /> New Admin</Button>}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((u: any) => {
            const initials =
              (u.name || u.email || "A")
                .split(/\s+|@/)
                .map((p: string) => p[0])
                .filter(Boolean)
                .slice(0, 2)
                .join("")
                .toUpperCase() || "A";
            return (
              <Card key={String(u.id)}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold">{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{u.name || "—"}</div>
                      <div className="text-xs text-muted-foreground capitalize">{u.role || "admin"}</div>
                    </div>
                  </div>
                  <div className="mt-4 space-y-1.5 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" /> {u.email}</div>
                    {u.phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" /> {u.phone}</div>}
                    <div className="flex items-center gap-2 text-muted-foreground"><Shield className="h-4 w-4" /> {u.role || "admin"}</div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <NewAdminDialog open={creating} onOpenChange={setCreating} onSaved={() => qc.invalidateQueries({ queryKey: ["admin-users"] })} />
    </div>
  );
}

function NewAdminDialog({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", role: "admin" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!open && (form.name || form.email || form.password)) {
    setTimeout(() => {
      setForm({ name: "", email: "", password: "", phone: "", role: "admin" });
      setErrors({});
    }, 200);
  }

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
      return usersApi.create({
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
        phone: parsed.data.phone || undefined,
        role: parsed.data.role || "admin",
      });
    },
    onSuccess: () => {
      toast.success("Admin user created");
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
          <DialogTitle>New admin user</DialogTitle>
          <DialogDescription>Create a new administrator account.</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); m.mutate(); }} className="space-y-4" noValidate>
          <div>
            <Label>Name *</Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} className="mt-1.5" />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
          </div>
          <div>
            <Label>Email *</Label>
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="mt-1.5" />
            {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
          </div>
          <div>
            <Label>Password *</Label>
            <Input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} className="mt-1.5" />
            {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Role</Label>
            <Input value={form.role} onChange={(e) => set("role", e.target.value)} className="mt-1.5" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={m.isPending}>Cancel</Button>
            <Button type="submit" disabled={m.isPending}>{m.isPending ? "Creating..." : "Create admin"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
