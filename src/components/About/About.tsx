import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useInView } from '@/hooks/useInView';
import { stats, skillCategories } from '@/data/portfolio';

/* ── Skill pill icons ── */
const SKILL_ICON: Record<string, string> = {
  'React': '⚛️', 'Next.js': '▲', 'TypeScript': '🔷', 'JavaScript': '🟨',
  'HTML5': '🟠', 'CSS3': '🔵', 'Sass': '💜', 'MUI': '🎨',
  'Redux': '🟣', 'Context API': '🔗', 'TanStack Query': '🔄', 'React Hook Form': '📝',
  'Cypress': '🌲', 'Node.js': '🟢', 'Express': '🚂', 'NestJS': '🐈',
  'MongoDB': '🍃', 'PostgreSQL': '🐘', 'SQL': '🗄️', 'REST API': '🔌',
  'WebSocket': '🔁', 'AWS': '☁️', 'GCP': '🌐', 'Firebase': '🔥',
  'Git': '🔶', 'Bitbucket': '🪣', 'CI/CD': '⚙️', 'Jira': '📋',
  'OpenAI API': '🤖', 'DeepSeek API': '🧠', 'Claude API': '✨',
  'Prompt Engineering': '💬', 'Chatbots': '🗣️', 'Scrum': '🏃',
  'Agile': '🔄', 'Code Review': '👁️', 'Microfrontends': '🧩',
};

/* ── Category accent colors ── */
const CAT_COLOR: Record<string, string> = {
  'skills.frontend':      '#4A9FD9',
  'skills.backend':       '#7EC8E3',
  'skills.cloud':         '#F59E0B',
  'skills.ai':            '#A78BFA',
  'skills.methodologies': '#34D399',
};

function SkillPill({
  skill,
  color,
  delay,
}: {
  skill: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, y: 12 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay, ease: 'backOut' }}
      whileHover={{
        scale: 1.12,
        y: -4,
        transition: { type: 'spring', stiffness: 400, damping: 15 },
      }}
      whileTap={{ scale: 0.95 }}
      className="flex items-center gap-2 px-3.5 py-2 rounded-xl cursor-default select-none"
      style={{
        background: 'var(--bg-card)',
        border: `1px solid var(--border)`,
        transition: 'box-shadow 0.2s, border-color 0.2s',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = color;
        el.style.boxShadow = `0 0 18px ${color}55, 0 4px 12px ${color}25`;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = 'var(--border)';
        el.style.boxShadow = 'none';
      }}
    >
      <span className="text-sm leading-none">{SKILL_ICON[skill] ?? '◆'}</span>
      <span
        className="text-sm font-medium whitespace-nowrap"
        style={{ color: 'var(--text-primary)' }}
      >
        {skill}
      </span>
    </motion.div>
  );
}

function StatCard({ value, label, delay }: { value: string; label: string; delay: number }) {
  const [ref, visible] = useInView<HTMLDivElement>({ threshold: 0.3 });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={visible ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, delay }}
      className="text-center p-6 rounded-2xl glass glow-hover"
    >
      <div className="text-4xl font-bold mb-1" style={{ color: 'var(--accent)', fontFamily: "'Space Grotesk', sans-serif" }}>
        {value}
      </div>
      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</div>
    </motion.div>
  );
}

export function About() {
  const { t } = useTranslation();
  const [ref, visible] = useInView<HTMLDivElement>({ threshold: 0.05 });
  const [skillsRef, skillsVisible] = useInView<HTMLDivElement>({ threshold: 0.1 });

  return (
    <section id="about" className="section-padding">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={visible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="text-sm font-semibold tracking-widest uppercase mb-3 block" style={{ color: 'var(--accent)' }}>
            {t('about.title')}
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold mb-12" style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-primary)' }}>
            {t('about.title')}
          </h2>

          <div className="grid md:grid-cols-2 gap-12 mb-12">
            <div className="space-y-4">
              {(['p1', 'p2', 'p3'] as const).map((key) => (
                <p key={key} style={{ color: 'var(--text-secondary)' }} className="leading-relaxed">
                  {t(`about.${key}`)}
                </p>
              ))}
            </div>
            <div className="flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={visible ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.2, ease: 'backOut' }}
                className="relative w-52 h-52 sm:w-64 sm:h-64"
              >
                {/* Glow ring */}
                <div
                  className="absolute inset-0 rounded-full blur-2xl opacity-30"
                  style={{ background: 'var(--accent)' }}
                />
                {/* Rotating accent border */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `conic-gradient(from 0deg, var(--accent), #7EC8E3, transparent 60%, var(--accent))`,
                    padding: '3px',
                  }}
                />
                {/* White gap ring */}
                <div
                  className="absolute rounded-full"
                  style={{
                    inset: '3px',
                    background: 'var(--bg-primary)',
                    borderRadius: '9999px',
                  }}
                />
                {/* Photo */}
                <img
                  src="/profile.jpg"
                  alt="Diego Estela Lopez"
                  className="absolute rounded-full object-cover object-top"
                  style={{ inset: '5px' }}
                />
              </motion.div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-20">
            {stats.map((stat, i) => (
              <StatCard key={stat.labelKey} value={stat.value} label={t(stat.labelKey)} delay={i * 0.1} />
            ))}
          </div>
        </motion.div>

        {/* ── Skills section ── */}
        <div ref={skillsRef}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={skillsVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="mb-10 text-center"
          >
            <span className="text-sm font-semibold tracking-widest uppercase mb-2 block" style={{ color: 'var(--accent)' }}>
              Stack
            </span>
            <h3 className="text-3xl sm:text-4xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-primary)' }}>
              {t('about.skills_title')}
            </h3>
          </motion.div>

          <div className="space-y-8">
            {skillCategories.map((cat, catIdx) => {
              const color = CAT_COLOR[cat.categoryKey] ?? 'var(--accent)';
              return (
                <motion.div
                  key={cat.categoryKey}
                  initial={{ opacity: 0, y: 20 }}
                  animate={skillsVisible ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: catIdx * 0.1 }}
                >
                  {/* Category label */}
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: color, boxShadow: `0 0 8px ${color}80` }}
                    />
                    <span
                      className="text-xs font-bold tracking-widest uppercase"
                      style={{ color }}
                    >
                      {t(cat.categoryKey)}
                    </span>
                    <div
                      className="flex-1 h-px"
                      style={{ background: `linear-gradient(to right, ${color}40, transparent)` }}
                    />
                  </div>

                  {/* Pill grid — hover animates each pill */}
                  <div className="flex flex-wrap gap-2">
                    {cat.skills.map((skill, skillIdx) => (
                      <SkillPill
                        key={skill}
                        skill={skill}
                        color={color}
                        delay={catIdx * 0.06 + skillIdx * 0.04}
                      />
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
