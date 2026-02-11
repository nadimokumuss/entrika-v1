"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { messagingLib } from "@/lib/shared";
import { supabase } from "@/lib/supabase";
import type { Message } from "@entrika/shared";
import { Send, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ChatPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const data = await messagingLib.fetchMessages(matchId);
      setMessages(data);
      setLoading(false);

      if (user) {
        messagingLib.markMessagesAsRead(matchId, user.id);
      }
    }
    load();

    const channel = messagingLib.subscribeToMessages(matchId, (newMsg) => {
      setMessages((prev) => [...prev, newMsg]);
      if (user && newMsg.sender_id !== user.id) {
        messagingLib.markMessagesAsRead(matchId, user.id);
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !user) return;
    const text = input;
    setInput("");
    await messagingLib.sendMessage(matchId, user.id, text);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border-light)] px-4 py-3 flex items-center gap-3">
        <Link href="/messages" className="p-1 rounded-lg hover:bg-[var(--card)]">
          <ArrowLeft size={20} className="text-[var(--text)]" />
        </Link>
        <h1 className="text-lg font-bold text-[var(--text)]">Sohbet</h1>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-muted)]">
            Henuz mesaj yok. Ilk mesaji gonder!
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                    isMine
                      ? "text-white rounded-br-sm"
                      : "bg-[var(--card)] text-[var(--text)] rounded-bl-sm"
                  }`}
                  style={isMine ? { background: "var(--primary)" } : undefined}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isMine ? "text-white/70" : "text-[var(--text-muted)]"}`}>
                    {new Date(msg.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[var(--border-light)] px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Mesaj yaz..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--card)] text-[var(--text)] placeholder:text-[var(--text-muted)] border border-[var(--border-light)] focus:border-[var(--primary)] focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2.5 rounded-xl text-white disabled:opacity-40"
            style={{ background: "var(--primary)" }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
