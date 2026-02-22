"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

interface VpnUserRow {
  id: string;
  backend_username: string;
  backend_type: string;
  platform: string;
  protocol: string;
  status: string;
  server_name: string;
  server_country_code: string;
  used_traffic_bytes: number;
  data_limit_bytes: number | null;
  expires_at: string | null;
  last_online_at: string | null;
  account_id: string | null;
  created_at: string;
}

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function formatDate(ts: string | null): string {
  if (!ts) return "Never";
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const statusColors: Record<string, string> = {
  active: "text-green-400",
  disabled: "text-red-400",
  expired: "text-yellow-400",
  limited: "text-orange-400",
  on_hold: "text-text-muted",
};

const platformColors: Record<string, string> = {
  ios: "text-blue-400",
  android: "text-green-400",
  telegram: "text-sky-400",
  desktop: "text-purple-400",
  unknown: "text-text-muted",
};

const platformLabels: Record<string, string> = {
  ios: "iOS",
  android: "Android",
  telegram: "Telegram",
  desktop: "Desktop",
  unknown: "Unknown",
};

function displayPlatform(u: VpnUserRow): string {
  if (u.platform !== "unknown") return platformLabels[u.platform] || u.platform;
  if (u.backend_username.startsWith("tg_")) return "Telegram";
  return "Unknown";
}

function displayPlatformColor(u: VpnUserRow): string {
  if (u.platform !== "unknown") return platformColors[u.platform] || platformColors.unknown;
  if (u.backend_username.startsWith("tg_")) return platformColors.telegram;
  return platformColors.unknown;
}

const flagEmoji: Record<string, string> = {
  DE: "\u{1F1E9}\u{1F1EA}",
  RU: "\u{1F1F7}\u{1F1FA}",
  CH: "\u{1F1E8}\u{1F1ED}",
  GB: "\u{1F1EC}\u{1F1E7}",
  US: "\u{1F1FA}\u{1F1F8}",
};

export default function VpnUsersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [users, setUsers] = useState<VpnUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  // Filters from URL
  const serverId = searchParams.get("server_id") || "";
  const platform = searchParams.get("platform") || "";
  const protocol = searchParams.get("protocol") || "";
  const status = searchParams.get("status") || "";
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 50;

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (serverId) params.set("server_id", serverId);
      if (platform) params.set("platform", platform);
      if (protocol) params.set("protocol", protocol);
      if (status) params.set("status", status);
      if (search) params.set("search", search);
      params.set("offset", String((page - 1) * limit));
      params.set("limit", String(limit));

      const res = await fetch(`/api/admin/vpn/users?${params}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      const json = await res.json();
      setUsers(json.users || []);
      setTotal(json.total || 0);
      setError("");
    } catch {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [serverId, platform, protocol, status, search, page, limit]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page"); // reset page on filter change
    router.push(`/admin-dvpn/vpn/users?${params}`);
  }

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (p > 1) {
      params.set("page", String(p));
    } else {
      params.delete("page");
    }
    router.push(`/admin-dvpn/vpn/users?${params}`);
  }

  async function handleDelete(user: VpnUserRow) {
    if (!confirm(`Delete "${user.backend_username}" from ${user.server_name}? This removes the user from Supabase.`)) return;
    setDeleting(user.id);
    try {
      const res = await fetch(`/api/admin/vpn/users/${user.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      fetchUsers();
    } catch {
      setError("Failed to delete user");
    } finally {
      setDeleting(null);
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin-dvpn/vpn"
            className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Servers
          </Link>
          <h1 className="text-2xl font-semibold text-text-primary">VPN Users</h1>
          <span className="text-sm text-text-muted">({total})</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={platform}
          onChange={(e) => updateFilter("platform", e.target.value)}
          className="px-3 py-2 bg-bg-secondary border border-overlay/10 rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-teal cursor-pointer"
        >
          <option value="">All Platforms</option>
          <option value="ios">iOS</option>
          <option value="android">Android</option>
          <option value="telegram">Telegram</option>
          <option value="desktop">Desktop</option>
          <option value="unknown">Unknown</option>
        </select>

        <select
          value={protocol}
          onChange={(e) => updateFilter("protocol", e.target.value)}
          className="px-3 py-2 bg-bg-secondary border border-overlay/10 rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-teal cursor-pointer"
        >
          <option value="">All Protocols</option>
          <option value="wireguard">WireGuard</option>
          <option value="vless">VLESS</option>
          <option value="shadowsocks">Shadowsocks</option>
          <option value="trojan">Trojan</option>
          <option value="udp">UDP</option>
        </select>

        <select
          value={status}
          onChange={(e) => updateFilter("status", e.target.value)}
          className="px-3 py-2 bg-bg-secondary border border-overlay/10 rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-teal cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
          <option value="expired">Expired</option>
          <option value="limited">Limited</option>
        </select>

        <input
          type="text"
          placeholder="Search username..."
          defaultValue={search}
          onKeyDown={(e) => {
            if (e.key === "Enter") updateFilter("search", (e.target as HTMLInputElement).value);
          }}
          className="px-3 py-2 bg-bg-secondary border border-overlay/10 rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-teal w-48"
        />

        {(serverId || platform || protocol || status || search) && (
          <Link
            href="/admin-dvpn/vpn/users"
            className="px-3 py-2 text-xs text-text-muted hover:text-text-primary border border-overlay/10 rounded-lg hover:bg-overlay/5 transition-colors"
          >
            Clear filters
          </Link>
        )}
      </div>

      {/* Users table */}
      <div className="bg-bg-secondary border border-overlay/10 rounded-lg overflow-hidden">
        {loading ? (
          <div className="px-4 py-8 text-center text-text-muted">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-overlay/10 text-text-muted text-left">
                <th className="px-4 py-3 font-medium">Username</th>
                <th className="px-4 py-3 font-medium">Server</th>
                <th className="px-4 py-3 font-medium">Platform</th>
                <th className="px-4 py-3 font-medium">Protocol</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Traffic</th>
                <th className="px-4 py-3 font-medium">Expires</th>
                <th className="px-4 py-3 font-medium">Last Online</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-overlay/5 hover:bg-overlay/[0.02]">
                  <td className="px-4 py-3">
                    <span className="text-text-primary font-medium">{u.backend_username}</span>
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    <span className="mr-1">{flagEmoji[u.server_country_code] || ""}</span>
                    {u.server_name}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${displayPlatformColor(u)}`}>
                      {displayPlatform(u)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-muted text-xs">{u.protocol}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${statusColors[u.status] || "text-text-muted"}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {formatBytes(u.used_traffic_bytes)}
                    {u.data_limit_bytes ? ` / ${formatBytes(u.data_limit_bytes)}` : ""}
                  </td>
                  <td className="px-4 py-3 text-text-muted">{formatDate(u.expires_at)}</td>
                  <td className="px-4 py-3 text-text-muted">{formatDate(u.last_online_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(u)}
                      disabled={deleting === u.id}
                      className="px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 rounded transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {deleting === u.id ? "..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-text-muted">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-text-muted">
            Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 text-xs border border-overlay/10 rounded-lg text-text-muted hover:text-text-primary hover:bg-overlay/5 disabled:opacity-30 cursor-pointer"
            >
              Previous
            </button>
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-xs border border-overlay/10 rounded-lg text-text-muted hover:text-text-primary hover:bg-overlay/5 disabled:opacity-30 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
