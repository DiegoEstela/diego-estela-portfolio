/**
 * The AI projects of the "AI world". Their text lives in the locales, under
 * `agentsOffice.world.projects.items.<id>`. `web` is the live site, when there is one.
 */
export interface AiProject {
  id: 'portfolio' | 'rag' | 'hincha'
  repo: string
  web?: string
  hasLimits: boolean
}

export const AI_PROJECTS: readonly AiProject[] = [
  { id: 'portfolio', repo: 'https://github.com/DiegoEstela/diego-estela-portfolio', hasLimits: false },
  { id: 'rag', repo: 'https://github.com/DiegoEstela/-ai-act-rag-assistant', hasLimits: true },
  { id: 'hincha', repo: 'https://github.com/DiegoEstela/el-rincon-del-hincha', web: 'https://el-rincon-del-hincha.vercel.app/', hasLimits: false },
]

export type AiProjectId = AiProject['id']
