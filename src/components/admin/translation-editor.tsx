"use client";

import { useState } from "react";

interface TranslationEditorProps {
  postId: string;
  locale: string;
  localeName: string;
  initial: {
    title: string;
    excerpt: string;
    content: string;
    image_alt: string | null;
    meta_title: string | null;
    meta_description: string | null;
    og_title: string | null;
    og_description: string | null;
  } | null;
  onClose: () => void;
}

export function TranslationEditor({
  postId,
  locale,
  localeName,
  initial,
  onClose,
}: TranslationEditorProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    title: initial?.title || "",
    excerpt: initial?.excerpt || "",
    content: initial?.content || "",
    image_alt: initial?.image_alt || "",
    meta_title: initial?.meta_title || "",
    meta_description: initial?.meta_description || "",
    og_title: initial?.og_title || "",
    og_description: initial?.og_description || "",
  });

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/translations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: postId,
          locale,
          ...form,
          image_alt: form.image_alt || null,
          meta_title: form.meta_title || null,
          meta_description: form.meta_description || null,
          og_title: form.og_title || null,
          og_description: form.og_description || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save");
        return;
      }

      setSaved(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Edit {localeName} ({locale}) Translation
        </h2>
        <button
          onClick={onClose}
          className="text-sm text-text-muted hover:text-text-primary transition-colors cursor-pointer"
        >
          Back to grid
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {saved && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-sm text-green-400">
          Translation saved successfully.
        </div>
      )}

      {/* Title */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-text-muted">
          Title
        </label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => updateField("title", e.target.value)}
          className="w-full bg-bg-secondary border border-white/10 rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:border-accent-teal transition-colors"
        />
      </div>

      {/* Excerpt */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-text-muted">
          Excerpt
        </label>
        <textarea
          value={form.excerpt}
          onChange={(e) => updateField("excerpt", e.target.value)}
          rows={3}
          className="w-full bg-bg-secondary border border-white/10 rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:border-accent-teal transition-colors resize-y"
        />
      </div>

      {/* Content */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-text-muted">
          Content (Markdown)
        </label>
        <textarea
          value={form.content}
          onChange={(e) => updateField("content", e.target.value)}
          rows={16}
          className="w-full bg-bg-secondary border border-white/10 rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:border-accent-teal transition-colors resize-y font-mono text-sm"
        />
      </div>

      {/* Image Alt */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-text-muted">
          Image Alt Text
        </label>
        <input
          type="text"
          value={form.image_alt}
          onChange={(e) => updateField("image_alt", e.target.value)}
          className="w-full bg-bg-secondary border border-white/10 rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:border-accent-teal transition-colors"
        />
      </div>

      {/* SEO Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-xs text-text-muted">Meta Title</label>
          <input
            type="text"
            value={form.meta_title}
            onChange={(e) => updateField("meta_title", e.target.value)}
            maxLength={70}
            className="w-full bg-bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-teal"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-xs text-text-muted">OG Title</label>
          <input
            type="text"
            value={form.og_title}
            onChange={(e) => updateField("og_title", e.target.value)}
            maxLength={70}
            className="w-full bg-bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-teal"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-xs text-text-muted">
            Meta Description
          </label>
          <textarea
            value={form.meta_description}
            onChange={(e) => updateField("meta_description", e.target.value)}
            maxLength={160}
            rows={2}
            className="w-full bg-bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-teal resize-none"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-xs text-text-muted">
            OG Description
          </label>
          <textarea
            value={form.og_description}
            onChange={(e) => updateField("og_description", e.target.value)}
            maxLength={200}
            rows={2}
            className="w-full bg-bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-teal resize-none"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
        <button
          onClick={onClose}
          className="px-4 py-2.5 text-sm text-text-muted hover:text-text-primary transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-accent-teal text-white rounded-lg text-sm font-medium hover:bg-accent-teal-light transition-colors disabled:opacity-50 cursor-pointer"
        >
          {saving ? "Saving..." : "Save Translation"}
        </button>
      </div>
    </div>
  );
}
