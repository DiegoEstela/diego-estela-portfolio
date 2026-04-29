import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { GitFork, Play } from 'lucide-react';
import type { Project } from '@/types';

interface Props {
  project: Project;
  onDemo: () => void;
  index: number;
  visible: boolean;
}

const EMOJI_MAP: Record<string, string> = {
  disney: '🏰',
  solesplast: '🏭',
  whoTookMyMoney: '💸',
  tourism: '✈️',
  gymbot: '🏋️',
  matrimillas: '💑',
  signature: '✍️',
};

export function ProjectCard({ project, onDemo, index, visible }: Props) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={visible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="rounded-2xl overflow-hidden glass glow-hover group"
      style={{ border: '1px solid var(--border)' }}
    >
      <div
        className="h-40 flex items-center justify-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(74,159,217,0.1), rgba(74,159,217,0.05))' }}
      >
        <div className="text-6xl group-hover:scale-110 transition-transform duration-300">
          {EMOJI_MAP[project.id] ?? '🚀'}
        </div>
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
          style={{ background: 'rgba(74,159,217,0.1)' }}
        />
      </div>

      <div className="p-5">
        <h3
          className="text-lg font-bold mb-2"
          style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-primary)' }}
        >
          {t(project.titleKey)}
        </h3>
        <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
          {t(project.descriptionKey)}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {project.stack.map((tech) => (
            <span
              key={tech}
              className="px-2 py-0.5 rounded-md text-xs font-medium"
              style={{ background: 'rgba(74,159,217,0.1)', color: 'var(--accent)', border: '1px solid rgba(74,159,217,0.2)' }}
            >
              {tech}
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onDemo}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold text-white transition-transform hover:scale-105"
            style={{ background: 'var(--accent)' }}
          >
            <Play size={13} />
            {t('projects.view_demo')}
          </button>
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all hover:scale-105"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              <GitFork size={14} />
              {t('projects.view_github')}
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
