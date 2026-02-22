"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Escalation {
  id: string;
  telegram_user_id: number;
  username: string | null;
  first_name: string | null;
  content: string;
  created_at: string;
  device: string | null;
  issue: string | null;
  account_code: string | null;
  metadata: Record<string, unknown> | null;
}

export default function MessagesPage() {
  const router = useRouter();
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchEscalations = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "50" });
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/messages?${params}`);
    const data = await res.json();
    setEscalations(data.messages || []);
    setTotalPages(data.totalPages || 1);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    fetchEscalations();
  }, [fetchEscalations]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  function formatTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  }

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Support Escalations</h1>
          <p className="text-sm text-text-muted mt-1">Users who requested human support</p>
        </div>
        <span className="text-sm text-text-muted">{total} escalation{total !== 1 ? "s" : ""}</span>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by username or content..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-3 py-2 text-sm bg-overlay/5 border border-overlay/10 rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-teal/50"
        />
      </div>

      {/* Escalation cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-text-muted">Loading…</div>
        ) : escalations.length === 0 ? (
          <div className="text-center py-12 text-text-muted">
            <div className="text-4xl mb-2">✅</div>
            <p>No support escalations</p>
            <p className="text-xs mt-1">When users request human support, they&apos;ll appear here</p>
          </div>
        ) : (
          escalations.map((e) => (
            <div
              key={e.id}
              onClick={() => router.push(`/admin-dvpn/messages/${e.telegram_user_id}`)}
              className="border border-overlay/10 rounded-lg p-4 hover:bg-overlay/5 cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 text-lg">
                    🔔
                  </div>
                  <div>
                    <div className="font-medium text-text-primary">
                      {e.first_name || "Unknown"}{" "}
                      {e.username && <span className="text-text-muted font-normal">@{e.username}</span>}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {e.issue && (
                        <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400">
                          🔧 {e.issue}
                        </span>
                      )}
                      {e.device && (
                        <span className="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400">
                          📱 {e.device}
                        </span>
                      )}
                      {e.account_code && (
                        <span className="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400 font-mono">
                          🔑 {e.account_code}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-text-muted">{formatTime(e.created_at)}</div>
                  <div className="text-xs text-orange-400 mt-0.5">{timeAgo(e.created_at)}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-text-muted">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-overlay/10 rounded-lg text-text-muted hover:text-text-primary disabled:opacity-30 cursor-pointer disabled:cursor-default"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm border border-overlay/10 rounded-lg text-text-muted hover:text-text-primary disabled:opacity-30 cursor-pointer disabled:cursor-default"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
