"use client";

import { useState, useEffect, useCallback } from "react";

interface ServerModalProps {
  mode: "create" | "edit";
  serverId?: string;
  onClose: () => void;
  onSaved: () => void;
}

interface ServerForm {
  name: string;
  country: string;
  country_code: string;
  city: string;
  ip_address: string;
  port: string;
  protocol: string;
  is_active: boolean;
  is_premium: boolean;
  marzban_api_url: string;
  marzban_admin_user: string;
  marzban_admin_pass: string;
  marzban_api_key: string;
}

const PROTOCOLS = [
  "wireguard",
  "vless",
  "tcp",
  "shadowsocks",
  "trojan",
  "udp",
];

const emptyForm: ServerForm = {
  name: "",
  country: "",
  country_code: "",
  city: "",
  ip_address: "",
  port: "",
  protocol: "wireguard",
  is_active: true,
  is_premium: false,
  marzban_api_url: "",
  marzban_admin_user: "",
  marzban_admin_pass: "",
  marzban_api_key: "",
};

export function ServerModal({ mode, serverId, onClose, onSaved }: ServerModalProps) {
  const [form, setForm] = useState<ServerForm>(emptyForm);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ServerForm, string>>>({});
  const [apiError, setApiError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);

  // Fetch server data in edit mode
  useEffect(() => {
    if (mode !== "edit" || !serverId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/vpn/servers/${serverId}`);
        if (!res.ok) throw new Error("Failed to load server");
        const { server } = await res.json();
        if (cancelled) return;
        setForm({
          name: server.name || "",
          country: server.country || "",
          country_code: server.country_code || "",
          city: server.city || "",
          ip_address: server.ip_address || "",
          port: String(server.port || ""),
          protocol: server.protocol || "wireguard",
          is_active: server.is_active ?? true,
          is_premium: server.is_premium ?? false,
          marzban_api_url: server.marzban_api_url || "",
          marzban_admin_user: server.marzban_admin_user || "",
          marzban_admin_pass: server.marzban_admin_pass || "",
          marzban_api_key: server.marzban_api_key || "",
        });
      } catch {
        if (!cancelled) setApiError("Failed to load server data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [mode, serverId]);

  // Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !saving) onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose, saving]);

  const updateField = useCallback(<K extends keyof ServerForm>(key: K, value: ServerForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  function validate(): boolean {
    const errs: Partial<Record<keyof ServerForm, string>> = {};
    if (!form.name.trim()) errs.name = "Required";
    if (!form.country.trim()) errs.country = "Required";
    if (!form.country_code.trim()) errs.country_code = "Required";
    if (form.country_code.length > 4) errs.country_code = "Max 4 chars";
    if (!form.ip_address.trim()) errs.ip_address = "Required";
    if (!form.port || isNaN(Number(form.port)) || Number(form.port) < 1)
      errs.port = "Valid port required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setApiError("");
    try {
      const body = {
        ...form,
        port: Number(form.port),
        marzban_api_url: form.marzban_api_url || null,
        marzban_admin_user: form.marzban_admin_user || null,
        marzban_admin_pass: form.marzban_admin_pass || null,
        marzban_api_key: form.marzban_api_key || null,
      };

      const url =
        mode === "edit"
          ? `/api/admin/vpn/servers/${serverId}`
          : "/api/admin/vpn/servers";
      const method = mode === "edit" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || "Failed to save server");
      }
      onSaved();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection() {
    if (!serverId) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`/api/admin/vpn/servers/${serverId}/test`, {
        method: "POST",
      });
      const json = await res.json();
      if (res.ok && json.status === "ok") {
        setTestResult({ ok: true, message: `Connected (${json.latency_ms}ms)` });
      } else {
        setTestResult({ ok: false, message: json.error || "Connection failed" });
      }
    } catch {
      setTestResult({ ok: false, message: "Request failed" });
    } finally {
      setTesting(false);
    }
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget && !saving) onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-bg-secondary border border-overlay/10 rounded-xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-text-primary">
          {mode === "create" ? "Add Server" : "Edit Server"}
        </h2>

        {apiError && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {apiError}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-overlay/5 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Row 1: Name, Country */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Name" error={errors.name}>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className={inputClass(errors.name)}
                  placeholder="Germany #1"
                />
              </Field>
              <Field label="Country" error={errors.country}>
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => updateField("country", e.target.value)}
                  className={inputClass(errors.country)}
                  placeholder="Germany"
                />
              </Field>
            </div>

            {/* Row 2: Country Code, City */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Country Code" error={errors.country_code}>
                <input
                  type="text"
                  value={form.country_code}
                  onChange={(e) => updateField("country_code", e.target.value.toUpperCase())}
                  className={inputClass(errors.country_code)}
                  placeholder="DE"
                  maxLength={4}
                />
              </Field>
              <Field label="City" error={errors.city}>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  className={inputClass(errors.city)}
                  placeholder="Frankfurt"
                />
              </Field>
            </div>

            {/* Row 3: IP Address, Port */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="IP Address" error={errors.ip_address}>
                <input
                  type="text"
                  value={form.ip_address}
                  onChange={(e) => updateField("ip_address", e.target.value)}
                  className={inputClass(errors.ip_address)}
                  placeholder="72.61.87.54"
                />
              </Field>
              <Field label="Port" error={errors.port}>
                <input
                  type="number"
                  value={form.port}
                  onChange={(e) => updateField("port", e.target.value)}
                  className={inputClass(errors.port)}
                  placeholder="51820"
                  min={1}
                  max={65535}
                />
              </Field>
            </div>

            {/* Row 4: Protocol */}
            <Field label="Protocol">
              <select
                value={form.protocol}
                onChange={(e) => updateField("protocol", e.target.value)}
                className="w-full bg-overlay/5 border border-overlay/10 rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-teal"
              >
                {PROTOCOLS.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </Field>

            {/* Row 5: Toggles */}
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => updateField("is_active", e.target.checked)}
                  className="accent-[var(--color-accent-teal)]"
                />
                <span className="text-sm text-text-primary">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_premium}
                  onChange={(e) => updateField("is_premium", e.target.checked)}
                  className="accent-[var(--color-accent-teal)]"
                />
                <span className="text-sm text-text-primary">Premium</span>
              </label>
            </div>

            {/* Marzban separator */}
            <div className="border-t border-overlay/10 pt-4">
              <span className="text-[11px] uppercase tracking-wider text-text-muted">
                Marzban Configuration
              </span>
            </div>

            {/* Marzban API URL */}
            <Field label="Marzban API URL">
              <input
                type="text"
                value={form.marzban_api_url}
                onChange={(e) => updateField("marzban_api_url", e.target.value)}
                className="w-full bg-overlay/5 border border-overlay/10 rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-teal"
                placeholder="https://server:port"
              />
            </Field>

            {/* Marzban User, Pass */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Admin User">
                <input
                  type="text"
                  value={form.marzban_admin_user}
                  onChange={(e) => updateField("marzban_admin_user", e.target.value)}
                  className="w-full bg-overlay/5 border border-overlay/10 rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-teal"
                  placeholder="admin"
                />
              </Field>
              <Field label="Admin Password">
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={form.marzban_admin_pass}
                    onChange={(e) => updateField("marzban_admin_pass", e.target.value)}
                    className="w-full bg-overlay/5 border border-overlay/10 rounded-lg px-3 py-2 pr-9 text-text-primary text-sm focus:outline-none focus:border-accent-teal"
                    placeholder="password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary text-xs cursor-pointer"
                  >
                    {showPass ? "Hide" : "Show"}
                  </button>
                </div>
              </Field>
            </div>

            {/* Marzban API Key */}
            <Field label="API Key (optional)">
              <input
                type="text"
                value={form.marzban_api_key}
                onChange={(e) => updateField("marzban_api_key", e.target.value)}
                className="w-full bg-overlay/5 border border-overlay/10 rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-teal"
                placeholder="Optional API key"
              />
            </Field>

            {/* Test connection (edit mode only) */}
            {mode === "edit" && serverId && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="px-4 py-2 bg-overlay/5 text-text-muted rounded-lg text-sm hover:bg-overlay/10 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {testing ? "Testing..." : "Test Connection"}
                </button>
                {testResult && (
                  <span
                    className={`text-xs ${testResult.ok ? "text-green-400" : "text-red-400"}`}
                  >
                    {testResult.message}
                  </span>
                )}
              </div>
            )}

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 bg-overlay/5 text-text-muted rounded-lg text-sm hover:bg-overlay/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-accent-teal/20 text-accent-teal rounded-lg text-sm hover:bg-accent-teal/30 transition-colors cursor-pointer disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : mode === "create"
                    ? "Create Server"
                    : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-wider text-text-muted mb-1 block">
        {label}
      </label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

function inputClass(error?: string): string {
  const base =
    "w-full bg-overlay/5 border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none";
  return error
    ? `${base} border-red-500/40 focus:border-red-400`
    : `${base} border-overlay/10 focus:border-accent-teal`;
}
