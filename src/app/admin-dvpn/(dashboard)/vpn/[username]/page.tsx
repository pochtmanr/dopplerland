"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function formatDate(ts: number | string | null): string {
  if (!ts) return "N/A";
  const d = typeof ts === "number" ? new Date(ts * 1000) : new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const statusColors: Record<string, string> = {
  active: "bg-green-500/20 text-green-400",
  disabled: "bg-red-500/20 text-red-400",
  expired: "bg-yellow-500/20 text-yellow-400",
  limited: "bg-orange-500/20 text-orange-400",
};

interface UserDetail {
  username: string;
  status: string;
  used_traffic: number;
  data_limit: number | null;
  expire: number | null;
  online_at: string | null;
  created_at: string;
  subscription_url: string;
  links: string[];
  proxies: Record<string, unknown>;
}

export default function VpnUserDetailPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ dataLimitGB: "", expiryDate: "", status: "" });

  useEffect(() => {
    fetch(`/api/admin/vpn/${encodeURIComponent(username)}`)
      .then((r) => r.json())
      .then((data) => {
        setUser(data);
        setForm({
          dataLimitGB: data.data_limit ? (data.data_limit / (1024 * 1024 * 1024)).toFixed(1) : "",
          expiryDate: data.expire ? new Date(data.expire * 1000).toISOString().split("T")[0] : "",
          status: data.status,
        });
      })
      .catch(() => setError("Failed to load user"))
      .finally(() => setLoading(false));
  }, [username]);

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        status: form.status,
        data_limit: form.dataLimitGB ? parseFloat(form.dataLimitGB) * 1024 * 1024 * 1024 : 0,
        expire: form.expiryDate ? Math.floor(new Date(form.expiryDate).getTime() / 1000) : null,
      };
      const res = await fetch(`/api/admin/vpn/${encodeURIComponent(username)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Failed to update");
      const updated = await res.json();
      setUser(updated);
      setEditMode(false);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Permanently delete "${username}"?`)) return;
    await fetch(`/api/admin/vpn/${encodeURIComponent(username)}`, { method: "DELETE" });
    router.push("/admin-dvpn/vpn");
  }

  function copySubscription() {
    if (user?.subscription_url) {
      navigator.clipboard.writeText(user.subscription_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) return <div className="p-8 text-text-muted">Loading...</div>;
  if (!user) return <div className="p-8 text-red-400">{error || "User not found"}</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link href="/admin-dvpn/vpn" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-6">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
        Back to Users
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-2xl font-semibold text-text-primary">{user.username}</h1>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[user.status] || "bg-gray-500/20 text-gray-400"}`}>{user.status}</span>
      </div>

      {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>}

      {/* Info cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Created", value: formatDate(user.created_at) },
          { label: "Traffic", value: `${formatBytes(user.used_traffic)}${user.data_limit ? ` / ${formatBytes(user.data_limit)}` : ""}` },
          { label: "Expires", value: user.expire ? formatDate(user.expire) : "Never" },
          { label: "Last Online", value: user.online_at ? formatDate(user.online_at) : "Never" },
        ].map((c) => (
          <div key={c.label} className="bg-bg-secondary border border-overlay/10 rounded-lg p-4">
            <p className="text-xs text-text-muted mb-1">{c.label}</p>
            <p className="text-sm font-medium text-text-primary">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Subscription URL */}
      {user.subscription_url && (
        <div className="bg-bg-secondary border border-overlay/10 rounded-lg p-4 mb-6">
          <p className="text-xs text-text-muted mb-2">Subscription URL</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs text-text-primary bg-overlay/5 px-3 py-2 rounded overflow-x-auto">{user.subscription_url}</code>
            <button onClick={copySubscription} className="px-3 py-2 text-xs border border-overlay/10 rounded text-text-muted hover:text-text-primary hover:bg-overlay/5 cursor-pointer whitespace-nowrap">
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {/* Links */}
      {user.links && user.links.length > 0 && (
        <div className="bg-bg-secondary border border-overlay/10 rounded-lg p-4 mb-6">
          <p className="text-xs text-text-muted mb-2">Connection Links</p>
          <div className="space-y-1">
            {user.links.map((link, i) => (
              <code key={i} className="block text-xs text-text-muted bg-overlay/5 px-3 py-1.5 rounded break-all">{link}</code>
            ))}
          </div>
        </div>
      )}

      {/* Edit form */}
      {editMode ? (
        <div className="bg-bg-secondary border border-overlay/10 rounded-lg p-4 mb-6 space-y-4">
          <h2 className="text-sm font-medium text-text-primary">Edit User</h2>
          <div>
            <label className="block text-xs text-text-muted mb-1">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 bg-overlay/5 border border-overlay/10 rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-teal">
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Data Limit (GB, empty = unlimited)</label>
            <input type="number" step="0.1" value={form.dataLimitGB} onChange={(e) => setForm({ ...form, dataLimitGB: e.target.value })} className="w-full px-3 py-2 bg-overlay/5 border border-overlay/10 rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-teal" />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Expiry Date</label>
            <input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} className="w-full px-3 py-2 bg-overlay/5 border border-overlay/10 rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-teal" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setEditMode(false)} className="px-4 py-2 border border-overlay/10 rounded-lg text-sm text-text-muted hover:bg-overlay/5 cursor-pointer">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-accent-teal text-black rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 cursor-pointer">{saving ? "Saving..." : "Save"}</button>
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          <button onClick={() => setEditMode(true)} className="px-4 py-2 border border-overlay/10 rounded-lg text-sm text-text-muted hover:text-text-primary hover:bg-overlay/5 cursor-pointer">Edit User</button>
          <button onClick={handleDelete} className="px-4 py-2 border border-red-500/20 rounded-lg text-sm text-red-400 hover:bg-red-500/10 cursor-pointer">Delete User</button>
        </div>
      )}
    </div>
  );
}
