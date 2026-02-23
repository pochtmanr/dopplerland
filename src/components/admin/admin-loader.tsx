"use client";

export function AdminLoader({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-overlay/20 border-t-accent-teal rounded-full animate-spin" />
      {label && (
        <p className="mt-4 text-sm text-text-muted">{label}</p>
      )}
    </div>
  );
}
