"use client";

import { useEffect, useState } from "react";

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

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-bg-secondary border border-white/10 rounded-xl p-5">
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

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function getStatus(promo: PromoCode): { label: string; color: string } {
  if (!promo.is_active) return { label: "Inactive", color: "text-text-muted" };
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) return { label: "Expired", color: "text-yellow-400" };
  if (promo.max_redemptions && promo.current_redemptions >= promo.max_redemptions) return { label: "Depleted", color: "text-orange-400" };
  return { label: "Active", color: "text-accent-teal" };
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
  if (loading) return <p className="text-text-muted">Loading promo codes...</p>;

  const totalCodes = codes.length;
  const activeCodes = codes.filter((c) => c.is_active).length;
  const totalRedemptions = codes.reduce((sum, c) => sum + c.current_redemptions, 0);
  const totalSaved = codes.reduce(
    (sum, c) => sum + c.promo_redemptions.reduce((s, r) => s + (r.original_price_cents - r.discounted_price_cents), 0),
    0
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary">Promo Codes</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-accent-teal/20 text-accent-teal rounded-lg text-sm hover:bg-accent-teal/30 transition-colors cursor-pointer"
        >
          + Create Code
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Codes" value={totalCodes} />
        <StatCard label="Active Codes" value={activeCodes} />
        <StatCard label="Total Redemptions" value={totalRedemptions} />
        <StatCard label="Customer Savings" value={formatCents(totalSaved)} />
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <form
            onSubmit={handleCreate}
            className="bg-bg-secondary border border-white/10 rounded-xl p-6 w-full max-w-md space-y-4"
          >
            <h2 className="text-lg font-semibold text-text-primary">Create Promo Code</h2>

            <div>
              <label className="text-sm text-text-muted block mb-1">Code</label>
              <input
                type="text"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-teal"
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
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-teal"
                required
              />
            </div>

            <div>
              <label className="text-sm text-text-muted block mb-1">Applicable Plans</label>
              <div className="flex gap-3">
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
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-teal"
                placeholder="Unlimited"
              />
            </div>

            <div>
              <label className="text-sm text-text-muted block mb-1">Expiry Date (optional)</label>
              <input
                type="datetime-local"
                value={formExpiry}
                onChange={(e) => setFormExpiry(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-teal"
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
                className="flex-1 px-4 py-2 bg-white/5 text-text-muted rounded-lg text-sm hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-bg-secondary border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-text-muted text-left">
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
                <>
                  <tr
                    key={promo.id}
                    className="border-b border-white/5 text-text-primary cursor-pointer hover:bg-white/[0.02]"
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
                    <tr key={`${promo.id}-detail`} className="border-b border-white/5">
                      <td colSpan={7} className="px-4 py-3 bg-white/[0.02]">
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
                    <tr key={`${promo.id}-empty`} className="border-b border-white/5">
                      <td colSpan={7} className="px-4 py-3 bg-white/[0.02] text-text-muted text-xs">
                        No redemptions yet
                      </td>
                    </tr>
                  )}
                </>
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
  );
}
