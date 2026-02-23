"use client";

import { useEffect, useState } from "react";
import { AdminLoader } from "@/components/admin/admin-loader";

interface DashboardData {
  accounts: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    tierBreakdown: Record<string, number>;
  };
  subscriptions: { active: number };
  telegram: {
    total: number;
    bySource: Record<string, number>;
    channelMembers: number;
    activeUsers24h: number;
    totalMessages: number;
  };
  devices: {
    total: number;
    byType: Record<string, number>;
  };
  recentSignups: Array<{
    id: string;
    account_code: string;
    subscription_tier: string;
    created_at: string;
    telegram_links: Array<{
      username: string | null;
      first_name: string | null;
      bot_source: string | null;
      last_active_at: string | null;
      is_channel_member: boolean;
    }> | null;
  }>;
  escalations: Array<{
    id: string;
    telegram_user_id: string;
    content: string;
    template_key: string | null;
    created_at: string;
  }>;
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-bg-secondary border border-overlay/10 rounded-xl p-5">
      <p className="text-text-muted text-sm mb-1">{label}</p>
      <p className="text-2xl font-semibold text-text-primary">{value}</p>
      {sub && <p className="text-text-muted text-xs mt-1">{sub}</p>}
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatRelative(iso: string | null) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load dashboard");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return <p className="text-red-400">{error}</p>;
  }

  if (!data) {
    return <AdminLoader />;
  }

  const paidCount = Object.entries(data.accounts.tierBreakdown)
    .filter(([tier]) => tier !== "free")
    .reduce((sum, [, count]) => sum + count, 0);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-text-primary">Dashboard</h1>

      {/* Top row */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Total Users"
          value={data.accounts.total}
          sub={`+${data.accounts.today} today · +${data.accounts.thisWeek} this week`}
        />
        <StatCard
          label="Paid Subscribers"
          value={paidCount}
          sub={`${data.subscriptions.active} active`}
        />
        <StatCard
          label="Telegram Users"
          value={data.telegram.total}
          sub={Object.entries(data.telegram.bySource).map(([k, v]) => `${k}: ${v}`).join(" · ")}
        />
        <StatCard label="Channel Members" value={data.telegram.channelMembers} />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Active (24h)" value={data.telegram.activeUsers24h} />
        <StatCard label="Total Messages" value={data.telegram.totalMessages.toLocaleString()} />
        <StatCard label="Support Escalations" value={data.escalations.length} />
      </div>

      {/* Device stats */}
      {data.devices.total > 0 && (
        <div className="bg-bg-secondary border border-overlay/10 rounded-xl p-5">
          <h2 className="text-sm font-medium text-text-muted mb-2">Device Sessions ({data.devices.total})</h2>
          <div className="flex gap-4 text-sm text-text-primary">
            {Object.entries(data.devices.byType).map(([type, count]) => (
              <span key={type}>{type}: {count}</span>
            ))}
          </div>
        </div>
      )}

      {/* Recent Users */}
      <div>
        <h2 className="text-lg font-medium text-text-primary mb-3">Recent Users</h2>
        <div className="bg-bg-secondary border border-overlay/10 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-overlay/10 text-text-muted text-left">
                <th className="px-4 py-3 font-medium">Account Code</th>
                <th className="px-4 py-3 font-medium">Tier</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Telegram</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Last Active</th>
                <th className="px-4 py-3 font-medium">Channel</th>
              </tr>
            </thead>
            <tbody>
              {data.recentSignups.map((u) => {
                const tg = u.telegram_links?.[0];
                return (
                  <tr key={u.id} className="border-b border-overlay/5 text-text-primary">
                    <td className="px-4 py-3 font-mono text-xs">{u.account_code}</td>
                    <td className="px-4 py-3">
                      <span className={u.subscription_tier === "free" ? "text-text-muted" : "text-accent-teal"}>
                        {u.subscription_tier}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-muted">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3">{tg?.username ? `@${tg.username}` : tg?.first_name || "—"}</td>
                    <td className="px-4 py-3 text-text-muted">{tg?.bot_source || "—"}</td>
                    <td className="px-4 py-3 text-text-muted">{formatRelative(tg?.last_active_at ?? null)}</td>
                    <td className="px-4 py-3">{tg?.is_channel_member ? "Yes" : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Escalations */}
      {data.escalations.length > 0 && (
        <div>
          <h2 className="text-lg font-medium text-text-primary mb-3">Support Escalations</h2>
          <div className="bg-bg-secondary border border-overlay/10 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-overlay/10 text-text-muted text-left">
                  <th className="px-4 py-3 font-medium">User ID</th>
                  <th className="px-4 py-3 font-medium">Content</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {data.escalations.map((e) => (
                  <tr key={e.id} className="border-b border-overlay/5 text-text-primary">
                    <td className="px-4 py-3 font-mono text-xs">{e.telegram_user_id}</td>
                    <td className="px-4 py-3 max-w-xs truncate">{e.content}</td>
                    <td className="px-4 py-3 text-text-muted">{e.template_key || "message"}</td>
                    <td className="px-4 py-3 text-text-muted">{formatRelative(e.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
