import { useState, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useInView } from '@/hooks/useInView';
import { projects } from '@/data/portfolio';
import { ProjectCard } from './ProjectCard';

const DEMOS: Record<string, React.LazyExoticComponent<() => React.ReactElement>> = {
  DisneyGameDemo:   lazy(() => import('./demos/DisneyGameDemo').then((m) => ({ default: m.DisneyGameDemo }))),
  SolesplastDemo:   lazy(() => import('./demos/SolesplastDemo').then((m) => ({ default: m.SolesplastDemo }))),
  ExpenseTrackerDemo: lazy(() => import('./demos/ExpenseTrackerDemo').then((m) => ({ default: m.ExpenseTrackerDemo }))),
  TourismDemo:      lazy(() => import('./demos/TourismDemo').then((m) => ({ default: m.TourismDemo }))),
  GymBotDemo:       lazy(() => import('./demos/GymBotDemo').then((m) => ({ default: m.GymBotDemo }))),
  CouplesAppDemo:   lazy(() => import('./demos/CouplesAppDemo').then((m) => ({ default: m.CouplesAppDemo }))),
  SignatureDemo:    lazy(() => import('./demos/SignatureDemo').then((m) => ({ default: m.SignatureDemo }))),
};

export function Projects() {
  const { t } = useTranslation();
  const [ref, visible] = useInView<HTMLDivElement>({ threshold: 0.05 });
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

  const activeProject = projects.find((p) => p.demoComponent === activeDemo);
  const DemoComponent = activeDemo ? DEMOS[activeDemo] : null;

  return (
    <section id="projects" className="section-padding">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            {t('projects.title')}
          </span>
          <h2
            className="text-4xl sm:text-5xl font-bold mb-12"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-primary)' }}
          >
            {t('projects.title')}
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, i) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDemo={() => setActiveDemo(project.demoComponent)}
                index={i}
                visible={visible}
              />
            ))}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {activeDemo && DemoComponent && activeProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={(e) => e.target === e.currentTarget && setActiveDemo(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
            >
              <div
                className="flex items-center justify-between p-5 border-b"
                style={{ borderColor: 'var(--border)' }}
              >
                <div>
                  <h3
                    className="text-xl font-bold"
                    style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-primary)' }}
                  >
                    {t(activeProject.titleKey)}
                  </h3>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {t(activeProject.descriptionKey)}
                  </p>
                </div>
                <button
                  onClick={() => setActiveDemo(null)}
                  className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <X size={20} />
                </button>
              </div>

              <Suspense
                fallback={
                  <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-white/20 border-t-[var(--accent)] rounded-full animate-spin" />
                  </div>
                }
              >
                <DemoComponent />
              </Suspense>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
