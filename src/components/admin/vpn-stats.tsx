"use client";

import { useEffect, useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────

interface StatsResponse {
  totals: {
    total: number;
    active: number;
    expired: number;
    limited: number;
    disabled: number;
    on_hold: number;
    total_traffic_bytes: number;
    new_today: number;
  };
  by_platform: Array<{ platform: string; count: number }>;
  by_server: Array<{
    server_id: string;
    name: string;
    country_code: string;
    count: number;
  }>;
  new_users_daily: Array<{ day: string; count: number }>;
}

interface HealthServer {
  server_id: string;
  marzban: { users_active: number; total_users: number } | null;
}

interface HealthResponse {
  servers: HealthServer[];
}

// ── Utilities ──────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function countryFlag(code: string): string {
  const base = code.slice(0, 2).toUpperCase();
  if (base.length < 2 || !/^[A-Z]{2}$/.test(base)) return code;
  return String.fromCodePoint(
    ...Array.from(base).map((c) => c.codePointAt(0)! - 0x41 + 0x1f1e6),
  );
}

const platformColors: Record<string, string> = {
  telegram: "bg-sky-400",
  ios: "bg-blue-400",
  android: "bg-green-400",
  unknown: "bg-text-muted",
};

const platformLabels: Record<string, string> = {
  telegram: "Telegram",
  ios: "iOS",
  android: "Android",
  desktop: "Desktop",
  unknown: "Unknown",
};

// ── Skeleton ───────────────────────────────────────────────────────────────

function StatsSkeleton() {
  return (
    <div className="space-y-3" role="status" aria-label="Loading VPN stats">
      {/* Cards row skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-bg-secondary border border-overlay/10 rounded-xl p-4 animate-pulse"
          >
            <div className="h-3 w-16 bg-overlay/10 rounded mb-3" />
            <div className="h-7 w-12 bg-overlay/10 rounded" />
          </div>
        ))}
      </div>
      {/* Breakdown row skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-bg-secondary border border-overlay/10 rounded-xl p-4 animate-pulse"
          >
            <div className="h-3 w-20 bg-overlay/10 rounded mb-4" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-overlay/10 rounded" />
              <div className="h-4 w-3/4 bg-overlay/10 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Horizontal Bar ─────────────────────────────────────────────────────────

function HorizontalBar({
  label,
  count,
  maxCount,
  colorClass,
}: {
  label: string;
  count: number;
  maxCount: number;
  colorClass: string;
}) {
  const widthPercent = maxCount > 0 ? (count / maxCount) * 100 : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-primary">{label}</span>
        <span className="text-text-muted tabular-nums">{count}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-overlay/10">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${Math.max(widthPercent, 2)}%` }}
        />
      </div>
    </div>
  );
}

// ── Sparkline ──────────────────────────────────────────────────────────────

function Sparkline({
  data,
}: {
  data: Array<{ day: string; count: number }>;
}) {
  if (data.length < 2) {
    return (
      <p className="text-xs text-text-muted text-center py-4">
        Not enough data
      </p>
    );
  }

  const viewWidth = 300;
  const viewHeight = 60;
  const paddingBottom = 14;
  const chartHeight = viewHeight - paddingBottom;

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const stepX = viewWidth / (data.length - 1);

  const points = data.map((d, i) => {
    const x = i * stepX;
    const y = chartHeight - (d.count / maxCount) * (chartHeight - 4) - 2;
    return `${x},${y}`;
  });

  const polylinePoints = points.join(" ");

  // Area fill: line path + close to bottom-right, bottom-left
  const areaPoints = `${polylinePoints} ${viewWidth},${chartHeight} 0,${chartHeight}`;

  const firstDate = data[0].day;
  const lastDate = data[data.length - 1].day;

  const formatShort = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <svg
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      className="w-full"
      preserveAspectRatio="none"
      aria-label="New users trend over 14 days"
      role="img"
    >
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" className="[stop-color:var(--color-accent-teal)]" stopOpacity={0.15} />
          <stop offset="100%" className="[stop-color:var(--color-accent-teal)]" stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#sparkFill)" />
      <polyline
        points={polylinePoints}
        fill="none"
        className="stroke-accent-teal"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <text
        x={0}
        y={viewHeight - 1}
        className="fill-text-muted"
        fontSize={10}
        textAnchor="start"
      >
        {formatShort(firstDate)}
      </text>
      <text
        x={viewWidth}
        y={viewHeight - 1}
        className="fill-text-muted"
        fontSize={10}
        textAnchor="end"
      >
        {formatShort(lastDate)}
      </text>
    </svg>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function VpnStats() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [onlineCount, setOnlineCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [statsRes, healthRes] = await Promise.all([
          fetch("/api/admin/vpn/stats"),
          fetch("/api/admin/vpn/health"),
        ]);

        if (cancelled) return;

        if (statsRes.ok) {
          const statsJson: StatsResponse = await statsRes.json();
          setStats(statsJson);
        }

        if (healthRes.ok) {
          const healthJson: HealthResponse = await healthRes.json();
          const total = healthJson.servers.reduce(
            (sum, s) => sum + (s.marzban?.users_active ?? 0),
            0,
          );
          setOnlineCount(total);
        }
      } catch {
        // Silently fail — don't break the page
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <StatsSkeleton />;
  if (!stats) return null;

  const { totals, by_platform, by_server, new_users_daily } = stats;

  const maxPlatformCount = Math.max(...by_platform.map((p) => p.count), 1);
  const maxServerCount = Math.max(...by_server.map((s) => s.count), 1);

  return (
    <div className="space-y-3">
      {/* Section A: Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Users */}
        <div className="bg-bg-secondary border border-overlay/10 rounded-xl p-4">
          <p className="text-[11px] uppercase tracking-wider text-text-muted">
            Total Users
          </p>
          <p className="text-2xl font-semibold text-text-primary mt-1">
            {totals.total.toLocaleString()}
          </p>
          {totals.new_today > 0 && (
            <p className="text-xs text-green-400 mt-1">
              +{totals.new_today} today
            </p>
          )}
        </div>

        {/* Active */}
        <div className="bg-bg-secondary border border-overlay/10 rounded-xl p-4">
          <p className="text-[11px] uppercase tracking-wider text-text-muted">
            Active
          </p>
          <p className="text-2xl font-semibold text-green-400 mt-1">
            {totals.active.toLocaleString()}
          </p>
        </div>

        {/* Expired */}
        <div className="bg-bg-secondary border border-overlay/10 rounded-xl p-4">
          <p className="text-[11px] uppercase tracking-wider text-text-muted">
            Expired
          </p>
          <p className="text-2xl font-semibold text-red-400 mt-1">
            {totals.expired.toLocaleString()}
          </p>
        </div>

        {/* Total Traffic */}
        <div className="bg-bg-secondary border border-overlay/10 rounded-xl p-4">
          <p className="text-[11px] uppercase tracking-wider text-text-muted">
            Total Traffic
          </p>
          <p className="text-2xl font-semibold text-text-primary mt-1">
            {formatBytes(totals.total_traffic_bytes)}
          </p>
        </div>

        {/* Online Now */}
        <div className="bg-bg-secondary border border-overlay/10 rounded-xl p-4">
          <p className="text-[11px] uppercase tracking-wider text-text-muted">
            Online Now
          </p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-2xl font-semibold text-text-primary">
              {onlineCount !== null ? onlineCount.toLocaleString() : "--"}
            </p>
            {onlineCount !== null && onlineCount > 0 && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400" />
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Section B: Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* By Platform */}
        <div className="bg-bg-secondary border border-overlay/10 rounded-xl p-4">
          <p className="text-[11px] uppercase tracking-wider text-text-muted mb-3">
            By Platform
          </p>
          <div className="space-y-2.5">
            {by_platform.map((p) => (
              <HorizontalBar
                key={p.platform}
                label={platformLabels[p.platform] ?? p.platform}
                count={p.count}
                maxCount={maxPlatformCount}
                colorClass={platformColors[p.platform] ?? "bg-text-muted"}
              />
            ))}
            {by_platform.length === 0 && (
              <p className="text-xs text-text-muted">No data</p>
            )}
          </div>
        </div>

        {/* By Server */}
        <div className="bg-bg-secondary border border-overlay/10 rounded-xl p-4">
          <p className="text-[11px] uppercase tracking-wider text-text-muted mb-3">
            By Server
          </p>
          <div className="space-y-2.5">
            {by_server.map((s) => (
              <HorizontalBar
                key={s.server_id}
                label={`${countryFlag(s.country_code)} ${s.name}`}
                count={s.count}
                maxCount={maxServerCount}
                colorClass="bg-accent-teal"
              />
            ))}
            {by_server.length === 0 && (
              <p className="text-xs text-text-muted">No data</p>
            )}
          </div>
        </div>

        {/* New Users (14d) */}
        <div className="bg-bg-secondary border border-overlay/10 rounded-xl p-4">
          <p className="text-[11px] uppercase tracking-wider text-text-muted mb-3">
            New Users (14d)
          </p>
          <Sparkline data={new_users_daily} />
        </div>
      </div>
    </div>
  );
}
