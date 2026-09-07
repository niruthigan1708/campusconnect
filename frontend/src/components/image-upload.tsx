"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toAssetUrl } from "@/lib/api";
import { ImagePlus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export function ImageUpload({
  currentUrl,
  onUpload,
  label = "Upload image",
  shape = "square",
}: {
  currentUrl?: string | null;
  onUpload: (file: File) => Promise<void>;
  label?: string;
  shape?: "square" | "banner";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const displayUrl = previewUrl ?? toAssetUrl(currentUrl);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Only JPEG, PNG, or WEBP images are allowed.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error("Image must be 5MB or smaller.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setIsUploading(true);
    try {
      await onUpload(file);
      toast.success("Image uploaded.");
    } catch {
      toast.error("Couldn't upload the image.");
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      URL.revokeObjectURL(objectUrl);
    }
  }

  const frameClass =
    shape === "square"
      ? "h-24 w-24 rounded-xl"
      : "h-32 w-full rounded-xl sm:h-40";

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden border border-dashed border-border/70 bg-muted/40",
          frameClass
        )}
      >
        {displayUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={displayUrl} alt={label} className="h-full w-full object-cover" />
        ) : (
          <ImagePlus className="h-6 w-6 text-muted-foreground" />
        )}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
      >
        {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
        {displayUrl ? "Change image" : label}
      </Button>
    </div>
  );
}
