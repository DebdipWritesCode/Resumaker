import api from './axios'

export interface AwardResponse {
  id: number
  user_id: number
  title: string
  date: string
  created_at: string
  updated_at: string
}

export interface AwardCreate {
  title: string
  date: string
}

export interface AwardUpdate {
  title?: string
  date?: string
}

export const awardApi = {
  getAward: async (): Promise<AwardResponse[]> => {
    const response = await api.get<AwardResponse[]>('/api/award/')
    return response.data
  },

  getAwardById: async (awardId: number): Promise<AwardResponse> => {
    const response = await api.get<AwardResponse>(`/api/award/${awardId}`)
    return response.data
  },

  createAward: async (data: AwardCreate): Promise<AwardResponse> => {
    const response = await api.post<AwardResponse>('/api/award/', data)
    return response.data
  },

  updateAward: async (awardId: number, data: AwardUpdate): Promise<AwardResponse> => {
    const response = await api.put<AwardResponse>(`/api/award/${awardId}`, data)
    return response.data
  },

  deleteAward: async (awardId: number): Promise<void> => {
    await api.delete(`/api/award/${awardId}`)
  },
}
