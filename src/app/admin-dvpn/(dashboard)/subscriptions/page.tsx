"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminLoader } from "@/components/admin/admin-loader";

interface SubscriptionEvent {
  id: string;
  event_type: string;
  account_id: string;
  transaction_id: string | null;
  platform: string | null;
  product_id: string | null;
  environment: string | null;
  raw_payload: Record<string, unknown> | null;
  created_at: string;
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  INITIAL_PURCHASE: "bg-green-500/15 text-green-400 border-green-500/30",
  RENEWAL: "bg-green-500/15 text-green-400 border-green-500/30",
  RESTORE_REJECTED: "bg-red-500/15 text-red-400 border-red-500/30",
  REFUND: "bg-red-500/15 text-red-400 border-red-500/30",
  EXPIRATION: "bg-red-500/15 text-red-400 border-red-500/30",
  CANCELLATION: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  BILLING_ISSUES: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  TRANSFER: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  PRODUCT_CHANGE: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  ADMIN_TRANSFER: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  SUBSCRIBER_ALIAS: "bg-gray-500/15 text-gray-400 border-gray-500/30",
  ADMIN_REVOKE: "bg-gray-500/15 text-gray-400 border-gray-500/30",
};

const DEFAULT_BADGE = "bg-gray-500/15 text-gray-400 border-gray-500/30";

const FILTER_OPTIONS = [
  { value: "", label: "All Events" },
  { value: "INITIAL_PURCHASE", label: "Purchases" },
  { value: "RENEWAL", label: "Renewals" },
  { value: "RESTORE_REJECTED", label: "Rejections" },
  { value: "CANCELLATION", label: "Cancellations" },
  { value: "REFUND", label: "Refunds" },
  { value: "EXPIRATION", label: "Expirations" },
  { value: "BILLING_ISSUES", label: "Billing Issues" },
  { value: "TRANSFER", label: "Transfers" },
  { value: "PRODUCT_CHANGE", label: "Product Changes" },
  { value: "ADMIN_TRANSFER", label: "Admin Transfers" },
  { value: "ADMIN_REVOKE", label: "Admin Revokes" },
  { value: "SUBSCRIBER_ALIAS", label: "Subscriber Aliases" },
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatEventType(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

export default function SubscriptionsPage() {
  const [events, setEvents] = useState<SubscriptionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const pageSize = 50;
  const totalPages = Math.ceil(total / pageSize);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (typeFilter) params.set("type", typeFilter);
    if (search) params.set("search", search);

    const res = await fetch(`/api/admin/subscriptions?${params}`);
    const data = await res.json();
    setEvents(data.events || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, typeFilter, search]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter]);

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(text);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Clipboard API may not be available
    }
  }

  function buildDetails(event: SubscriptionEvent): string {
    const parts: string[] = [];
    if (event.product_id) parts.push(event.product_id);
    if (event.environment && event.environment !== "PRODUCTION") {
      parts.push(event.environment);
    }
    return parts.join(" | ") || "-";
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">
            Subscription Events
          </h1>
          <p className="text-sm text-text-muted mt-1">
            RevenueCat webhook events
          </p>
        </div>
        <span className="text-sm text-text-muted">
          {total} event{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by account ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-md px-3 py-2 text-sm bg-overlay/5 border border-overlay/10 rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-teal/50"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-full sm:w-48 px-3 py-2 text-sm bg-overlay/5 border border-overlay/10 rounded-lg text-text-primary focus:outline-none focus:border-accent-teal/50"
        >
          {FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <AdminLoader />
      ) : events.length === 0 ? (
        <div className="text-center py-12 text-text-muted">
          <p className="text-lg mb-1">No subscription events</p>
          <p className="text-xs">
            {typeFilter || search
              ? "Try adjusting your filters"
              : "Events from RevenueCat webhooks will appear here"}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-overlay/10 text-text-muted text-start">
                  <th className="text-start pb-3 pe-4 font-medium">Time</th>
                  <th className="text-start pb-3 pe-4 font-medium">
                    Event Type
                  </th>
                  <th className="text-start pb-3 pe-4 font-medium">
                    Account ID
                  </th>
                  <th className="text-start pb-3 pe-4 font-medium">
                    Transaction ID
                  </th>
                  <th className="text-start pb-3 pe-4 font-medium">
                    Platform
                  </th>
                  <th className="text-start pb-3 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr
                    key={event.id}
                    className="border-b border-overlay/5 hover:bg-overlay/5 transition-colors"
                  >
                    <td className="py-3 pe-4 whitespace-nowrap">
                      <div className="text-text-primary">
                        {timeAgo(event.created_at)}
                      </div>
                      <div className="text-xs text-text-muted">
                        {formatTime(event.created_at)}
                      </div>
                    </td>
                    <td className="py-3 pe-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-lg text-xs font-medium border ${
                          EVENT_TYPE_COLORS[event.event_type] || DEFAULT_BADGE
                        }`}
                      >
                        {formatEventType(event.event_type)}
                      </span>
                    </td>
                    <td className="py-3 pe-4">
                      <button
                        onClick={() => copyToClipboard(event.account_id)}
                        className="font-mono text-xs text-text-muted hover:text-accent-teal transition-colors cursor-pointer"
                        title="Click to copy"
                      >
                        {copiedId === event.account_id
                          ? "Copied!"
                          : event.account_id.length > 16
                            ? event.account_id.slice(0, 16) + "..."
                            : event.account_id}
                      </button>
                    </td>
                    <td className="py-3 pe-4">
                      <span className="font-mono text-xs text-text-muted">
                        {event.transaction_id
                          ? event.transaction_id.length > 20
                            ? event.transaction_id.slice(0, 20) + "..."
                            : event.transaction_id
                          : "-"}
                      </span>
                    </td>
                    <td className="py-3 pe-4">
                      <span className="text-xs text-text-muted">
                        {event.platform || "-"}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="text-xs text-text-muted">
                        {buildDetails(event)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="border border-overlay/10 rounded-lg p-4 hover:bg-overlay/5 transition-colors space-y-3"
              >
                {/* Top: time + badge */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-lg text-xs font-medium border ${
                      EVENT_TYPE_COLORS[event.event_type] || DEFAULT_BADGE
                    }`}
                  >
                    {formatEventType(event.event_type)}
                  </span>
                  <div className="text-end">
                    <div className="text-xs text-text-muted">
                      {timeAgo(event.created_at)}
                    </div>
                  </div>
                </div>

                {/* Account + Transaction */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted shrink-0">
                      Account:
                    </span>
                    <button
                      onClick={() => copyToClipboard(event.account_id)}
                      className="font-mono text-xs text-text-primary hover:text-accent-teal transition-colors cursor-pointer truncate"
                    >
                      {copiedId === event.account_id
                        ? "Copied!"
                        : event.account_id}
                    </button>
                  </div>
                  {event.transaction_id && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted shrink-0">
                        Txn:
                      </span>
                      <span className="font-mono text-xs text-text-muted truncate">
                        {event.transaction_id}
                      </span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {event.platform && (
                    <span className="px-2 py-0.5 rounded-lg text-xs border border-blue-500/40 text-blue-400">
                      {event.platform}
                    </span>
                  )}
                  {event.product_id && (
                    <span className="px-2 py-0.5 rounded-lg text-xs border border-purple-500/40 text-purple-400">
                      {event.product_id}
                    </span>
                  )}
                  {event.environment &&
                    event.environment !== "PRODUCTION" && (
                      <span className="px-2 py-0.5 rounded-lg text-xs border border-orange-500/40 text-orange-400">
                        {event.environment}
                      </span>
                    )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-text-muted">
            Page {page} of {totalPages}
          </span>
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
