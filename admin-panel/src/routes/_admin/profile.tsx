import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Phone, Shield } from "lucide-react";

export const Route = createFileRoute("/_admin/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const initials =
    (user?.name || user?.email || "A")
      .split(/\s+|@/)
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "A";

  return (
    <div>
      <PageHeader title="My Profile" description="Your administrator account details." />
      <Card className="max-w-2xl">
        <CardContent className="p-6 flex flex-col sm:flex-row gap-6 items-start">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-3">
            <div>
              <div className="text-xl font-semibold">{user?.name || "Administrator"}</div>
              <div className="text-sm text-muted-foreground capitalize">{user?.role || "admin"}</div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {user?.email || "—"}</div>
              {user?.phone && (
                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {user.phone}</div>
              )}
              <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-muted-foreground" /> Role: {user?.role || "admin"}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
