"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AdminLoader } from "@/components/admin/admin-loader";

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
  support_status: string;
  metadata: Record<string, unknown> | null;
}

const STATUSES = [
  { value: "new", label: "New", color: "text-blue-400 border-blue-500/40" },
  { value: "in_progress", label: "In Progress", color: "text-yellow-400 border-yellow-500/40" },
  { value: "solved", label: "Solved", color: "text-green-400 border-green-500/40" },
  { value: "refunded", label: "Refunded", color: "text-purple-400 border-purple-500/40" },
  { value: "spam", label: "Spam", color: "text-orange-400 border-orange-500/40" },
  { value: "banned", label: "Banned", color: "text-red-400 border-red-500/40" },
];

function getStatusObj(value: string) {
  return STATUSES.find((s) => s.value === value) || STATUSES[0];
}

export default function MessagesPage() {
  const router = useRouter();
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [openStatusMenu, setOpenStatusMenu] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

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

  async function handleStatusChange(telegramUserId: number, newStatus: string) {
    setOpenStatusMenu(null);
    const res = await fetch(`/api/admin/messages/${telegramUserId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setEscalations((prev) =>
        prev.map((e) =>
          e.telegram_user_id === telegramUserId
            ? { ...e, support_status: newStatus }
            : e
        )
      );
    }
  }

  async function handleDelete(telegramUserId: number) {
    setConfirmDelete(null);
    const res = await fetch(`/api/admin/messages/${telegramUserId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setEscalations((prev) =>
        prev.filter((e) => e.telegram_user_id !== telegramUserId)
      );
      setTotal((t) => t - 1);
    }
  }

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Support Escalations</h1>
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
          className="w-full sm:max-w-md px-3 py-2 text-sm bg-overlay/5 border border-overlay/10 rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-teal/50"
        />
      </div>

      {/* Escalation cards */}
      <div className="space-y-3">
        {loading ? (
          <AdminLoader />
        ) : escalations.length === 0 ? (
          <div className="text-center py-12 text-text-muted">
            <div className="text-4xl mb-2">&#x2705;</div>
            <p>No support escalations</p>
            <p className="text-xs mt-1">When users request human support, they&apos;ll appear here</p>
          </div>
        ) : (
          escalations.map((e) => {
            const status = getStatusObj(e.support_status);
            return (
              <div
                key={e.id}
                className="border border-overlay/10 rounded-lg p-4 hover:bg-overlay/5 transition-colors"
              >
                {/* Mobile layout: stacked */}
                <div className="sm:hidden space-y-3">
                  {/* Top: user info — clickable */}
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => router.push(`/admin-dvpn/messages/${e.telegram_user_id}`)}
                  >
                    <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 text-lg shrink-0">
                      &#x1F514;
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-text-primary truncate">
                        {e.first_name || "Unknown"}{" "}
                        {e.username && <span className="text-text-muted font-normal">@{e.username}</span>}
                      </div>
                      <div className="text-xs text-text-muted mt-0.5">
                        {formatTime(e.created_at)} &middot; {timeAgo(e.created_at)}
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {e.issue && (
                      <span className="px-2 py-0.5 rounded-lg text-xs border border-red-500/40 text-red-400">
                        &#x1F527; {e.issue}
                      </span>
                    )}
                    {e.device && (
                      <span className="px-2 py-0.5 rounded-lg text-xs border border-blue-500/40 text-blue-400">
                        &#x1F4F1; {e.device}
                      </span>
                    )}
                    {e.account_code && (
                      <span className="px-2 py-0.5 rounded-lg text-xs border border-purple-500/40 text-purple-400 font-mono">
                        &#x1F511; {e.account_code}
                      </span>
                    )}
                  </div>

                  {/* Bottom: status + delete */}
                  <div className="flex items-center justify-between">
                    <div className="relative">
                      <button
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setOpenStatusMenu(openStatusMenu === e.telegram_user_id ? null : e.telegram_user_id);
                          setConfirmDelete(null);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${status.color}`}
                      >
                        {status.label}
                      </button>

                      {openStatusMenu === e.telegram_user_id && (
                        <div className="absolute left-0 top-full mt-1 z-20 bg-bg-secondary border border-overlay/10 rounded-lg shadow-lg py-1 min-w-[130px]">
                          {STATUSES.map((s) => (
                            <button
                              key={s.value}
                              onClick={(ev) => {
                                ev.stopPropagation();
                                handleStatusChange(e.telegram_user_id, s.value);
                              }}
                              className={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                                s.value === e.support_status
                                  ? "text-text-primary font-medium bg-overlay/10"
                                  : "text-text-muted hover:text-text-primary hover:bg-overlay/5"
                              }`}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      {confirmDelete === e.telegram_user_id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(ev) => {
                              ev.stopPropagation();
                              handleDelete(e.telegram_user_id);
                            }}
                            className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors cursor-pointer"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={(ev) => {
                              ev.stopPropagation();
                              setConfirmDelete(null);
                            }}
                            className="px-2 py-1 text-xs bg-overlay/5 text-text-muted rounded-lg hover:bg-overlay/10 transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(ev) => {
                            ev.stopPropagation();
                            setConfirmDelete(e.telegram_user_id);
                            setOpenStatusMenu(null);
                          }}
                          title="Delete conversation"
                          className="p-1.5 text-text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Desktop layout: horizontal */}
                <div className="hidden sm:flex items-start justify-between">
                  {/* Left: user info — clickable to open conversation */}
                  <div
                    className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                    onClick={() => router.push(`/admin-dvpn/messages/${e.telegram_user_id}`)}
                  >
                    <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 text-lg shrink-0">
                      &#x1F514;
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-text-primary truncate">
                        {e.first_name || "Unknown"}{" "}
                        {e.username && <span className="text-text-muted font-normal">@{e.username}</span>}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {e.issue && (
                          <span className="px-2 py-0.5 rounded-lg text-xs border border-red-500/40 text-red-400">
                            &#x1F527; {e.issue}
                          </span>
                        )}
                        {e.device && (
                          <span className="px-2 py-0.5 rounded-lg text-xs border border-blue-500/40 text-blue-400">
                            &#x1F4F1; {e.device}
                          </span>
                        )}
                        {e.account_code && (
                          <span className="px-2 py-0.5 rounded-lg text-xs border border-purple-500/40 text-purple-400 font-mono">
                            &#x1F511; {e.account_code}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: time + status + actions */}
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    {/* Status badge (click to change) */}
                    <div className="relative">
                      <button
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setOpenStatusMenu(openStatusMenu === e.telegram_user_id ? null : e.telegram_user_id);
                          setConfirmDelete(null);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${status.color}`}
                      >
                        {status.label}
                      </button>

                      {/* Status dropdown */}
                      {openStatusMenu === e.telegram_user_id && (
                        <div className="absolute right-0 top-full mt-1 z-20 bg-bg-secondary border border-overlay/10 rounded-lg shadow-lg py-1 min-w-[130px]">
                          {STATUSES.map((s) => (
                            <button
                              key={s.value}
                              onClick={(ev) => {
                                ev.stopPropagation();
                                handleStatusChange(e.telegram_user_id, s.value);
                              }}
                              className={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                                s.value === e.support_status
                                  ? "text-text-primary font-medium bg-overlay/10"
                                  : "text-text-muted hover:text-text-primary hover:bg-overlay/5"
                              }`}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Time */}
                    <div className="text-right">
                      <div className="text-xs text-text-muted">{formatTime(e.created_at)}</div>
                      <div className="text-xs text-orange-400 mt-0.5">{timeAgo(e.created_at)}</div>
                    </div>

                    {/* Delete button */}
                    <div className="relative">
                      {confirmDelete === e.telegram_user_id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(ev) => {
                              ev.stopPropagation();
                              handleDelete(e.telegram_user_id);
                            }}
                            className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors cursor-pointer"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={(ev) => {
                              ev.stopPropagation();
                              setConfirmDelete(null);
                            }}
                            className="px-2 py-1 text-xs bg-overlay/5 text-text-muted rounded-lg hover:bg-overlay/10 transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(ev) => {
                            ev.stopPropagation();
                            setConfirmDelete(e.telegram_user_id);
                            setOpenStatusMenu(null);
                          }}
                          title="Delete conversation"
                          className="p-1.5 text-text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
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
