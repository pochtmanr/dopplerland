"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ServerCard } from "@/components/admin/server-card";
import { HealthMonitor } from "@/components/admin/health-monitor";
import { AdminLoader } from "@/components/admin/admin-loader";

// ─── Types ───────────────────────────────────────────────────────────

interface ServerInfo {
  id: string;
  name: string;
  country: string;
  country_code: string;
  city: string;
  ip_address: string;
  port: number;
  protocol: string;
  is_active: boolean;
  has_marzban: boolean;
}

interface VpnUserRow {
  id: string;
  backend_username: string;
  backend_type: string;
  platform: string;
  protocol: string;
  status: string;
  server_id: string;
  server_name: string;
  server_country_code: string;
  used_traffic_bytes: number;
  data_limit_bytes: number | null;
  expires_at: string | null;
  last_online_at: string | null;
  account_id: string | null;
  created_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────

/** Convert country code (e.g. "US", "US2", "DE2") to flag emoji using first 2 chars */
function countryFlag(code: string): string {
  const base = code.slice(0, 2).toUpperCase();
  if (base.length < 2 || !/^[A-Z]{2}$/.test(base)) return code;
  return String.fromCodePoint(
    ...Array.from(base).map((c) => c.codePointAt(0)! - 0x41 + 0x1f1e6),
  );
}

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function formatDate(ts: string | null): string {
  if (!ts) return "Never";
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
  if (u.platform !== "unknown")
    return platformColors[u.platform] || platformColors.unknown;
  if (u.backend_username.startsWith("tg_")) return platformColors.telegram;
  return platformColors.unknown;
}

// ─── Tabs ────────────────────────────────────────────────────────────

type Tab = "servers" | "users";

const TABS: { key: Tab; label: string }[] = [
  { key: "servers", label: "Servers" },
  { key: "users", label: "Users" },
];

// ─── Main Page ───────────────────────────────────────────────────────

export default function VpnOverviewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeTab = (searchParams.get("tab") as Tab) || "servers";

  // ── Servers state ──
  const [servers, setServers] = useState<ServerInfo[]>([]);
  const [serversLoading, setServersLoading] = useState(true);
  const [serversError, setServersError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState("");

  // ── Users state ──
  const [users, setUsers] = useState<VpnUserRow[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Users filters from URL
  const serverId = searchParams.get("server_id") || "";
  const platform = searchParams.get("platform") || "";
  const protocol = searchParams.get("protocol") || "";
  const status = searchParams.get("status") || "";
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 50;

  // ── Fetch servers (fast, Supabase-only) ──
  const fetchServers = useCallback(async () => {
    try {
      setServersLoading(true);
      const res = await fetch("/api/admin/vpn/servers");
      if (!res.ok) throw new Error("Failed to fetch servers");
      const json = await res.json();
      setServers(json.servers || []);
      setServersError("");
    } catch {
      setServersError("Failed to load servers");
    } finally {
      setServersLoading(false);
    }
  }, []);

  // ── Fetch users (lazy, only on Users tab) ──
  const fetchUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
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
      setUsersTotal(json.total || 0);
      setUsersError("");
      setUsersLoaded(true);
    } catch {
      setUsersError("Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  }, [serverId, platform, protocol, status, search, page, limit]);

  // Always fetch servers on mount
  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  // Fetch users when Users tab is active (and on filter changes)
  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab, fetchUsers]);

  // ── Tab switching ──
  function switchTab(tab: Tab) {
    const params = new URLSearchParams();
    if (tab !== "servers") params.set("tab", tab);
    router.push(`/admin-dvpn/vpn${params.toString() ? `?${params}` : ""}`);
  }

  // ── Users filter management ──
  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "users");
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`/admin-dvpn/vpn?${params}`);
  }

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "users");
    if (p > 1) {
      params.set("page", String(p));
    } else {
      params.delete("page");
    }
    router.push(`/admin-dvpn/vpn?${params}`);
  }

  function clearFilters() {
    router.push("/admin-dvpn/vpn?tab=users");
  }

  // ── Sync ──
  async function handleSync() {
    setSyncing(true);
    setSyncResult("");
    try {
      const res = await fetch("/api/admin/vpn/sync", { method: "POST" });
      if (!res.ok) throw new Error("Sync failed");
      const json = await res.json();
      const summary = json.results
        .map(
          (r: { server: string; synced: number; errors: number }) =>
            `${r.server}: ${r.synced} synced, ${r.errors} errors`
        )
        .join(" | ");
      setSyncResult(summary);
      fetchServers();
    } catch {
      setSyncResult("Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  // ── Delete user ──
  async function handleDelete(user: VpnUserRow) {
    if (
      !confirm(
        `Delete "${user.backend_username}" from ${user.server_name}? This removes the user from Supabase.`
      )
    )
      return;
    setDeleting(user.id);
    try {
      const res = await fetch(`/api/admin/vpn/users/${user.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      fetchUsers();
    } catch {
      setUsersError("Failed to delete user");
    } finally {
      setDeleting(null);
    }
  }

  const totalPages = Math.ceil(usersTotal / limit);
  const hasUserFilters = serverId || platform || protocol || status || search;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-text-primary">
          VPN Servers
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-3 py-2 text-xs border border-overlay/10 rounded-lg text-text-muted hover:text-text-primary hover:bg-overlay/5 disabled:opacity-50 cursor-pointer transition-colors"
          >
            {syncing ? "Syncing..." : "Sync Marzban"}
          </button>
          <button
            onClick={activeTab === "servers" ? fetchServers : fetchUsers}
            className="px-3 py-2 text-xs border border-overlay/10 rounded-lg text-text-muted hover:text-text-primary hover:bg-overlay/5 cursor-pointer transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Alerts */}
      {serversError && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {serversError}
        </div>
      )}
      {syncResult && (
        <div className="mb-4 p-3 bg-accent-teal/10 border border-accent-teal/20 rounded-lg text-accent-teal text-sm">
          {syncResult}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex border-b border-overlay/10 mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => switchTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer -mb-px ${
              activeTab === t.key
                ? "border-b-2 border-accent-teal text-text-primary"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            {t.label}
            {t.key === "users" && usersLoaded && (
              <span className="ml-1.5 text-xs text-text-muted">
                ({usersTotal})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Servers Tab ── */}
      {activeTab === "servers" && (
        <>
          <HealthMonitor />

          {serversLoading ? (
            <AdminLoader />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {servers.map((srv) => (
                <ServerCard key={srv.id} server={srv} />
              ))}
              {servers.length === 0 && (
                <p className="col-span-full text-center text-text-muted py-8">
                  No servers found
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Users Tab ── */}
      {activeTab === "users" && (
        <>
          {usersError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {usersError}
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <select
              value={serverId}
              onChange={(e) => updateFilter("server_id", e.target.value)}
              className="px-3 py-2 bg-bg-secondary border border-overlay/10 rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-teal cursor-pointer"
            >
              <option value="">All Servers</option>
              {servers.map((srv) => (
                <option key={srv.id} value={srv.id}>
                  {srv.country_code} — {srv.name}
                </option>
              ))}
            </select>

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
                if (e.key === "Enter")
                  updateFilter(
                    "search",
                    (e.target as HTMLInputElement).value
                  );
              }}
              className="px-3 py-2 bg-bg-secondary border border-overlay/10 rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-teal w-48"
            />

            {hasUserFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-xs text-text-muted hover:text-text-primary border border-overlay/10 rounded-lg hover:bg-overlay/5 transition-colors cursor-pointer"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Users table */}
          <div className="bg-bg-secondary border border-overlay/10 rounded-lg overflow-hidden">
            {usersLoading ? (
              <AdminLoader />
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
                    <th className="px-4 py-3 font-medium text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-overlay/5 hover:bg-overlay/[0.02]"
                    >
                      <td className="px-4 py-3">
                        <span className="text-text-primary font-medium">
                          {u.backend_username}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-muted">
                        <span className="mr-1">
                          {countryFlag(u.server_country_code)}
                        </span>
                        {u.server_name}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs ${displayPlatformColor(u)}`}
                        >
                          {displayPlatform(u)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-muted text-xs">
                        {u.protocol}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs ${statusColors[u.status] || "text-text-muted"}`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-muted">
                        {formatBytes(u.used_traffic_bytes)}
                        {u.data_limit_bytes
                          ? ` / ${formatBytes(u.data_limit_bytes)}`
                          : ""}
                      </td>
                      <td className="px-4 py-3 text-text-muted">
                        {formatDate(u.expires_at)}
                      </td>
                      <td className="px-4 py-3 text-text-muted">
                        {formatDate(u.last_online_at)}
                      </td>
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
                      <td
                        colSpan={9}
                        className="px-4 py-8 text-center text-text-muted"
                      >
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
                Showing {(page - 1) * limit + 1}-
                {Math.min(page * limit, usersTotal)} of {usersTotal}
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
        </>
      )}
    </div>
  );
}
