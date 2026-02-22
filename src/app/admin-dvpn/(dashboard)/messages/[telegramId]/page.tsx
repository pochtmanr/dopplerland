"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

interface UserInfo {
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  bot_source: string | null;
  bot_state: string | null;
  total_messages: number | null;
  last_active_at: string | null;
  current_device: string | null;
  current_issue: string | null;
}

interface Message {
  id: string;
  direction: string;
  content: string;
  template_key: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

export default function ConversationPage() {
  const { telegramId } = useParams<{ telegramId: string }>();
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/admin/messages/${telegramId}`);
      const data = await res.json();
      setUser(data.user);
      setMessages(data.messages || []);
      setLoading(false);
    }
    load();
  }, [telegramId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function formatTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  if (loading) {
    return <div className="text-text-muted py-12 text-center">Loading conversation…</div>;
  }

  return (
    <div className="max-w-4xl">
      {/* Back button */}
      <button
        onClick={() => router.push("/admin-dvpn/messages")}
        className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary mb-4 cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Back to Messages
      </button>

      {/* User info header */}
      {user && (
        <div className="border border-overlay/10 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <h2 className="text-lg font-semibold text-text-primary">
              {user.username ? `@${user.username}` : user.first_name || String(user.telegram_id)}
            </h2>
            {user.bot_source && (
              <span className={`px-2 py-0.5 rounded text-xs ${
                user.bot_source === "support"
                  ? "bg-orange-500/20 text-orange-400"
                  : "bg-accent-teal/20 text-accent-teal"
              }`}>
                {user.bot_source}
              </span>
            )}
            {user.bot_state && (
              <span className="px-2 py-0.5 rounded text-xs bg-overlay/10 text-text-muted">
                {user.bot_state}
              </span>
            )}
          </div>
          <div className="flex gap-6 mt-2 text-sm text-text-muted flex-wrap">
            {user.first_name && <span>Name: {user.first_name} {user.last_name || ""}</span>}
            {user.total_messages != null && <span>Messages: {user.total_messages}</span>}
            {user.last_active_at && <span>Last active: {formatTime(user.last_active_at)}</span>}
            {user.current_device && <span>Device: {user.current_device}</span>}
            {user.current_issue && <span>Issue: {user.current_issue}</span>}
          </div>
        </div>
      )}

      {/* Chat messages */}
      <div className="border border-overlay/10 rounded-lg p-4 space-y-3 max-h-[600px] overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-text-muted text-center py-8">No messages</p>
        ) : (
          messages.map((m) => {
            const isUser = m.direction === "in";
            return (
              <div key={m.id} className={`flex ${isUser ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[75%] rounded-lg px-3 py-2 ${
                  isUser
                    ? "bg-overlay/10 text-text-primary"
                    : "bg-accent-teal/20 text-text-primary"
                }`}>
                  <p className="text-sm whitespace-pre-wrap break-words">{m.content || "—"}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-text-muted">{formatTime(m.created_at)}</span>
                    {m.template_key && (
                      <span className="text-[10px] text-text-muted font-mono">{m.template_key}</span>
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
  );
}
