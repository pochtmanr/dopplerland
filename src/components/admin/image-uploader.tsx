"use client";

import { useState, useRef } from "react";
import Image from "next/image";

interface ImageUploaderProps {
  currentUrl: string | null;
  onUpload: (url: string) => void;
}

export function ImageUploader({ currentUrl, onUpload }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    // Preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Upload failed");
        setPreview(currentUrl);
        return;
      }

      setPreview(data.url);
      onUpload(data.url);
    } catch {
      setError("Upload failed. Please try again.");
      setPreview(currentUrl);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-text-muted">
        Featured Image
      </label>

      {preview ? (
        <div className="relative aspect-[21/9] rounded-lg overflow-hidden border border-overlay/10">
          <Image
            src={preview}
            alt="Preview"
            fill
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-3 py-1.5 bg-overlay/20 backdrop-blur-sm rounded-lg text-sm text-white hover:bg-overlay/30 transition-colors"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                onUpload("");
              }}
              className="px-3 py-1.5 bg-red-500/20 backdrop-blur-sm rounded-lg text-sm text-white hover:bg-red-500/30 transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full aspect-[21/9] rounded-lg border-2 border-dashed border-overlay/20 hover:border-overlay/40 transition-colors flex flex-col items-center justify-center gap-2 text-text-muted cursor-pointer"
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
          </svg>
          <span className="text-sm">
            {uploading ? "Uploading..." : "Click to upload image"}
          </span>
          <span className="text-xs">JPEG, PNG, WebP, AVIF — max 5MB</span>
        </button>
      )}

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
}
