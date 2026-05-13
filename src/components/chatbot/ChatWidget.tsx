"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Minimize2, Maximize2, Loader2, Sparkles } from "lucide-react";
import { cn, formatRelative } from "@/lib/utils";
const SUGGESTED_PROMPTS = [
  "How many tickets are open this week?",
  "Which team has the most tickets this month?",
  "Show me ticket trends for the last 30 days.",
  "Break down tickets by category this month.",
  "Which technician resolved the most tickets?",
  "How many high-priority tickets are open?",
];

interface Message {
  id:        string;
  role:      "user" | "assistant";
  content:   string;
  createdAt: string;
}

export function ChatWidget() {
  const [open,      setOpen]      = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages,  setMessages]  = useState<Message[]>([]);
  const [input,     setInput]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [unread,    setUnread]    = useState(0);

  const scrollRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);

  // Initial greeting message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id:        "welcome",
        role:      "assistant",
        content:   "Hello! I'm your AI assistant. I can help you analyze ticket data, trends, and SLA metrics.\n\nTry asking me about ticket counts, group performance, or SLA compliance.",
        createdAt: new Date().toISOString(),
      }]);
    }
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Track unread when closed
  useEffect(() => {
    if (!open && messages.length > 1) setUnread((n) => n + 1);
    if (open) setUnread(0);
  }, [messages.length]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = {
      id:        `u-${Date.now()}`,
      role:      "user",
      content:   trimmed,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ message: trimmed, sessionId }),
      });
      const data = await res.json() as { reply?: string; sessionId?: string; error?: string };

      if (data.sessionId) setSessionId(data.sessionId);

      setMessages((prev) => [...prev, {
        id:        `a-${Date.now()}`,
        role:      "assistant",
        content:   data.reply ?? data.error ?? "Sorry, something went wrong.",
        createdAt: new Date().toISOString(),
      }]);
    } catch {
      setMessages((prev) => [...prev, {
        id:        `a-err-${Date.now()}`,
        role:      "assistant",
        content:   "Sorry, I couldn't reach the server. Please try again.",
        createdAt: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [loading, sessionId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => { setOpen((o) => !o); setUnread(0); }}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-brand-primary text-white shadow-glass hover:bg-brand-primary-light transition-colors"
        aria-label="Open AI Assistant"
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.span key="x"  initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X size={22} /></motion.span>
            : <motion.span key="sq" initial={{ rotate: 90, opacity: 0 }}  animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><MessageSquare size={22} /></motion.span>
          }
        </AnimatePresence>
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-raspberry-500 text-white text-[10px] font-bold">
            {unread}
          </span>
        )}
      </button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "fixed bottom-24 right-6 z-50 flex flex-col bg-card border border-border rounded-2xl shadow-glass overflow-hidden",
              minimized ? "w-72 h-14" : "w-80 h-[480px] sm:w-96 sm:h-[520px]",
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-brand-primary text-white shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles size={16} />
                <span className="text-sm font-semibold">AI Assistant</span>
                <span className="flex items-center gap-1 text-xs text-white/70">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  Online
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setMinimized((m) => !m)} className="p-1 rounded hover:bg-white/10 transition-colors">
                  {minimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                </button>
                <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-white/10 transition-colors">
                  <X size={14} />
                </button>
              </div>
            </div>

            {!minimized && (
              <>
                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                  {messages.map((msg) => (
                    <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                      {msg.role === "assistant" && (
                        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-brand-primary text-white shrink-0 mr-2 mt-0.5">
                          <Sparkles size={12} />
                        </div>
                      )}
                      <div className={cn(
                        "max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap",
                        msg.role === "user"
                          ? "bg-brand-primary text-white rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm",
                      )}>
                        {msg.content}
                        <p className={cn("text-[10px] mt-1", msg.role === "user" ? "text-white/60" : "text-muted-foreground")}>
                          {formatRelative(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-brand-primary text-white shrink-0">
                        <Sparkles size={12} />
                      </div>
                      <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                        <Loader2 size={14} className="animate-spin text-muted-foreground" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Suggestion chips (show only with welcome message) */}
                {messages.length <= 1 && (
                  <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                    {SUGGESTED_PROMPTS.slice(0, 3).map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => sendMessage(prompt)}
                        className="text-xs px-2.5 py-1 rounded-full bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input */}
                <div className="px-3 pb-3 pt-1 border-t border-border shrink-0">
                  <div className="flex items-end gap-2 rounded-xl border border-border bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-primary/30">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask about tickets, trends, SLA…"
                      rows={1}
                      className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none max-h-20"
                    />
                    <button
                      onClick={() => sendMessage(input)}
                      disabled={!input.trim() || loading}
                      className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand-secondary text-white disabled:opacity-40 hover:bg-brand-secondary-dark transition-colors shrink-0"
                    >
                      <Send size={13} />
                    </button>
                  </div>
                  <p className="text-center text-[10px] text-muted-foreground mt-1.5">
                    Powered by Claude · Queries live SDP data
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
