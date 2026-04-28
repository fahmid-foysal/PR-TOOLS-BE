import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  totalPages,
  onChange,
  total,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
  total?: number;
}) {
  if (totalPages <= 1 && !total) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
      <div className="text-xs text-muted-foreground">
        {total !== undefined ? `${total} total · ` : ""}Page {page} of {Math.max(totalPages, 1)}
      </div>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          <ChevronLeft className="h-4 w-4" /> Prev
        </Button>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
