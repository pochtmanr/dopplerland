"use client";

import React, { useEffect, useState } from "react";
import { AdminLoader } from "@/components/admin/admin-loader";

interface PromoRedemption {
  id: string;
  account_id: string;
  platform: string;
  original_price_cents: number;
  discounted_price_cents: number;
  redeemed_at: string;
}

interface PromoCode {
  id: string;
  code: string;
  discount_percent: number;
  applicable_plans: string[];
  max_redemptions: number | null;
  current_redemptions: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  promo_redemptions: PromoRedemption[];
}

function StatCard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="bg-bg-secondary border border-overlay/10 rounded-xl p-4 sm:p-5 flex items-start gap-4">
      <div className={`shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-lg ${iconBg} flex items-center justify-center ${iconColor}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-text-muted text-xs sm:text-sm">{label}</p>
        <p className="text-xl sm:text-2xl font-semibold text-text-primary leading-tight mt-0.5">{value}</p>
      </div>
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

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function getStatus(promo: PromoCode): { label: string; color: string; bg: string } {
  if (!promo.is_active) return { label: "Inactive", color: "text-text-muted", bg: "bg-overlay/10" };
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) return { label: "Expired", color: "text-yellow-400", bg: "bg-yellow-500/10" };
  if (promo.max_redemptions && promo.current_redemptions >= promo.max_redemptions) return { label: "Depleted", color: "text-orange-400", bg: "bg-orange-500/10" };
  return { label: "Active", color: "text-accent-teal", bg: "bg-accent-teal/10" };
}

const PLAN_OPTIONS = ["monthly", "semiannual", "annual"] as const;

export default function PromoCodesPage() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formCode, setFormCode] = useState("");
  const [formDiscount, setFormDiscount] = useState<number>(10);
  const [formPlans, setFormPlans] = useState<string[]>(["monthly", "semiannual", "annual"]);
  const [formMaxRedemptions, setFormMaxRedemptions] = useState<string>("");
  const [formExpiry, setFormExpiry] = useState<string>("");

  async function fetchCodes() {
    try {
      const res = await fetch("/api/admin/promo");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setCodes(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchCodes(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: formCode,
          discount_percent: formDiscount,
          applicable_plans: formPlans,
          max_redemptions: formMaxRedemptions ? parseInt(formMaxRedemptions) : null,
          expires_at: formExpiry || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create");
      }
      setShowCreate(false);
      setFormCode("");
      setFormDiscount(10);
      setFormPlans(["monthly", "semiannual", "annual"]);
      setFormMaxRedemptions("");
      setFormExpiry("");
      await fetchCodes();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(promo: PromoCode) {
    if (promo.is_active) {
      await fetch(`/api/admin/promo/${promo.id}`, { method: "DELETE" });
    } else {
      await fetch(`/api/admin/promo/${promo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: true }),
      });
    }
    await fetchCodes();
  }

  function togglePlan(plan: string) {
    setFormPlans((prev) =>
      prev.includes(plan) ? prev.filter((p) => p !== plan) : [...prev, plan]
    );
  }

  if (error) return <p className="text-red-400">{error}</p>;
  if (loading) return <AdminLoader />;

  const totalCodes = codes.length;
  const activeCodes = codes.filter((c) => c.is_active).length;
  const totalRedemptions = codes.reduce((sum, c) => sum + c.current_redemptions, 0);
  const totalSaved = codes.reduce(
    (sum, c) => sum + c.promo_redemptions.reduce((s, r) => s + (r.original_price_cents - r.discounted_price_cents), 0),
    0
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-semibold text-text-primary">Promo Codes</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="px-3 sm:px-4 py-2 bg-accent-teal/20 text-accent-teal rounded-lg text-sm hover:bg-accent-teal/30 transition-colors cursor-pointer"
        >
          + Create
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total Codes"
          value={totalCodes}
          iconBg="bg-blue-500/10"
          iconColor="text-blue-400"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
            </svg>
          }
        />
        <StatCard
          label="Active Codes"
          value={activeCodes}
          iconBg="bg-green-500/10"
          iconColor="text-green-400"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          }
        />
        <StatCard
          label="Total Redemptions"
          value={totalRedemptions}
          iconBg="bg-purple-500/10"
          iconColor="text-purple-400"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
            </svg>
          }
        />
        <StatCard
          label="Customer Savings"
          value={formatCents(totalSaved)}
          iconBg="bg-amber-500/10"
          iconColor="text-amber-400"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          }
        />
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleCreate}
            className="bg-bg-secondary border border-overlay/10 rounded-xl p-6 w-full max-w-md space-y-4"
          >
            <h2 className="text-lg font-semibold text-text-primary">Create Promo Code</h2>

            <div>
              <label className="text-sm text-text-muted block mb-1">Code</label>
              <input
                type="text"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                className="w-full bg-overlay/5 border border-overlay/10 rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-teal"
                placeholder="LAUNCH20"
                required
              />
            </div>

            <div>
              <label className="text-sm text-text-muted block mb-1">Discount %</label>
              <input
                type="number"
                min={1}
                max={100}
                value={formDiscount}
                onChange={(e) => setFormDiscount(parseInt(e.target.value))}
                className="w-full bg-overlay/5 border border-overlay/10 rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-teal"
                required
              />
            </div>

            <div>
              <label className="text-sm text-text-muted block mb-1">Applicable Plans</label>
              <div className="flex flex-wrap gap-3">
                {PLAN_OPTIONS.map((plan) => (
                  <label key={plan} className="flex items-center gap-1.5 text-sm text-text-primary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formPlans.includes(plan)}
                      onChange={() => togglePlan(plan)}
                      className="accent-accent-teal"
                    />
                    {plan}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-text-muted block mb-1">Max Redemptions (optional)</label>
              <input
                type="number"
                min={1}
                value={formMaxRedemptions}
                onChange={(e) => setFormMaxRedemptions(e.target.value)}
                className="w-full bg-overlay/5 border border-overlay/10 rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-teal"
                placeholder="Unlimited"
              />
            </div>

            <div>
              <label className="text-sm text-text-muted block mb-1">Expiry Date (optional)</label>
              <input
                type="datetime-local"
                value={formExpiry}
                onChange={(e) => setFormExpiry(e.target.value)}
                className="w-full bg-overlay/5 border border-overlay/10 rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-teal"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2 bg-accent-teal/20 text-accent-teal rounded-lg text-sm hover:bg-accent-teal/30 transition-colors cursor-pointer disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="flex-1 px-4 py-2 bg-overlay/5 text-text-muted rounded-lg text-sm hover:bg-overlay/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block bg-bg-secondary border border-overlay/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-overlay/10 text-text-muted text-left">
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Discount</th>
                <th className="px-4 py-3 font-medium">Plans</th>
                <th className="px-4 py-3 font-medium">Redemptions</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((promo) => {
                const status = getStatus(promo);
                const isExpanded = expandedId === promo.id;
                return (
                  <React.Fragment key={promo.id}>
                    <tr
                      className="border-b border-overlay/5 text-text-primary cursor-pointer hover:bg-overlay/[0.02]"
                      onClick={() => setExpandedId(isExpanded ? null : promo.id)}
                    >
                      <td className="px-4 py-3 font-mono font-semibold">{promo.code}</td>
                      <td className="px-4 py-3">{promo.discount_percent}%</td>
                      <td className="px-4 py-3 text-text-muted text-xs">{promo.applicable_plans.join(", ")}</td>
                      <td className="px-4 py-3">
                        {promo.current_redemptions}
                        {promo.max_redemptions ? `/${promo.max_redemptions}` : ""}
                      </td>
                      <td className={`px-4 py-3 ${status.color}`}>{status.label}</td>
                      <td className="px-4 py-3 text-text-muted">{formatDate(promo.created_at)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleActive(promo); }}
                          className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                            promo.is_active
                              ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                              : "bg-accent-teal/10 text-accent-teal hover:bg-accent-teal/20"
                          }`}
                        >
                          {promo.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && promo.promo_redemptions.length > 0 && (
                      <tr key={`${promo.id}-detail`} className="border-b border-overlay/5">
                        <td colSpan={7} className="px-4 py-3 bg-overlay/[0.02]">
                          <p className="text-xs text-text-muted mb-2 font-medium">Redemption History</p>
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-text-muted text-left">
                                <th className="pb-1 pr-4">Account</th>
                                <th className="pb-1 pr-4">Platform</th>
                                <th className="pb-1 pr-4">Original</th>
                                <th className="pb-1 pr-4">Discounted</th>
                                <th className="pb-1">Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {promo.promo_redemptions.map((r) => (
                                <tr key={r.id} className="text-text-primary">
                                  <td className="py-1 pr-4 font-mono">{r.account_id}</td>
                                  <td className="py-1 pr-4">{r.platform}</td>
                                  <td className="py-1 pr-4">{formatCents(r.original_price_cents)}</td>
                                  <td className="py-1 pr-4 text-accent-teal">{formatCents(r.discounted_price_cents)}</td>
                                  <td className="py-1 text-text-muted">{formatDate(r.redeemed_at)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                    {isExpanded && promo.promo_redemptions.length === 0 && (
                      <tr key={`${promo.id}-empty`} className="border-b border-overlay/5">
                        <td colSpan={7} className="px-4 py-3 bg-overlay/[0.02] text-text-muted text-xs">
                          No redemptions yet
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {codes.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-text-muted">
                    No promo codes yet. Create your first one!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {codes.length === 0 ? (
          <div className="text-center py-12 text-text-muted">
            No promo codes yet. Create your first one!
          </div>
        ) : (
          codes.map((promo) => {
            const status = getStatus(promo);
            const isExpanded = expandedId === promo.id;
            return (
              <div
                key={promo.id}
                className="bg-bg-secondary border border-overlay/10 rounded-lg overflow-hidden"
              >
                <div
                  className="p-4 cursor-pointer active:bg-overlay/5 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : promo.id)}
                >
                  {/* Top: code + status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-mono font-semibold text-text-primary">{promo.code}</p>
                        <p className="text-xs text-text-muted">{promo.discount_percent}% off</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color} ${status.bg}`}>
                      {status.label}
                    </span>
                  </div>

                  {/* Middle: details */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-text-muted">
                    <span>Plans: {promo.applicable_plans.join(", ")}</span>
                    <span>
                      Redeemed: {promo.current_redemptions}
                      {promo.max_redemptions ? `/${promo.max_redemptions}` : ""}
                    </span>
                  </div>

                  {/* Bottom: date + action */}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-text-muted">Created {formatDate(promo.created_at)}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleActive(promo); }}
                      className={`px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                        promo.is_active
                          ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                          : "bg-accent-teal/10 text-accent-teal hover:bg-accent-teal/20"
                      }`}
                    >
                      {promo.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>

                {/* Expanded: redemption history */}
                {isExpanded && (
                  <div className="border-t border-overlay/10 px-4 py-3 bg-overlay/[0.02]">
                    {promo.promo_redemptions.length === 0 ? (
                      <p className="text-xs text-text-muted">No redemptions yet</p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs text-text-muted font-medium">Redemption History</p>
                        {promo.promo_redemptions.map((r) => (
                          <div key={r.id} className="flex items-center justify-between text-xs">
                            <div className="min-w-0">
                              <span className="font-mono text-text-primary">{r.account_id}</span>
                              <span className="text-text-muted ml-2">{r.platform}</span>
                            </div>
                            <div className="shrink-0 text-right">
                              <span className="text-text-muted line-through mr-2">{formatCents(r.original_price_cents)}</span>
                              <span className="text-accent-teal">{formatCents(r.discounted_price_cents)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
