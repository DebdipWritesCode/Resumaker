import api from './axios'

export interface ProjectItem {
  title: string
  description: string
}

export interface ExperienceResponse {
  id: number
  user_id: number
  company: string
  location: string
  position: string
  start_date: string
  end_date: string
  projects: ProjectItem[]
  created_at: string
  updated_at: string
}

export interface ExperienceCreate {
  company: string
  location: string
  position: string
  start_date: string
  end_date: string
  projects?: ProjectItem[]
}

export interface ExperienceUpdate {
  company?: string
  location?: string
  position?: string
  start_date?: string
  end_date?: string
  projects?: ProjectItem[]
}

export const experienceApi = {
  getExperience: async (): Promise<ExperienceResponse[]> => {
    const response = await api.get<ExperienceResponse[]>('/api/experience/')
    return response.data
  },

  getExperienceById: async (experienceId: number): Promise<ExperienceResponse> => {
    const response = await api.get<ExperienceResponse>(`/api/experience/${experienceId}`)
    return response.data
  },

  createExperience: async (data: ExperienceCreate): Promise<ExperienceResponse> => {
    const response = await api.post<ExperienceResponse>('/api/experience/', data)
    return response.data
  },

  updateExperience: async (experienceId: number, data: ExperienceUpdate): Promise<ExperienceResponse> => {
    const response = await api.put<ExperienceResponse>(`/api/experience/${experienceId}`, data)
    return response.data
  },

  deleteExperience: async (experienceId: number): Promise<void> => {
    await api.delete(`/api/experience/${experienceId}`)
  },
}
