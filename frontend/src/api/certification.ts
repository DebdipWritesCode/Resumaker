import api from './axios'

export interface CertificationResponse {
  id: number
  user_id: number
  title: string
  start_date: string
  end_date: string
  instructor: string | null
  platform: string
  certification_link: string | null
  created_at: string
  updated_at: string
}

export interface CertificationCreate {
  title: string
  start_date: string
  end_date: string
  instructor?: string | null
  platform: string
  certification_link?: string | null
}

export interface CertificationUpdate {
  title?: string
  start_date?: string
  end_date?: string
  instructor?: string | null
  platform?: string
  certification_link?: string | null
  set_instructor?: boolean
  set_certification_link?: boolean
}

export const certificationApi = {
  getCertification: async (): Promise<CertificationResponse[]> => {
    const response = await api.get<CertificationResponse[]>('/api/certification/')
    return response.data
  },

  getCertificationById: async (certificationId: number): Promise<CertificationResponse> => {
    const response = await api.get<CertificationResponse>(`/api/certification/${certificationId}`)
    return response.data
  },

  createCertification: async (data: CertificationCreate): Promise<CertificationResponse> => {
    const response = await api.post<CertificationResponse>('/api/certification/', data)
    return response.data
  },

  updateCertification: async (certificationId: number, data: CertificationUpdate): Promise<CertificationResponse> => {
    const response = await api.put<CertificationResponse>(`/api/certification/${certificationId}`, data)
    return response.data
  },

  deleteCertification: async (certificationId: number): Promise<void> => {
    await api.delete(`/api/certification/${certificationId}`)
  },
}
