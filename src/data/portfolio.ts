import type { Experience, Education, SkillCategory, Stat, Project } from '@/types';

export const experiences: Experience[] = [
  {
    id: 'knowmad',
    titleKey: 'experience.knowmad.title',
    company: 'Knowmad Mood · Mapfre Inversiones',
    period: 'Sep 2023 – Present',
    bulletsKey: [
      'experience.knowmad.bullet1',
      'experience.knowmad.bullet2',
      'experience.knowmad.bullet3',
      'experience.knowmad.bullet4',
      'experience.knowmad.bullet5',
    ],
    tags: ['React', 'TypeScript', 'TanStack Query', 'MUI', 'AWS', 'Jira', 'Bitbucket'],
    current: true,
  },
  {
    id: 'uma',
    titleKey: 'experience.uma.title',
    company: 'Uma Salud IA · Argentina – México',
    period: 'Jan 2022 – Oct 2023',
    bulletsKey: [
      'experience.uma.bullet1',
      'experience.uma.bullet2',
      'experience.uma.bullet3',
      'experience.uma.bullet4',
    ],
    tags: ['React', 'NestJS', 'TypeScript', 'Firebase', 'GCP', 'Redux', 'React Query'],
  },
  {
    id: 'coderhouse',
    titleKey: 'experience.coderhouse.title',
    company: 'CoderHouse',
    period: 'Jun 2022 – Present',
    bulletsKey: [
      'experience.coderhouse.bullet1',
      'experience.coderhouse.bullet2',
    ],
    tags: ['Node.js', 'MongoDB', 'PostgreSQL', 'React', 'JavaScript'],
  },
  {
    id: 'freelance',
    titleKey: 'experience.freelance.title',
    company: 'International Clients',
    period: 'Apr 2020 – Present',
    bulletsKey: [
      'experience.freelance.bullet1',
      'experience.freelance.bullet2',
      'experience.freelance.bullet3',
    ],
    tags: ['React', 'Firebase', 'Express', 'Node.js', 'Claude AI'],
  },
];

export const education: Education[] = [
  {
    id: 'master',
    degreeKey: 'education.master',
    institution: 'Víctor Robles',
    year: '2026',
  },
  {
    id: 'mern',
    degreeKey: 'education.mern',
    institution: 'CoderHouse',
    year: '2022',
  },
  {
    id: 'reactnative',
    degreeKey: 'education.reactnative',
    institution: 'CoderHouse',
    year: '2025',
  },
  {
    id: 'scrum',
    degreeKey: 'education.scrum',
    institution: 'Netxus University',
    year: '2020',
  },
  {
    id: 'uba',
    degreeKey: 'education.uba',
    institution: 'UBA',
    year: '2016–2019',
  },
];

export const skillCategories: SkillCategory[] = [
  {
    categoryKey: 'skills.frontend',
    skills: ['React', 'Next.js', 'TypeScript', 'JavaScript', 'HTML5', 'CSS3', 'Sass', 'MUI', 'Redux', 'Context API', 'TanStack Query', 'React Hook Form', 'Cypress'],
  },
  {
    categoryKey: 'skills.backend',
    skills: ['Node.js', 'Express', 'NestJS', 'MongoDB', 'PostgreSQL', 'SQL', 'REST API', 'WebSocket'],
  },
  {
    categoryKey: 'skills.cloud',
    skills: ['AWS', 'GCP', 'Firebase', 'Git', 'Bitbucket', 'CI/CD', 'Jira'],
  },
  {
    categoryKey: 'skills.ai',
    skills: ['OpenAI API', 'DeepSeek API', 'Claude API', 'Prompt Engineering', 'Chatbots'],
  },
  {
    categoryKey: 'skills.methodologies',
    skills: ['Scrum', 'Agile', 'Code Review', 'Microfrontends'],
  },
];

export const stats: Stat[] = [
  { value: '+5', labelKey: 'about.stat1' },
  { value: '+200', labelKey: 'about.stat2' },
  { value: '+10', labelKey: 'about.stat3' },
  { value: '+10K', labelKey: 'about.stat4' },
];

export const projects: Project[] = [
  {
    id: 'disney',
    titleKey: 'projects.disney.title',
    descriptionKey: 'projects.disney.description',
    stack: ['React', 'TypeScript', 'Firebase', 'Tailwind CSS'],
    github: 'https://github.com/DiegoEstela/disney-learning-game',
    demoComponent: 'DisneyGameDemo',
  },
  {
    id: 'solesplast',
    titleKey: 'projects.solesplast.title',
    descriptionKey: 'projects.solesplast.description',
    stack: ['React', 'Vite', 'TypeScript', 'MUI'],
    github: 'https://github.com/DiegoEstela/solesplast-farestlab',
    demoComponent: 'SolesplastDemo',
  },
  {
    id: 'whoTookMyMoney',
    titleKey: 'projects.whoTookMyMoney.title',
    descriptionKey: 'projects.whoTookMyMoney.description',
    stack: ['React', 'Firebase', 'Chart.js'],
    github: 'https://github.com/DiegoEstela/who-took-my-money',
    demoComponent: 'ExpenseTrackerDemo',
  },
  {
    id: 'tourism',
    titleKey: 'projects.tourism.title',
    descriptionKey: 'projects.tourism.description',
    stack: ['React', 'OpenAI API'],
    github: 'https://github.com/diegoestela',
    demoComponent: 'TourismDemo',
  },
  {
    id: 'gymbot',
    titleKey: 'projects.gymbot.title',
    descriptionKey: 'projects.gymbot.description',
    stack: ['Python', 'Selenium', 'Cron', 'CLI'],
    github: 'https://github.com/DiegoEstela/reserva_gym',
    demoComponent: 'GymBotDemo',
  },
  {
    id: 'matrimillas',
    titleKey: 'projects.matrimillas.title',
    descriptionKey: 'projects.matrimillas.description',
    stack: ['React Native', 'Firebase'],
    github: 'https://github.com/diegoestela',
    demoComponent: 'CouplesAppDemo',
  },
  {
    id: 'signature',
    titleKey: 'projects.signature.title',
    descriptionKey: 'projects.signature.description',
    stack: ['React', 'Canvas API', 'PDF'],
    github: 'https://github.com/diegoestela',
    demoComponent: 'SignatureDemo',
  },
];
