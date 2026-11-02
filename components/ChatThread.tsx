"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Loader2 } from "lucide-react";
import type { Message } from "@/lib/bookings";

/** FR12: messages between a student and tutor for one booking (refreshes every 5 seconds). */
export default function ChatThread({ bookingId, me }: { bookingId: number; me: number }) {
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch(`/api/bookings/${bookingId}/messages`).then((r) => r.json()).then((d) => alive && setMessages(d.messages ?? []));
    load();
    const t = setInterval(load, 5000);
    return () => { alive = false; clearInterval(t); };
  }, [bookingId]);

  useEffect(() => end.current?.scrollIntoView({ block: "nearest" }), [messages?.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    const res = await fetch(`/api/bookings/${bookingId}/messages`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: text }),
    });
    const d = await res.json();
    setSending(false);
    if (res.ok) { setMessages(d.messages); setText(""); }
  }

  return (
    <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
      <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
        {messages === null && <Loader2 size={16} className="mx-auto animate-spin text-slate-400" />}
        {messages?.length === 0 && <p className="py-2 text-center text-xs text-slate-400">No messages yet. Say hello!</p>}
        {messages?.map((m) => (
          <div key={m.id} className={`flex ${m.senderId === me ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.senderId === me ? "bg-primary text-white" : "bg-white dark:bg-slate-900"}`}>
              {m.senderId !== me && <p className="text-[11px] font-semibold text-primary">{m.senderName}</p>}
              <p className="whitespace-pre-wrap">{m.body}</p>
              <p className={`mt-0.5 text-[10px] ${m.senderId === me ? "text-white/70" : "text-slate-400"}`}>
                {new Date(m.createdAt + "Z").toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}
        <div ref={end} />
      </div>
      <form onSubmit={send} className="mt-2 flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" className="input py-2" />
        <button disabled={sending} className="btn-primary px-4 py-2" aria-label="Send"><Send size={15} /></button>
      </form>
    </div>
  );
}
