export interface Project {
  id: string;
  titleKey: string;
  descriptionKey: string;
  stack: string[];
  image?: string;
  github?: string;
  demo?: string;
  demoComponent: string;
}

export interface Experience {
  id: string;
  titleKey: string;
  company: string;
  period: string;
  bulletsKey: string[];
  tags: string[];
  current?: boolean;
}

export interface Education {
  id: string;
  degreeKey: string;
  institution: string;
  year: string;
  icon?: string;
}

export interface SkillCategory {
  categoryKey: string;
  skills: string[];
}

export interface Stat {
  value: string;
  labelKey: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface NavLink {
  labelKey: string;
  href: string;
}
