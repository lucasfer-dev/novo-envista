export type Role = 'participant' | 'investor' | 'admin'
export type ProjectStage = 'Ideia' | 'Validação' | 'Protótipo' | 'MVP' | 'Projeto ativo'

export interface User {
  id: string
  username: string
  name: string
  avatar?: string
  bio?: string
  role: Role
  skills?: string[]
  school?: string
  city?: string
  state?: string
  organization?: string
  jobTitle?: string
  interests?: string[]
}

export interface TeamMember { userId: string; role: string; joinedAt: string }
export interface Team {
  id: string; slug: string; name: string; description: string; members: TeamMember[]
  category: string; city: string; institution: string; tags: string[]; projects: string[]
}
export interface ProjectFile { id: string; name: string; type: string }
export interface ProjectUpdate { id: string; text: string; date: string }
export interface Project {
  id: string; slug: string; title: string; shortDescription: string; problem: string; solution: string
  stage: ProjectStage; tags: string[]; category: string; location: string
  author: { type: 'user' | 'team'; id: string }; files: ProjectFile[]; updates: ProjectUpdate[]
  cover?: string; readme: string; likes?: number
}
export interface Lesson { id: string; title: string; description: string }
export interface CourseModule { id: string; title: string; lessons: Lesson[] }
export interface Course { id: string; slug: string; title: string; description: string; instructor: string; level: string; duration: string; modules: CourseModule[] }
export interface Competition { id: string; slug: string; title: string; type: 'envista'|'external'; status: string; deadline?: string; organization: string; location: string; format: string; categories: string[]; prize?: string; description: string }
