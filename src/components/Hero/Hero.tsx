import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { TypeAnimation } from 'react-type-animation';
import { ArrowDown, Download } from 'lucide-react';

/* Stable particle positions — computed once, not on every render */
const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  left: ((i * 37 + 11) % 100),
  top: ((i * 53 + 7) % 100),
  size: (i % 3) + 1.5,
  duration: 4 + (i % 5),
  delay: (i % 6) * 0.4,
  opacity: 0.06 + (i % 4) * 0.06,
}));

export function Hero() {
  const { t } = useTranslation();

  const typingSequence = [
    'Software Engineer', 2000,
    'Frontend Developer', 2000,
    'Fullstack Developer', 2000,
    'AI Enthusiast', 2000,
  ];

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* ── Animated aurora blobs ── */}
      <div className="absolute inset-0 -z-20 overflow-hidden" aria-hidden="true">
        <motion.div
          className="hero-blob"
          style={{ width: 700, height: 700, top: '-20%', left: '-15%' }}
          animate={{ x: [0, 60, -30, 0], y: [0, -40, 60, 0], scale: [1, 1.15, 0.95, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="hero-blob hero-blob--2"
          style={{ width: 600, height: 600, bottom: '-10%', right: '-10%' }}
          animate={{ x: [0, -50, 40, 0], y: [0, 50, -40, 0], scale: [1, 0.9, 1.1, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        />
        <motion.div
          className="hero-blob hero-blob--3"
          style={{ width: 400, height: 400, top: '40%', left: '40%' }}
          animate={{ x: [0, 80, -60, 0], y: [0, -60, 40, 0], scale: [1, 1.2, 0.85, 1] }}
          transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
        />
      </div>

      {/* ── Grid overlay ── */}
      <div className="hero-grid absolute inset-0 -z-10" aria-hidden="true" />

      {/* ── Floating particles ── */}
      <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        {PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.left}%`,
              top: `${p.top}%`,
              background: 'var(--accent)',
              opacity: p.opacity,
            }}
            animate={{ y: [0, -28, 0], opacity: [p.opacity, p.opacity * 4, p.opacity] }}
            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-sm font-medium tracking-widest uppercase mb-4"
          style={{ color: 'var(--accent)' }}
        >
          {t('hero.greeting')}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-5xl sm:text-7xl md:text-8xl font-bold mb-6 leading-none"
          style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-primary)' }}
        >
          {t('hero.name')}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-2xl sm:text-3xl font-semibold mb-6 h-10"
          style={{ color: 'var(--accent)', fontFamily: "'Space Grotesk', sans-serif" }}
        >
          <TypeAnimation
            sequence={typingSequence}
            wrapper="span"
            repeat={Infinity}
            cursor={true}
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="text-base sm:text-lg max-w-2xl mx-auto mb-10"
          style={{ color: 'var(--text-secondary)' }}
        >
          {t('hero.subtitle')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-3.5 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105"
            style={{ background: 'var(--accent)', boxShadow: '0 0 28px var(--glow)' }}
          >
            {t('hero.cta_projects')}
          </button>

          <a
            href="/CV-Diego-Estela-Lopez-2026.pdf"
            download="CV Diego Ezequiel Estela Lopez 2026.pdf"
            className="px-8 py-3.5 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 hover:scale-105 border"
            style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
          >
            <Download size={16} />
            {t('hero.cta_cv')}
          </a>
        </motion.div>
      </div>

      {/* ── Scroll hint ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.4 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        style={{ color: 'var(--text-secondary)' }}
      >
        <span className="text-xs tracking-widest uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ArrowDown size={16} />
        </motion.div>
      </motion.div>
    </section>
  );
}
