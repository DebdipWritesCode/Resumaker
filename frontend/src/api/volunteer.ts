import api from './axios'

export interface VolunteerResponse {
  id: number
  user_id: number
  position: string
  organization: string
  location: string
  description: string
  start_date: string
  end_date: string
  created_at: string
  updated_at: string
}

export interface VolunteerCreate {
  position: string
  organization: string
  location: string
  description: string
  start_date: string
  end_date: string
}

export interface VolunteerUpdate {
  position?: string
  organization?: string
  location?: string
  description?: string
  start_date?: string
  end_date?: string
}

export const volunteerApi = {
  getVolunteer: async (): Promise<VolunteerResponse[]> => {
    const response = await api.get<VolunteerResponse[]>('/api/volunteer/')
    return response.data
  },

  getVolunteerById: async (volunteerId: number): Promise<VolunteerResponse> => {
    const response = await api.get<VolunteerResponse>(`/api/volunteer/${volunteerId}`)
    return response.data
  },

  createVolunteer: async (data: VolunteerCreate): Promise<VolunteerResponse> => {
    const response = await api.post<VolunteerResponse>('/api/volunteer/', data)
    return response.data
  },

  updateVolunteer: async (volunteerId: number, data: VolunteerUpdate): Promise<VolunteerResponse> => {
    const response = await api.put<VolunteerResponse>(`/api/volunteer/${volunteerId}`, data)
    return response.data
  },

  deleteVolunteer: async (volunteerId: number): Promise<void> => {
    await api.delete(`/api/volunteer/${volunteerId}`)
  },
}
