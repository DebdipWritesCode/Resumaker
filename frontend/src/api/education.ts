import api from './axios'

export interface EducationResponse {
  id: number
  user_id: number
  institution: string
  location: string
  degree: string
  gpa: string | number | null // Can be string "7.84 / 10.00" or number
  max_gpa?: number | null // Separate max_gpa field if backend returns it
  start_date: string
  end_date: string
  courses: string[] | null
  created_at: string
  updated_at: string
}

export interface EducationCreate {
  institution: string
  location: string
  degree: string
  gpa?: number | null
  max_gpa?: number | null
  start_date: string
  end_date: string
  courses?: string[] | null
}

export interface EducationUpdate {
  institution?: string
  location?: string
  degree?: string
  gpa?: number | null
  max_gpa?: number | null
  start_date?: string
  end_date?: string
  courses?: string[] | null
}

export const educationApi = {
  getEducation: async (): Promise<EducationResponse[]> => {
    const response = await api.get<EducationResponse[]>('/api/education/')
    return response.data
  },

  getEducationById: async (educationId: number): Promise<EducationResponse> => {
    const response = await api.get<EducationResponse>(`/api/education/${educationId}`)
    return response.data
  },

  createEducation: async (data: EducationCreate): Promise<EducationResponse> => {
    const response = await api.post<EducationResponse>('/api/education/', data)
    return response.data
  },

  updateEducation: async (educationId: number, data: EducationUpdate): Promise<EducationResponse> => {
    const response = await api.put<EducationResponse>(`/api/education/${educationId}`, data)
    return response.data
  },

  deleteEducation: async (educationId: number): Promise<void> => {
    await api.delete(`/api/education/${educationId}`)
  },
}
