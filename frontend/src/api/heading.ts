import api from './axios'

export interface CustomLink {
  label: string
  url: string
}

export interface HeadingResponse {
  id: number
  user_id: number
  mobile: string | null
  custom_links: CustomLink[] | null
  created_at: string
  updated_at: string
}

export interface HeadingCreate {
  mobile?: string | null
  custom_links?: CustomLink[] | null
}

export interface HeadingUpdate {
  mobile?: string | null
  custom_links?: CustomLink[] | null
}

export const headingApi = {
  getHeading: async (): Promise<HeadingResponse[]> => {
    const response = await api.get<HeadingResponse[]>('/api/heading/')
    return response.data
  },

  getHeadingById: async (headingId: number): Promise<HeadingResponse> => {
    const response = await api.get<HeadingResponse>(`/api/heading/${headingId}`)
    return response.data
  },

  createHeading: async (data: HeadingCreate): Promise<HeadingResponse> => {
    const response = await api.post<HeadingResponse>('/api/heading/', data)
    return response.data
  },

  createOrUpdateHeading: async (data: HeadingCreate): Promise<HeadingResponse> => {
    const response = await api.post<HeadingResponse>('/api/heading/', data)
    return response.data
  },

  updateHeading: async (headingId: number, data: HeadingUpdate): Promise<HeadingResponse> => {
    const response = await api.put<HeadingResponse>(`/api/heading/${headingId}`, data)
    return response.data
  },

  deleteHeading: async (headingId: number): Promise<void> => {
    await api.delete(`/api/heading/${headingId}`)
  },
}
