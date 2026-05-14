import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useChatContext } from '@/components/Chatbot/ChatButton';

const STORAGE_KEY = 'diezte_welcomed_v1';

/* ── Stable particle positions ── */
const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  x: (i * 73 + 17) % 100,
  y: (i * 47 + 31) % 100,
  emoji: ['✨', '⚛️', '🔷', '💡', '🚀', '🤖', '💻', '🎯', '⚡', '🧠', '🔮', '🌟'][i],
  delay: i * 0.15,
  duration: 2 + (i % 3),
}));

/* ── DIEZTE robot SVG mascot ── */
function DiеztеBot() {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -20 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.2 }}
      className="relative flex items-center justify-center"
      style={{ width: 100, height: 120 }}
    >
      <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" width="100" height="120">
        {/* Antenna */}
        <motion.line
          x1="50" y1="8" x2="50" y2="20"
          stroke="#4A9FD9" strokeWidth="3" strokeLinecap="round"
          animate={{ scaleY: [1, 1.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.circle
          cx="50" cy="6" r="5" fill="#7EC8E3"
          animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Head */}
        <rect x="20" y="20" width="60" height="48" rx="14" fill="#1b2d4f" stroke="#4A9FD9" strokeWidth="2"/>

        {/* Eyes */}
        <motion.rect
          x="28" y="34" width="16" height="10" rx="5" fill="#4A9FD9"
          animate={{ scaleY: [1, 0.1, 1] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
        <motion.rect
          x="56" y="34" width="16" height="10" rx="5" fill="#4A9FD9"
          animate={{ scaleY: [1, 0.1, 1] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />

        {/* Mouth / smile */}
        <path d="M 34 52 Q 50 62 66 52" stroke="#7EC8E3" strokeWidth="2.5" strokeLinecap="round" fill="none"/>

        {/* Neck */}
        <rect x="44" y="68" width="12" height="8" rx="2" fill="#4A9FD9"/>

        {/* Body */}
        <rect x="16" y="76" width="68" height="40" rx="14" fill="#1b2d4f" stroke="#4A9FD9" strokeWidth="2"/>

        {/* DE badge on chest */}
        <rect x="30" y="86" width="40" height="20" rx="6" fill="#4A9FD9" fillOpacity="0.2" stroke="#4A9FD9" strokeWidth="1.5"/>
        <text x="50" y="100" textAnchor="middle" fill="#7EC8E3" fontSize="11" fontWeight="900" fontFamily="Arial Black, Arial, sans-serif">DE</text>

        {/* Arms */}
        <motion.rect
          x="2" y="80" width="14" height="28" rx="7" fill="#1b2d4f" stroke="#4A9FD9" strokeWidth="2"
          animate={{ rotate: [0, 12, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          style={{ transformOrigin: '9px 80px' }}
        />
        <motion.rect
          x="84" y="80" width="14" height="28" rx="7" fill="#1b2d4f" stroke="#4A9FD9" strokeWidth="2"
          animate={{ rotate: [0, -12, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '91px 80px' }}
        />
      </svg>
    </motion.div>
  );
}

/* ── Typing text ── */
function TypingText({ text, speed = 28 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      {displayed.length < text.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="ml-0.5 inline-block w-0.5 h-4 align-middle"
          style={{ background: 'var(--accent)' }}
        />
      )}
    </span>
  );
}

export function WelcomeModal() {
  const { i18n } = useTranslation();
  const { setIsOpen } = useChatContext();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const already = localStorage.getItem(STORAGE_KEY);
    if (!already) {
      const timer = setTimeout(() => setShow(true), 1600);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShow(false);
  };

  const openChat = () => {
    dismiss();
    setTimeout(() => setIsOpen(true), 300);
  };

  const isEs = i18n.language === 'es';

  const greeting = isEs
    ? '¡Hola! Soy DIEZTE 🤖'
    : 'Hey there! I\'m DIEZTE 🤖';

  const body = isEs
    ? 'El asistente virtual de Diego. Podés preguntarme sobre su experiencia, proyectos, tecnologías o cualquier cosa de su CV. ¡Solo presioná la burbuja de chat! 💬'
    : 'Diego\'s AI assistant. Ask me about his experience, projects, tech stack or anything from his CV. Just tap the chat bubble! 💬';

  const ctaChat = isEs ? '¡Hablar con DIEZTE!' : 'Chat with DIEZTE!';
  const ctaDismiss = isEs ? 'Ahora no' : 'Maybe later';

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60]"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={dismiss}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 60 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="fixed inset-0 z-[61] flex items-center justify-center px-4"
            style={{ pointerEvents: 'none' }}
          >
            <div
              className="relative w-full max-w-sm rounded-3xl p-6 flex flex-col items-center gap-4 overflow-hidden"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                boxShadow: '0 0 60px rgba(74,159,217,0.2), 0 24px 48px rgba(0,0,0,0.4)',
                pointerEvents: 'all',
              }}
            >
              {/* Floating emoji particles */}
              {PARTICLES.map((p) => (
                <motion.div
                  key={p.id}
                  className="absolute text-sm pointer-events-none select-none"
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                  animate={{ y: [0, -10, 0], opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
                >
                  {p.emoji}
                </motion.div>
              ))}

              {/* Glow bg */}
              <div
                className="absolute inset-0 opacity-5 pointer-events-none"
                style={{ background: 'radial-gradient(circle at 50% 30%, #4A9FD9, transparent 70%)' }}
              />

              {/* Robot */}
              <DiеztеBot />

              {/* Speech bubble */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="relative w-full rounded-2xl px-5 py-4"
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                }}
              >
                {/* Bubble pointer */}
                <div
                  className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45"
                  style={{ background: 'var(--bg-primary)', borderLeft: '1px solid var(--border)', borderTop: '1px solid var(--border)' }}
                />

                <p
                  className="text-sm font-bold mb-2"
                  style={{ color: 'var(--accent)', fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {greeting}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  <TypingText text={body} speed={22} />
                </p>
              </motion.div>

              {/* Buttons */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="flex gap-3 w-full"
              >
                <button
                  onClick={openChat}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 hover:brightness-110"
                  style={{
                    background: 'var(--accent)',
                    boxShadow: '0 0 20px var(--glow)',
                  }}
                >
                  {ctaChat}
                </button>
                <button
                  onClick={dismiss}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-70"
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {ctaDismiss}
                </button>
              </motion.div>

              {/* Footer note */}
              <p className="text-xs text-center" style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>
                {isEs ? 'Este mensaje solo aparece una vez 👋' : 'This message only appears once 👋'}
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
