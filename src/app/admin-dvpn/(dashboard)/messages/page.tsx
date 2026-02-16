"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Message {
  id: string;
  telegram_user_id: number;
  username: string | null;
  first_name: string | null;
  direction: string;
  content: string;
  template_key: string | null;
  created_at: string;
  bot_source: string | null;
  metadata: Record<string, unknown> | null;
}

const filters = [
  { key: "all", label: "All" },
  { key: "main", label: "Main Bot" },
  { key: "support", label: "Support Bot" },
  { key: "escalations", label: "Escalations" },
];

export default function MessagesPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "50", filter });
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/messages?${params}`);
    const data = await res.json();
    setMessages(data.messages || []);
    setTotalPages(data.totalPages || 1);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, filter, search]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    setPage(1);
  }, [filter, search]);

  function formatTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  }

  function truncate(s: string, max = 100) {
    if (!s) return "—";
    return s.length > max ? s.slice(0, max) + "…" : s;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Messages</h1>
        <span className="text-sm text-text-muted">{total.toLocaleString()} total</span>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors cursor-pointer ${
                filter === f.key
                  ? "bg-accent-teal/20 text-accent-teal"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search username or content..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-teal/50"
        />
      </div>

      {/* Table */}
      <div className="border border-white/10 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-text-muted text-left">
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Dir</th>
              <th className="px-4 py-3 font-medium">Content</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Template</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-text-muted">Loading…</td>
              </tr>
            ) : messages.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-text-muted">No messages found</td>
              </tr>
            ) : (
              messages.map((m) => (
                <tr
                  key={m.id}
                  onClick={() => router.push(`/admin-dvpn/messages/${m.telegram_user_id}`)}
                  className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-text-muted whitespace-nowrap">{formatTime(m.created_at)}</td>
                  <td className="px-4 py-3 text-text-primary">
                    {m.username ? `@${m.username}` : m.first_name || String(m.telegram_user_id)}
                  </td>
                  <td className="px-4 py-3">
                    {m.direction === "in" ? (
                      <span className="text-blue-400" title="Incoming">↙</span>
                    ) : (
                      <span className="text-green-400" title="Outgoing">↗</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-muted max-w-md">{truncate(m.content)}</td>
                  <td className="px-4 py-3">
                    {m.bot_source && (
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        m.bot_source === "support"
                          ? "bg-orange-500/20 text-orange-400"
                          : "bg-accent-teal/20 text-accent-teal"
                      }`}>
                        {m.bot_source}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-muted text-xs font-mono">{m.template_key || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-text-muted">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-white/10 rounded-lg text-text-muted hover:text-text-primary disabled:opacity-30 cursor-pointer disabled:cursor-default"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm border border-white/10 rounded-lg text-text-muted hover:text-text-primary disabled:opacity-30 cursor-pointer disabled:cursor-default"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
