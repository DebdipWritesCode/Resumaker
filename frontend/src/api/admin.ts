import api from './axios'

export interface UserAnalytics {
  ai_calls_count: number
  pdfs_generated_count: number
  pdfs_downloaded_count: number
  tokens_used: number
  last_ai_call_at: string | null
  last_pdf_generated_at: string | null
}

export interface UserWithAnalytics {
  id: string
  email: string
  first_name: string
  last_name: string
  is_admin: boolean
  is_verified: boolean
  is_revoked: boolean
  credits: number
  max_resume: number
  created_at: string
  analytics: UserAnalytics
}

export interface GetAllUsersResponse {
  users: UserWithAnalytics[]
  total: number
}

export interface CreateAdminRequest {
  email: string
}

export interface CreateAdminResponse {
  message: string
  user_id: string
  email: string
  is_admin: boolean
}

export interface DeleteUserResponse {
  message: string
  user_id: string
}

export interface RevokeUserResponse {
  message: string
  user_id: string
  is_revoked: boolean
}

export interface UnrevokeUserResponse {
  message: string
  user_id: string
  is_revoked: boolean
}

export interface UpdateCreditsRequest {
  credits: number
}

export interface UpdateCreditsResponse {
  message: string
  user_id: string
  credits: number
}

export const adminApi = {
  getAllUsers: async (skip: number = 0, limit: number = 100): Promise<GetAllUsersResponse> => {
    const response = await api.get<GetAllUsersResponse>('/api/admin/users', {
      params: { skip, limit },
    })
    return response.data
  },

  createAdmin: async (email: string): Promise<CreateAdminResponse> => {
    const response = await api.post<CreateAdminResponse>('/api/admin/create-admin', { email })
    return response.data
  },

  deleteUser: async (userId: string): Promise<DeleteUserResponse> => {
    const response = await api.delete<DeleteUserResponse>(`/api/admin/users/${userId}`)
    return response.data
  },

  revokeUser: async (userId: string): Promise<RevokeUserResponse> => {
    const response = await api.post<RevokeUserResponse>(`/api/admin/users/${userId}/revoke`)
    return response.data
  },

  unrevokeUser: async (userId: string): Promise<UnrevokeUserResponse> => {
    const response = await api.post<UnrevokeUserResponse>(`/api/admin/users/${userId}/unrevoke`)
    return response.data
  },

  updateUserCredits: async (userId: string, credits: number): Promise<UpdateCreditsResponse> => {
    const response = await api.put<UpdateCreditsResponse>(`/api/admin/users/${userId}/credits`, {
      credits,
    })
    return response.data
  },
}
