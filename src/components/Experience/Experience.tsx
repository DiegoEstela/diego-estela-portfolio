import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Briefcase } from 'lucide-react';
import { useInView } from '@/hooks/useInView';
import { experiences } from '@/data/portfolio';

export function Experience() {
  const { t } = useTranslation();
  const [open, setOpen] = useState<string>('knowmad');
  const [ref, visible] = useInView<HTMLDivElement>({ threshold: 0.05 });

  return (
    <section id="experience" className="section-padding">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={visible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span
            className="text-sm font-semibold tracking-widest uppercase mb-3 block"
            style={{ color: 'var(--accent)' }}
          >
            {t('experience.title')}
          </span>
          <h2
            className="text-4xl sm:text-5xl font-bold mb-12"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-primary)' }}
          >
            {t('experience.title')}
          </h2>

          <div className="relative">
            <div
              className="absolute left-5 top-0 bottom-0 w-0.5 hidden sm:block"
              style={{ background: 'var(--border)' }}
            />

            <div className="space-y-4">
              {experiences.map((exp, idx) => (
                <motion.div
                  key={exp.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={visible ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="relative sm:pl-14"
                >
                  <div
                    className="absolute left-3.5 top-6 w-3 h-3 rounded-full border-2 hidden sm:block"
                    style={{
                      borderColor: 'var(--accent)',
                      background: exp.current ? 'var(--accent)' : 'var(--bg-primary)',
                    }}
                  />

                  <div
                    className="rounded-2xl overflow-hidden glass glow-hover cursor-pointer"
                    onClick={() => setOpen(open === exp.id ? '' : exp.id)}
                  >
                    <div className="p-5 sm:p-6 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Briefcase size={14} style={{ color: 'var(--accent)' }} />
                          {exp.current && (
                            <span
                              className="text-xs px-2 py-0.5 rounded-full font-semibold"
                              style={{ background: 'rgba(74,159,217,0.15)', color: 'var(--accent)' }}
                            >
                              {t('experience.present')}
                            </span>
                          )}
                        </div>
                        <h3
                          className="text-lg font-bold mb-0.5"
                          style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-primary)' }}
                        >
                          {t(exp.titleKey)}
                        </h3>
                        <p className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
                          {exp.company}
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                          {exp.period}
                        </p>
                      </div>

                      <motion.div
                        animate={{ rotate: open === exp.id ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex-shrink-0 mt-1"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <ChevronDown size={18} />
                      </motion.div>
                    </div>

                    <AnimatePresence>
                      {open === exp.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div
                            className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0 border-t"
                            style={{ borderColor: 'var(--border)' }}
                          >
                            <ul className="mt-4 space-y-2">
                              {exp.bulletsKey.map((bulletKey, i) => (
                                <li
                                  key={i}
                                  className="flex gap-3 text-sm leading-relaxed"
                                  style={{ color: 'var(--text-secondary)' }}
                                >
                                  <span
                                    className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                                    style={{ background: 'var(--accent)' }}
                                  />
                                  {t(bulletKey)}
                                </li>
                              ))}
                            </ul>

                            <div className="flex flex-wrap gap-2 mt-5">
                              {exp.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2.5 py-1 rounded-md text-xs font-medium"
                                  style={{
                                    background: 'rgba(74,159,217,0.1)',
                                    color: 'var(--accent)',
                                    border: '1px solid rgba(74,159,217,0.2)',
                                  }}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
