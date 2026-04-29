import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { GraduationCap } from 'lucide-react';
import { useInView } from '@/hooks/useInView';
import { education } from '@/data/portfolio';

export function Education() {
  const { t } = useTranslation();
  const [ref, visible] = useInView<HTMLDivElement>({ threshold: 0.1 });

  return (
    <section id="education" className="section-padding">
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
            {t('education.title')}
          </span>
          <h2
            className="text-4xl sm:text-5xl font-bold mb-12"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-primary)' }}
          >
            {t('education.title')}
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            {education.map((edu, i) => (
              <motion.div
                key={edu.id}
                initial={{ opacity: 0, y: 20 }}
                animate={visible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-5 rounded-2xl glass glow-hover"
                style={{ border: '1px solid var(--border)' }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="p-2.5 rounded-xl flex-shrink-0"
                    style={{ background: 'rgba(74,159,217,0.1)' }}
                  >
                    <GraduationCap size={20} style={{ color: 'var(--accent)' }} />
                  </div>
                  <div>
                    <h3
                      className="font-bold text-sm mb-1 leading-snug"
                      style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-primary)' }}
                    >
                      {t(edu.degreeKey)}
                    </h3>
                    <p className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
                      {edu.institution}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {edu.year}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
