"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface SystemStats {
  version: string;
  mem_total: number;
  mem_used: number;
  cpu_cores: number;
  cpu_usage: number;
  total_user: number;
  online_users: number;
  users_active: number;
  incoming_bandwidth: number;
  outgoing_bandwidth: number;
}

interface VpnUser {
  username: string;
  status: string;
  used_traffic: number;
  data_limit: number | null;
  expire: number | null;
  online_at: string | null;
  created_at: string;
}

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function formatDate(ts: number | string | null): string {
  if (!ts) return "Never";
  const d = typeof ts === "number" ? new Date(ts * 1000) : new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const statusColors: Record<string, string> = {
  active: "bg-green-500/20 text-green-400",
  disabled: "bg-red-500/20 text-red-400",
  expired: "bg-yellow-500/20 text-yellow-400",
  limited: "bg-orange-500/20 text-orange-400",
  on_hold: "bg-gray-500/20 text-gray-400",
};

export default function VpnPage() {
  const [system, setSystem] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<VpnUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", dataLimitGB: "", expiryDate: "" });
  const [protocols, setProtocols] = useState({ vless: true, shadowsocks: true, trojan: true });
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/vpn");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setSystem(data.system);
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch {
      setError("Failed to load VPN data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const proxies: Record<string, object> = {};
      const inbounds: Record<string, string[]> = {};
      if (protocols.vless) { proxies.vless = {}; inbounds.vless = ["VLESS-Reality", "VLESS-WebSocket", "VLESS-gRPC"]; }
      if (protocols.shadowsocks) { proxies.shadowsocks = {}; inbounds.shadowsocks = ["Shadowsocks-2022"]; }
      if (protocols.trojan) { proxies.trojan = {}; inbounds.trojan = ["Trojan-WS"]; }

      const body: Record<string, unknown> = {
        username: newUser.username,
        proxies,
        inbounds,
        data_limit: newUser.dataLimitGB ? parseFloat(newUser.dataLimitGB) * 1024 * 1024 * 1024 : 0,
        expire: newUser.expiryDate ? Math.floor(new Date(newUser.expiryDate).getTime() / 1000) : null,
        status: "active",
      };

      const res = await fetch("/api/admin/vpn", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      setShowCreate(false);
      setNewUser({ username: "", dataLimitGB: "", expiryDate: "" });
      fetchData();
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setCreating(false);
    }
  }

  async function toggleUser(username: string, currentStatus: string) {
    const newStatus = currentStatus === "active" ? "disabled" : "active";
    await fetch(`/api/admin/vpn/${encodeURIComponent(username)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
    fetchData();
  }

  async function handleDelete(username: string) {
    if (!confirm(`Delete user "${username}"?`)) return;
    await fetch(`/api/admin/vpn/${encodeURIComponent(username)}`, { method: "DELETE" });
    fetchData();
  }

  if (loading) return <div className="p-8 text-text-muted">Loading...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-text-primary">VPN Users</h1>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-accent-teal text-black rounded-lg text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer">
          Create User
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>}

      {/* Stats */}
      {system && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: "CPU Usage", value: `${system.cpu_usage.toFixed(1)}%` },
            { label: "RAM", value: `${formatBytes(system.mem_used)} / ${formatBytes(system.mem_total)}` },
            { label: "Online", value: system.online_users },
            { label: "Total Users", value: system.total_user },
            { label: "Bandwidth In", value: formatBytes(system.incoming_bandwidth) },
            { label: "Bandwidth Out", value: formatBytes(system.outgoing_bandwidth) },
          ].map((s) => (
            <div key={s.label} className="bg-bg-secondary border border-white/10 rounded-lg p-4">
              <p className="text-xs text-text-muted mb-1">{s.label}</p>
              <p className="text-lg font-semibold text-text-primary">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Users table */}
      <div className="bg-bg-secondary border border-white/10 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-text-muted text-left">
              <th className="px-4 py-3 font-medium">Username</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Traffic</th>
              <th className="px-4 py-3 font-medium">Expires</th>
              <th className="px-4 py-3 font-medium">Online At</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.username} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <Link href={`/admin-dvpn/vpn/${encodeURIComponent(u.username)}`} className="text-accent-teal hover:underline">{u.username}</Link>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[u.status] || "bg-gray-500/20 text-gray-400"}`}>{u.status}</span>
                </td>
                <td className="px-4 py-3 text-text-muted">
                  {formatBytes(u.used_traffic)}{u.data_limit ? ` / ${formatBytes(u.data_limit)}` : " / Unlimited"}
                </td>
                <td className="px-4 py-3 text-text-muted">{u.expire ? formatDate(u.expire) : "Never"}</td>
                <td className="px-4 py-3 text-text-muted">{u.online_at ? formatDate(u.online_at) : "Never"}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => toggleUser(u.username, u.status)} className="px-2 py-1 text-xs rounded border border-white/10 text-text-muted hover:text-text-primary hover:bg-white/5 cursor-pointer">
                    {u.status === "active" ? "Disable" : "Enable"}
                  </button>
                  <button onClick={() => handleDelete(u.username)} className="px-2 py-1 text-xs rounded border border-red-500/20 text-red-400 hover:bg-red-500/10 cursor-pointer">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted">No users found</td></tr>
            )}
          </tbody>
        </table>
        {total > 50 && <div className="px-4 py-3 text-xs text-text-muted border-t border-white/10">Showing {users.length} of {total} users</div>}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={handleCreate} className="bg-bg-secondary border border-white/10 rounded-xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-semibold text-text-primary">Create VPN User</h2>
            <div>
              <label className="block text-sm text-text-muted mb-1">Username</label>
              <input required value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-teal" />
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1">Data Limit (GB, empty = unlimited)</label>
              <input type="number" step="0.1" value={newUser.dataLimitGB} onChange={(e) => setNewUser({ ...newUser, dataLimitGB: e.target.value })} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-teal" />
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1">Expiry Date (empty = never)</label>
              <input type="date" value={newUser.expiryDate} onChange={(e) => setNewUser({ ...newUser, expiryDate: e.target.value })} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-teal" />
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-2">Protocols</label>
              <div className="flex gap-4">
                {(["vless", "shadowsocks", "trojan"] as const).map((p) => (
                  <label key={p} className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
                    <input type="checkbox" checked={protocols[p]} onChange={(e) => setProtocols({ ...protocols, [p]: e.target.checked })} className="accent-accent-teal" />
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2 border border-white/10 rounded-lg text-sm text-text-muted hover:bg-white/5 cursor-pointer">Cancel</button>
              <button type="submit" disabled={creating} className="flex-1 px-4 py-2 bg-accent-teal text-black rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 cursor-pointer">{creating ? "Creating..." : "Create"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
