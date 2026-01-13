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
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/13d595c5-7ea8-4818-ae0b-3caf225df095',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard.ts:56',message:'Dashboard API call starting',data:{apiBaseURL:api.defaults.baseURL,protocol:typeof window !== 'undefined' ? window.location.protocol : 'N/A',href:typeof window !== 'undefined' ? window.location.href : 'N/A'},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B,E'})}).catch(()=>{});
    // #endregion
    // Use trailing slash to match backend route and avoid 307 redirect from HTTPS to HTTP
    const response = await api.get<DashboardResponse>('/api/dashboard/')
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/13d595c5-7ea8-4818-ae0b-3caf225df095',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard.ts:60',message:'Dashboard API call succeeded',data:{status:response.status},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B,E'})}).catch(()=>{});
    // #endregion
    return response.data
  },
}
