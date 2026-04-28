import { cn } from "@/lib/utils";
import { STATUS_BADGE } from "@/lib/constants";

export function StatusBadge({ status }: { status?: string | null }) {
  if (!status) return <span className="text-muted-foreground text-xs">—</span>;
  const cls = STATUS_BADGE[status.toLowerCase()] || "bg-muted text-foreground border-border";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        cls,
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
