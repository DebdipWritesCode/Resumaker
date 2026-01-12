import api from './axios'

export interface DashboardStats {
  credits: number
  max_resume: number
  resume_count: number
  pdfs_generated: number
  ai_calls_count: number
}

export interface RecentCustomResume {
  id: string
  name: string
  thumbnail_url: string | null
  cloudinary_url: string | null
  updated_at: string
  created_at: string
}

export interface RecentPDF {
  id: string
  resume_name: string
  cloudinary_url: string
  thumbnail_url: string | null
  generated_at: string
}

export interface ElementCounts {
  headings: number
  educations: number
  experiences: number
  projects: number
  skills: number
  certifications: number
  awards: number
  volunteers: number
}

export interface DashboardActivity {
  type: 'resume_created' | 'pdf_generated' | 'ai_used'
  description: string
  timestamp: string
  resume_id: string | null
  resume_name: string | null
}

export interface DashboardResponse {
  stats: DashboardStats
  recent_resumes: RecentCustomResume[]
  recent_pdfs: RecentPDF[]
  element_counts: ElementCounts
  recent_activity: DashboardActivity[]
}

export const dashboardApi = {
  getDashboard: async (): Promise<DashboardResponse> => {
    const response = await api.get<DashboardResponse>('/api/dashboard')
    return response.data
  },
}
