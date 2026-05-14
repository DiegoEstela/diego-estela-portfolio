import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useMotionValue, useAnimationFrame } from 'framer-motion';
import { useInView } from '@/hooks/useInView';

const RECOMMENDATIONS = [
  {
    id: 1,
    name: 'Manuel de la Vega Arantave',
    role: { es: 'Arquitecto Frontend', en: 'Front End Architect' },
    company: 'Knowmad Mood',
    date: { es: 'Febrero 2025', en: 'February 2025' },
    initials: 'MV',
    color: '#4A9FD9',
    text: {
      es: 'Ha sido un placer trabajar contigo, Diego. Siempre con una actitud positiva y proactiva. Entraste con el proyecto ya avanzado y te adaptaste rápidamente tanto en la forma de trabajo como al stack tecnológico, proponiendo mejoras en todo momento. Tener compañeros de trabajo como tú, es un regalo.',
      en: 'It has been a pleasure working with you, Diego. Always with a positive and proactive attitude. You joined the project already underway and adapted quickly to both the workflow and the tech stack, constantly proposing improvements. Having colleagues like you is a gift.',
    },
  },
  {
    id: 2,
    name: 'Santiago Rodríguez Salinas',
    role: { es: 'Tech Lead', en: 'Tech Lead' },
    company: 'ÜMA Salud',
    date: { es: 'Noviembre 2023', en: 'November 2023' },
    initials: 'SR',
    color: '#34D399',
    text: {
      es: 'Luego de más de un año de trabajo con él, puedo asegurar que Diego es un excelente profesional. Desde su organización y capacidad analítica, a su enorme voluntad y predisposición a la hora de ayudar a los demás, sin dejar de lado sus habilidades técnicas en constante crecimiento. Un gusto haber trabajado con él.',
      en: 'After more than a year working with him, I can confirm that Diego is an excellent professional. From his organization and analytical skills to his enormous willingness to help others, not to mention his ever-growing technical abilities. A pleasure to have worked with him.',
    },
  },
  {
    id: 3,
    name: 'Farid Murzone',
    role: { es: 'CTO', en: 'CTO' },
    company: 'ÜMA Salud',
    date: { es: 'Octubre 2023', en: 'October 2023' },
    initials: 'FM',
    color: '#A78BFA',
    text: {
      es: 'Me tocó liderar a Diego en ÜMA Salud y verlo crecer técnicamente. Aprende rápido, toma ownership de sus tareas y es un excelente compañero. Llevó adelante uno de los proyectos más grandes, trabajando con microfrontends, TypeScript y clean architecture. Siempre un jugador de equipo con responsabilidad destacable.',
      en: 'I had the opportunity to lead Diego at ÜMA Salud and watch him grow technically. He learns fast, takes ownership of his tasks, and is an excellent team member. He led one of the biggest projects, working with microfrontends, TypeScript, and clean architecture. Always a team player with outstanding commitment.',
    },
  },
  {
    id: 4,
    name: 'Juan Horacio Nazar',
    role: { es: 'CEO', en: 'CEO' },
    company: 'Consultora IE',
    date: { es: 'Junio 2021', en: 'June 2021' },
    initials: 'JN',
    color: '#F59E0B',
    text: {
      es: 'La experiencia con Diego fue altamente gratificante. Se desempeñó por encima del estándar habitual, superando las expectativas. Su calidad humana es también de notar. Aprendiz incansable, busca soluciones y mejoras tanto en sus actividades como en las de los demás. Gran experiencia compartida.',
      en: 'The experience with Diego was highly rewarding. He performed above the usual standard, exceeding expectations. His human quality is also worth noting. A tireless learner, always seeking solutions and improvements in his own work and that of others. A great shared experience.',
    },
  },
  {
    id: 5,
    name: 'Ariel Horacio Ferrari',
    role: { es: 'Director de Investigaciones', en: 'Research Director' },
    company: 'FUNDECOS',
    date: { es: 'Enero 2021', en: 'January 2021' },
    initials: 'AF',
    color: '#F472B6',
    text: {
      es: 'Diego es un trabajador incansable, motivado por la obtención eficiente del objetivo planteado. Aplicará toda su experiencia y empatía para resolver problemas de distinta complejidad en forma acertada y proactiva. Es muy natural que genere equipos de trabajo. Lo recomiendo enfáticamente tanto desde el punto de vista laboral como personal.',
      en: 'Diego is a tireless worker, driven by efficiently achieving the goals set. He will apply all his experience and empathy to solve problems of varying complexity in an accurate and proactive way. He naturally builds strong teams. I strongly recommend him both professionally and personally.',
    },
  },
];

function QuoteIcon({ color }: { color: string }) {
  return (
    <svg width="32" height="26" viewBox="0 0 32 26" fill="none">
      <path
        d="M0 26V15.6C0 6.933 5.2 1.733 15.6 0L17.333 3.467C12.133 4.533 9.067 7.8 8.667 13H15.6V26H0ZM18.667 26V15.6C18.667 6.933 23.867 1.733 34.267 0L36 3.467C30.8 4.533 27.733 7.8 27.333 13H34.267V26H18.667Z"
        fill={color}
        fillOpacity="0.2"
      />
    </svg>
  );
}

type Lang = 'es' | 'en';

function RecommendationCard({ rec, lang }: { rec: typeof RECOMMENDATIONS[0]; lang: Lang }) {
  return (
    <div
      className="flex-shrink-0 w-80 sm:w-[22rem] mx-3 p-6 rounded-2xl flex flex-col gap-4 cursor-default select-none"
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${rec.color}25`,
        boxShadow: `0 4px 24px ${rec.color}10`,
      }}
    >
      {/* Top: quote icon + stars */}
      <div className="flex items-start justify-between">
        <QuoteIcon color={rec.color} />
        <div className="flex gap-0.5 mt-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={rec.color}>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          ))}
        </div>
      </div>

      {/* Text */}
      <p
        className="text-sm leading-relaxed flex-1"
        style={{ color: 'var(--text-secondary)' }}
      >
        "{rec.text[lang]}"
      </p>

      {/* Divider */}
      <div
        className="h-px w-full"
        style={{ background: `linear-gradient(to right, ${rec.color}50, transparent)` }}
      />

      {/* Author */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${rec.color}, ${rec.color}80)` }}
        >
          {rec.initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
            {rec.name}
          </p>
          <p className="text-xs truncate" style={{ color: rec.color }}>
            {rec.role[lang]} · {rec.company}
          </p>
        </div>
        <span
          className="flex-shrink-0 text-xs px-2 py-0.5 rounded-lg font-medium"
          style={{ background: `${rec.color}15`, color: rec.color }}
        >
          {rec.date[lang]}
        </span>
      </div>
    </div>
  );
}

export function Recommendations() {
  const { t, i18n } = useTranslation();
  const lang: Lang = i18n.language === 'es' ? 'es' : 'en';
  const [ref, visible] = useInView<HTMLDivElement>({ threshold: 0.1 });

  const x = useMotionValue(0);
  const rowRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const items = [...RECOMMENDATIONS, ...RECOMMENDATIONS];

  useAnimationFrame((_, delta) => {
    if (isDragging.current) return;
    const w = rowRef.current?.scrollWidth ?? 0;
    const half = w / 2;
    if (!half) return;
    let cur = x.get();
    cur -= (26 * delta) / 1000;
    // Wrap: keep in [-half, 0]
    if (cur <= -half) cur += half;
    if (cur > 0) cur -= half;
    x.set(cur);
  });

  return (
    <section id="recommendations" className="section-padding overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={visible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <span
            className="text-sm font-semibold tracking-widest uppercase mb-3 block"
            style={{ color: 'var(--accent)' }}
          >
            LinkedIn
          </span>
          <h2
            className="text-4xl sm:text-5xl font-bold mb-4"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-primary)' }}
          >
            {t('recommendations.title')}
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            {t('recommendations.subtitle')}
          </p>
        </motion.div>
      </div>

      {/* Single marquee row */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={visible ? { opacity: 1 } : {}}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <div
          className="overflow-hidden"
          style={{
            maskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)',
          }}
        >
          <motion.div
            ref={rowRef}
            className="flex py-3 cursor-grab active:cursor-grabbing"
            style={{ x }}
            drag="x"
            dragConstraints={{ left: -Infinity, right: Infinity }}
            dragElastic={0}
            dragMomentum={false}
            onDragStart={() => { isDragging.current = true; }}
            onDragEnd={() => {
              // Normalize position back into the [-half, 0] range after drag
              const w = rowRef.current?.scrollWidth ?? 0;
              const half = w / 2;
              if (!half) { isDragging.current = false; return; }
              let cur = x.get() % half;
              if (cur > 0) cur -= half;
              x.set(cur);
              isDragging.current = false;
            }}
          >
            {items.map((rec, i) => (
              <RecommendationCard key={`${rec.id}-${i}`} rec={rec} lang={lang} />
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* LinkedIn CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={visible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="text-center mt-10"
      >
        <a
          href="https://www.linkedin.com/in/diegoezequielestela/details/recommendations/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
          style={{
            background: 'rgba(74,159,217,0.08)',
            border: '1px solid var(--accent)',
            color: 'var(--accent)',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          {t('recommendations.cta')}
        </a>
      </motion.div>
    </section>
  );
}
