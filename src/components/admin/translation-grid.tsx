"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TranslationEditor } from "./translation-editor";

const ALL_LOCALES = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "he", name: "Hebrew", flag: "🇮🇱" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "pt", name: "Portuguese", flag: "🇧🇷" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "fa", name: "Farsi", flag: "🇮🇷" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "id", name: "Indonesian", flag: "🇮🇩" },
  { code: "tr", name: "Turkish", flag: "🇹🇷" },
  { code: "vi", name: "Vietnamese", flag: "🇻🇳" },
  { code: "th", name: "Thai", flag: "🇹🇭" },
  { code: "ms", name: "Malay", flag: "🇲🇾" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "tl", name: "Filipino", flag: "🇵🇭" },
  { code: "ur", name: "Urdu", flag: "🇵🇰" },
  { code: "sw", name: "Swahili", flag: "🇰🇪" },
];

interface Translation {
  locale: string;
  title: string;
  excerpt: string;
  content: string;
  image_alt: string | null;
  meta_title: string | null;
  meta_description: string | null;
  og_title: string | null;
  og_description: string | null;
  updated_at: string;
}

interface TranslationGridProps {
  postId: string;
  translations: Translation[];
}

export function TranslationGrid({
  postId,
  translations,
}: TranslationGridProps) {
  const router = useRouter();
  const [translating, setTranslating] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const translationMap = new Map(translations.map((t) => [t.locale, t]));

  async function handleTranslate(locale: string) {
    setTranslating(locale);
    setError(null);

    try {
      const res = await fetch("/api/admin/ai/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId, locale }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(`${locale}: ${data.error}`);
        return;
      }

      router.refresh();
    } catch {
      setError(`Failed to translate to ${locale}`);
    } finally {
      setTranslating(null);
    }
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHrs < 1) return "Just now";
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  // If editing a specific locale, show the editor
  if (editing) {
    const existing = translationMap.get(editing);
    return (
      <TranslationEditor
        postId={postId}
        locale={editing}
        localeName={
          ALL_LOCALES.find((l) => l.code === editing)?.name || editing
        }
        initial={existing || null}
        onClose={() => {
          setEditing(null);
          router.refresh();
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="bg-bg-secondary border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left px-6 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
                Language
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
                Title Preview
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
                Updated
              </th>
              <th className="text-right px-6 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {ALL_LOCALES.map((loc) => {
              const trans = translationMap.get(loc.code);
              const isSource = loc.code === "en";
              const hasTranslation = !!trans;
              const isTranslating = translating === loc.code;

              return (
                <tr
                  key={loc.code}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{loc.flag}</span>
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {loc.name}
                        </p>
                        <p className="text-xs text-text-muted">{loc.code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {isSource ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        Source
                      </span>
                    ) : hasTranslation ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                        Done
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                        Missing
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-text-muted max-w-xs truncate">
                    {trans?.title || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-text-muted">
                    {trans ? formatDate(trans.updated_at) : "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isSource ? (
                        <span className="text-xs text-text-muted">
                          Edit in post
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => handleTranslate(loc.code)}
                            disabled={isTranslating || translating !== null}
                            className="text-sm text-accent-teal hover:text-accent-teal-light transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {isTranslating
                              ? "Translating..."
                              : hasTranslation
                                ? "Re-translate"
                                : "Translate"}
                          </button>
                          {hasTranslation && (
                            <button
                              onClick={() => setEditing(loc.code)}
                              className="text-sm text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                            >
                              Edit
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
