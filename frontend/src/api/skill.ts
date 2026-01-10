import api from './axios'

export interface SkillResponse {
  id: number
  user_id: number
  category: string
  items: string[]
  created_at: string
  updated_at: string
}

export interface SkillCreate {
  category: string
  items: string[]
}

export interface SkillUpdate {
  category?: string
  items?: string[]
}

export const skillApi = {
  getSkill: async (): Promise<SkillResponse[]> => {
    const response = await api.get<SkillResponse[]>('/api/skill/')
    return response.data
  },

  getSkillById: async (skillId: number): Promise<SkillResponse> => {
    const response = await api.get<SkillResponse>(`/api/skill/${skillId}`)
    return response.data
  },

  createSkill: async (data: SkillCreate): Promise<SkillResponse> => {
    const response = await api.post<SkillResponse>('/api/skill/', data)
    return response.data
  },

  updateSkill: async (skillId: number, data: SkillUpdate): Promise<SkillResponse> => {
    const response = await api.put<SkillResponse>(`/api/skill/${skillId}`, data)
    return response.data
  },

  deleteSkill: async (skillId: number): Promise<void> => {
    await api.delete(`/api/skill/${skillId}`)
  },
}
