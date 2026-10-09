import { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Send } from 'lucide-react';
import { useChatContext } from '@/context/ChatContext';
import { ChatMessage } from './ChatMessage';
import type { ChatMessage as ChatMessageType } from '@/types';

type SystemKey = 'chatbot.error' | 'chatbot.no_credits' | 'chatbot.rate_limit';

// The server answers with these statuses; anything else is a generic failure.
const KEY_BY_STATUS: Record<number, SystemKey> = { 402: 'chatbot.no_credits', 429: 'chatbot.rate_limit' };

export function ChatWindow() {
  const { t } = useTranslation();
  const { isOpen } = useChatContext();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const greeting = useMemo<ChatMessageType>(
    () => ({ id: 'init', role: 'assistant', content: t('chatbot.initial'), timestamp: new Date() }),
    [t],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');

    const userMsg: ChatMessageType = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    const systemMessage = (key: SystemKey): ChatMessageType => ({
      id: Date.now().toString(),
      role: 'assistant',
      content: t(key),
      contentKey: key,
      timestamp: new Date(),
    });

    const history = [...messages, userMsg]
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      // The API key and the system prompt live on the server (see server/chat).
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json().catch(() => null);

      const reply: unknown = res.ok ? data?.reply : undefined;
      const next: ChatMessageType =
        typeof reply === 'string' && reply
          ? { id: Date.now().toString(), role: 'assistant', content: reply, timestamp: new Date() }
          : systemMessage(KEY_BY_STATUS[res.status] ?? 'chatbot.error');
      setMessages((prev) => [...prev, next]);
    } catch {
      setMessages((prev) => [...prev, systemMessage('chatbot.error')]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 rounded-2xl overflow-hidden shadow-2xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <div
            className="px-4 py-3 flex items-center gap-3"
            style={{ background: 'var(--accent)' }}
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
              DE
            </div>
            <div>
              <p className="text-white font-semibold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {t('chatbot.title')}
              </p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <p className="text-white/70 text-xs">Online</p>
              </div>
            </div>
          </div>

          <div className="h-72 overflow-y-auto p-4">
            {[greeting, ...messages].map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {loading && (
              <div className="flex justify-start mb-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mr-2 mt-0.5"
                  style={{ background: 'var(--accent)' }}
                >
                  DE
                </div>
                <div
                  className="px-3.5 py-2.5 rounded-2xl"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderBottomLeftRadius: 4 }}
                >
                  <div className="flex items-center gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: 'var(--accent)' }}
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                className="flex-1 px-3.5 py-2 rounded-xl text-sm outline-none"
                style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                placeholder={t('chatbot.placeholder')}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                disabled={loading}
              />
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                className="p-2.5 rounded-xl text-white transition-opacity disabled:opacity-40"
                style={{ background: 'var(--accent)' }}
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
