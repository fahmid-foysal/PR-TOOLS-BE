import { useRef, useState, useEffect } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveImageUrl } from "@/lib/utils-format";

export function ImageInput({
  value,
  onChange,
  existingUrl,
  label = "Image",
  accept = "image/*",
}: {
  value: File | null;
  onChange: (file: File | null) => void;
  existingUrl?: string | null;
  label?: string;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const shown = preview || (existingUrl ? resolveImageUrl(existingUrl) : null);

  return (
    <div>
      <div className="text-sm font-medium mb-2">{label}</div>
      {shown ? (
        <div className="relative inline-block">
          <img src={shown} alt="preview" className="h-32 w-32 object-cover rounded-md border border-border" />
          <button
            type="button"
            onClick={() => {
              onChange(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full h-6 w-6 flex items-center justify-center"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="h-32 w-32 rounded-md border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          <Upload className="h-5 w-5 mb-1" />
          <span className="text-xs">Click to upload</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      {shown && (
        <div className="mt-2">
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            Replace image
          </Button>
        </div>
      )}
    </div>
  );
}

export function MultiImageInput({
  files,
  onChange,
  label = "Images",
}: {
  files: File[];
  onChange: (files: File[]) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previews = files.map((f) => ({ file: f, url: URL.createObjectURL(f) }));

  useEffect(() => {
    return () => previews.forEach((p) => URL.revokeObjectURL(p.url));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files.length]);

  return (
    <div>
      <div className="text-sm font-medium mb-2">{label}</div>
      <div className="flex flex-wrap gap-3">
        {previews.map((p, i) => (
          <div key={i} className="relative">
            <img src={p.url} alt="preview" className="h-24 w-24 object-cover rounded-md border border-border" />
            <button
              type="button"
              onClick={() => onChange(files.filter((_, idx) => idx !== i))}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full h-5 w-5 flex items-center justify-center"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="h-24 w-24 rounded-md border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          <Upload className="h-5 w-5 mb-1" />
          <span className="text-xs">Add</span>
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const list = Array.from(e.target.files || []);
          onChange([...files, ...list]);
          if (inputRef.current) inputRef.current.value = "";
        }}
      />
    </div>
  );
}
