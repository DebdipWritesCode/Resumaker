import api from './axios'
import type { HeadingResponse } from './heading'
import type { EducationResponse } from './education'
import type { ExperienceResponse } from './experience'
import type { ProjectResponse } from './project'
import type { SkillResponse } from './skill'
import type { VolunteerResponse } from './volunteer'
import type { CertificationResponse } from './certification'
import type { AwardResponse } from './award'

export interface CustomResume {
  id: string
  user_id: string
  name: string
  headings: HeadingResponse[]
  educations: EducationResponse[]
  experiences: ExperienceResponse[]
  projects: ProjectResponse[]
  skills: SkillResponse[]
  volunteers: VolunteerResponse[]
  certifications: CertificationResponse[]
  awards: AwardResponse[]
  thumbnail_url?: string | null
  pdf_url?: string | null
  latex_url?: string | null
  created_at: string
  updated_at: string
}

export interface CustomResumeCreate {
  name: string
  heading_ids?: string[]
  education_ids?: string[]
  experience_ids?: string[]
  project_ids?: string[]
  skill_ids?: string[]
  volunteer_ids?: string[]
  certification_ids?: string[]
  award_ids?: string[]
}

export interface CustomResumeUpdate {
  name?: string
  heading_ids?: string[]
  education_ids?: string[]
  experience_ids?: string[]
  project_ids?: string[]
  skill_ids?: string[]
  volunteer_ids?: string[]
  certification_ids?: string[]
  award_ids?: string[]
}

export interface UserElementsResponse {
  headings: HeadingResponse[]
  educations: EducationResponse[]
  experiences: ExperienceResponse[]
  projects: ProjectResponse[]
  skills: SkillResponse[]
  volunteers: VolunteerResponse[]
  certifications: CertificationResponse[]
  awards: AwardResponse[]
}

export interface SelectElementsRequest {
  job_description: string
}

export interface SelectElementsResponse {
  project_ids: string[]
  award_ids: string[]
  certification_ids: string[]
  volunteer_ids: string[]
  tokens_used: number
}

export const customResumeApi = {
  getAllResumes: async (): Promise<CustomResume[]> => {
    const response = await api.get<CustomResume[]>('/api/custom-resume/')
    return response.data
  },

  getResumeById: async (resumeId: string): Promise<CustomResume> => {
    const response = await api.get<CustomResume>(`/api/custom-resume/${resumeId}`)
    return response.data
  },

  createResume: async (data: CustomResumeCreate): Promise<Blob> => {
    const response = await api.post('/api/custom-resume/', data, {
      responseType: 'blob',
    })
    return response.data
  },

  updateResume: async (resumeId: string, data: CustomResumeUpdate): Promise<Blob> => {
    const response = await api.put(`/api/custom-resume/${resumeId}`, data, {
      responseType: 'blob',
    })
    return response.data
  },

  deleteResume: async (resumeId: string): Promise<void> => {
    await api.delete(`/api/custom-resume/${resumeId}`)
  },

  getUserElements: async (): Promise<UserElementsResponse> => {
    const response = await api.get<UserElementsResponse>('/api/custom-resume/user-elements')
    return response.data
  },

  selectElements: async (data: SelectElementsRequest): Promise<SelectElementsResponse> => {
    const response = await api.post<SelectElementsResponse>('/api/custom-resume/select-elements', data)
    return response.data
  },
}
