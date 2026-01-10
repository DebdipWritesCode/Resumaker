import api from './axios'

export interface ProjectResponse {
  id: number
  user_id: number
  name: string
  start_date: string
  end_date: string
  tech_stack: string
  link: string | null
  link_label: string | null
  subpoints: string[]
  created_at: string
  updated_at: string
}

export interface ProjectCreate {
  name: string
  start_date: string
  end_date: string
  tech_stack: string
  link?: string | null
  link_label?: string | null
  subpoints?: string[]
}

export interface ProjectUpdate {
  name?: string
  start_date?: string
  end_date?: string
  tech_stack?: string
  link?: string | null
  link_label?: string | null
  subpoints?: string[]
}

export const projectApi = {
  getProject: async (): Promise<ProjectResponse[]> => {
    const response = await api.get<ProjectResponse[]>('/api/project/')
    return response.data
  },

  getProjectById: async (projectId: number): Promise<ProjectResponse> => {
    const response = await api.get<ProjectResponse>(`/api/project/${projectId}`)
    return response.data
  },

  createProject: async (data: ProjectCreate): Promise<ProjectResponse> => {
    const response = await api.post<ProjectResponse>('/api/project/', data)
    return response.data
  },

  updateProject: async (projectId: number, data: ProjectUpdate): Promise<ProjectResponse> => {
    const response = await api.put<ProjectResponse>(`/api/project/${projectId}`, data)
    return response.data
  },

  deleteProject: async (projectId: number): Promise<void> => {
    await api.delete(`/api/project/${projectId}`)
  },
}
