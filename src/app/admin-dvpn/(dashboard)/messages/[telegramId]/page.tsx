"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminLoader } from "@/components/admin/admin-loader";

interface UserInfo {
  telegram_id: number;
  account_id: string | null;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  bot_source: string | null;
  bot_state: string | null;
  total_messages: number | null;
  last_active_at: string | null;
  current_device: string | null;
  current_issue: string | null;
  support_status: string | null;
  support_status_updated_at: string | null;
  support_status_updated_by: string | null;
}

interface AccountInfo {
  id: string;
  account_id: string;
  subscription_tier: string;
  subscription_expires_at: string | null;
  subscription_store: string | null;
  subscription_product_id: string | null;
  max_devices: number;
  created_at: string;
}

interface Message {
  id: string;
  direction: string;
  content: string;
  template_key: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

interface LookupUser {
  telegram_id: number | null;
  username: string | null;
  first_name: string | null;
  bot_source: string | null;
  bot_state: string | null;
  support_status: string | null;
}

interface LookupResult {
  source: string;
  user: LookupUser | null;
  account: AccountInfo | null;
}

const CONTENT_LABELS: Record<string, string> = {
  vpn_config_created: "VPN configuration created and sent to user",
  "welcome + link_prompt": "Welcome message — asked to link account",
  "welcome + menu": "Welcome message with menu",
  "human.ask_code": "Asked user for their account code",
};

function readableContent(content: string, templateKey: string | null): string {
  if (CONTENT_LABELS[content]) return CONTENT_LABELS[content];
  if (templateKey && CONTENT_LABELS[templateKey])
    return CONTENT_LABELS[templateKey];
  return content;
}

const STATUSES = [
  { value: "new", label: "New", color: "text-blue-400 border-blue-500/40" },
  { value: "in_progress", label: "In Progress", color: "text-yellow-400 border-yellow-500/40" },
  { value: "solved", label: "Solved", color: "text-green-400 border-green-500/40" },
  { value: "refunded", label: "Refunded", color: "text-purple-400 border-purple-500/40" },
  { value: "spam", label: "Spam", color: "text-orange-400 border-orange-500/40" },
  { value: "banned", label: "Banned", color: "text-red-400 border-red-500/40" },
];

function getStatusStyle(status: string) {
  return STATUSES.find((s) => s.value === status)?.color ?? "text-text-muted border-overlay/10";
}

export default function ConversationPage() {
  const { telegramId } = useParams<{ telegramId: string }>();
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Lookup state
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/admin/messages/${telegramId}`);
      const data = await res.json();
      setUser(data.user);
      setAccount(data.account || null);
      setMessages(data.messages || []);
      setLoading(false);
    }
    load();
  }, [telegramId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function updateStatus(newStatus: string) {
    setStatusUpdating(true);
    const res = await fetch(`/api/admin/messages/${telegramId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setUser((prev) =>
        prev ? { ...prev, support_status: newStatus, support_status_updated_at: new Date().toISOString() } : prev
      );
    }
    setStatusUpdating(false);
  }

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!lookupQuery.trim()) return;
    setLookupLoading(true);
    setLookupError(null);
    setLookupResult(null);

    const res = await fetch(`/api/admin/messages/lookup?q=${encodeURIComponent(lookupQuery.trim())}`);
    const data = await res.json();
    setLookupLoading(false);

    if (!res.ok) {
      setLookupError(data.error || "Not found");
      return;
    }
    setLookupResult(data);
  }

  function formatTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function isExpired(iso: string | null) {
    if (!iso) return false;
    return new Date(iso) < new Date();
  }

  if (loading) {
    return <AdminLoader />;
  }

  const currentStatus = user?.support_status || "new";

  return (
    <div className="flex gap-6 h-[calc(100vh-4rem)]">
      {/* Left: Chat */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Back button */}
        <button
          onClick={() => router.push("/admin-dvpn/messages")}
          className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary mb-3 cursor-pointer shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Back to Messages
        </button>

        {/* Chat messages */}
        <div className="border border-overlay/10 rounded-lg p-4 space-y-3 flex-1 overflow-y-auto min-h-0">
          {messages.length === 0 ? (
            <p className="text-text-muted text-center py-8">No messages</p>
          ) : (
            messages.map((m) => {
              const isUser = m.direction === "in";
              return (
                <div key={m.id} className={`flex ${isUser ? "justify-start" : "justify-end"}`}>
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      isUser
                        ? "bg-overlay/10 text-text-primary"
                        : "bg-accent-teal/20 text-text-primary"
                    }`}
                  >
                    {CONTENT_LABELS[m.content] ? (
                      <p className="text-sm italic text-text-muted">
                        {readableContent(m.content, m.template_key)}
                      </p>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {readableContent(m.content, m.template_key) || "—"}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-text-muted">
                        {formatTime(m.created_at)}
                      </span>
                      {m.template_key && (
                        <span className="text-[10px] text-text-muted font-mono">
                          {m.template_key}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Right: Status + Info + Lookup */}
      <div className="w-80 shrink-0 flex flex-col gap-4 overflow-y-auto">
        {/* User header */}
        {user && (
          <div className="border border-overlay/10 rounded-lg p-4">
            <h2 className="text-base font-semibold text-text-primary truncate">
              {user.username ? `@${user.username}` : user.first_name || String(user.telegram_id)}
            </h2>
            <div className="flex flex-wrap gap-2 mt-2">
              {user.bot_source && (
                <span
                  className={`px-2 py-0.5 rounded-lg text-xs border ${
                    user.bot_source === "support"
                      ? "text-orange-400 border-orange-500/40"
                      : "text-accent-teal border-accent-teal/40"
                  }`}
                >
                  {user.bot_source}
                </span>
              )}
              {user.bot_state && (
                <span className="px-2 py-0.5 rounded-lg text-xs border border-overlay/20 text-text-muted">
                  {user.bot_state}
                </span>
              )}
            </div>
            <div className="mt-3 space-y-1.5 text-xs text-text-muted">
              <div className="flex justify-between">
                <span>Telegram ID</span>
                <span className="font-mono text-text-primary">{user.telegram_id}</span>
              </div>
              {user.first_name && (
                <div className="flex justify-between">
                  <span>Name</span>
                  <span className="text-text-primary">{user.first_name} {user.last_name || ""}</span>
                </div>
              )}
              {user.total_messages != null && (
                <div className="flex justify-between">
                  <span>Messages</span>
                  <span className="text-text-primary">{user.total_messages}</span>
                </div>
              )}
              {user.last_active_at && (
                <div className="flex justify-between">
                  <span>Last active</span>
                  <span className="text-text-primary">{formatTime(user.last_active_at)}</span>
                </div>
              )}
              {user.current_device && (
                <div className="flex justify-between">
                  <span>Device</span>
                  <span className="text-text-primary">{user.current_device}</span>
                </div>
              )}
              {user.current_issue && (
                <div className="flex justify-between">
                  <span>Issue</span>
                  <span className="text-red-400">{user.current_issue}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status */}
        <div className="border border-overlay/10 rounded-lg p-4">
          <h3 className="text-sm font-medium text-text-muted mb-3">Status</h3>
          <div className="grid grid-cols-2 gap-2">
            {STATUSES.map((s) => (
              <button
                key={s.value}
                onClick={() => updateStatus(s.value)}
                disabled={statusUpdating || currentStatus === s.value}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer disabled:cursor-default ${
                  currentStatus === s.value
                    ? `${s.color} ring-1 ring-current`
                    : "bg-overlay/5 text-text-muted border-overlay/10 hover:bg-overlay/10"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          {user?.support_status_updated_by && (
            <p className="text-[10px] text-text-muted mt-2">
              Set by {user.support_status_updated_by}
              {user.support_status_updated_at && ` · ${formatTime(user.support_status_updated_at)}`}
            </p>
          )}
        </div>

        {/* Subscription info (linked account) */}
        {account && (
          <div className="border border-overlay/10 rounded-lg p-4">
            <h3 className="text-sm font-medium text-text-muted mb-3">Subscription</h3>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-text-muted">Account</span>
                <span className="font-mono text-text-primary">{account.account_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Tier</span>
                <span className={account.subscription_tier === "free" ? "text-text-muted" : "text-accent-teal font-medium"}>
                  {account.subscription_tier}
                </span>
              </div>
              {account.subscription_expires_at && (
                <div className="flex justify-between">
                  <span className="text-text-muted">Expires</span>
                  <span className={isExpired(account.subscription_expires_at) ? "text-red-400" : "text-text-primary"}>
                    {formatDate(account.subscription_expires_at)}
                    {isExpired(account.subscription_expires_at) && " (expired)"}
                  </span>
                </div>
              )}
              {account.subscription_store && (
                <div className="flex justify-between">
                  <span className="text-text-muted">Store</span>
                  <span className="text-text-primary">{account.subscription_store}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-text-muted">Max devices</span>
                <span className="text-text-primary">{account.max_devices}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Created</span>
                <span className="text-text-primary">{formatDate(account.created_at)}</span>
              </div>
            </div>
          </div>
        )}

        {/* User lookup */}
        <div className="border border-overlay/10 rounded-lg p-4">
          <h3 className="text-sm font-medium text-text-muted mb-3">User Lookup</h3>
          <form onSubmit={handleLookup} className="space-y-2">
            <input
              type="text"
              value={lookupQuery}
              onChange={(e) => setLookupQuery(e.target.value)}
              placeholder="Telegram ID, @user, or VPN-code"
              className="w-full px-3 py-2 text-xs bg-overlay/5 border border-overlay/10 rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-teal/50"
            />
            <button
              type="submit"
              disabled={lookupLoading || !lookupQuery.trim()}
              className="w-full px-3 py-1.5 text-xs bg-accent-teal/20 text-accent-teal rounded-lg hover:bg-accent-teal/30 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default"
            >
              {lookupLoading ? "Searching..." : "Search"}
            </button>
          </form>

          {lookupError && (
            <div className="mt-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
              {lookupError}
            </div>
          )}

          {lookupResult && (
            <div className="mt-3 space-y-2 text-xs">
              <div className="text-[10px] text-text-muted">
                Found via {lookupResult.source}
              </div>

              {lookupResult.user && (
                <div className="space-y-1">
                  {lookupResult.user.username && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">Username</span>
                      <span className="text-text-primary">@{lookupResult.user.username}</span>
                    </div>
                  )}
                  {lookupResult.user.telegram_id && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">Telegram ID</span>
                      <button
                        onClick={() =>
                          router.push(`/admin-dvpn/messages/${lookupResult.user!.telegram_id}`)
                        }
                        className="text-accent-teal hover:underline cursor-pointer font-mono"
                      >
                        {lookupResult.user.telegram_id}
                      </button>
                    </div>
                  )}
                  {lookupResult.user.support_status && (
                    <div className="flex justify-between items-center">
                      <span className="text-text-muted">Status</span>
                      <span className={`px-1.5 py-0.5 rounded-lg text-[10px] border ${getStatusStyle(lookupResult.user.support_status)}`}>
                        {STATUSES.find((s) => s.value === lookupResult.user!.support_status)?.label || lookupResult.user.support_status}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {lookupResult.account && (
                <div className="pt-2 border-t border-overlay/10 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Account</span>
                    <span className="font-mono text-text-primary">{lookupResult.account.account_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Tier</span>
                    <span className={lookupResult.account.subscription_tier === "free" ? "text-text-muted" : "text-accent-teal font-medium"}>
                      {lookupResult.account.subscription_tier}
                    </span>
                  </div>
                  {lookupResult.account.subscription_expires_at && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">Expires</span>
                      <span className={isExpired(lookupResult.account.subscription_expires_at) ? "text-red-400" : "text-text-primary"}>
                        {formatDate(lookupResult.account.subscription_expires_at)}
                      </span>
                    </div>
                  )}
                  {lookupResult.account.subscription_store && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">Store</span>
                      <span className="text-text-primary">{lookupResult.account.subscription_store}</span>
                    </div>
                  )}
                </div>
              )}

              {!lookupResult.account && (
                <div className="text-text-muted text-center py-1">No account linked</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
