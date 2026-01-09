import api from './axios'

export interface SignupData {
  email: string
  password: string
  first_name: string
  last_name: string
}

export interface LoginData {
  email: string
  password: string
}

export interface SignupResponse {
  id: number
  email: string
  first_name: string
  last_name: string
  is_admin: boolean
}

export interface LoginResponse {
  access_token: string
  token_type: string
  first_name: string
  last_name: string
  email: string
  is_admin: boolean
}

export const authApi = {
  signup: async (data: SignupData): Promise<SignupResponse> => {
    const response = await api.post<SignupResponse>('/api/auth/register', data)
    return response.data
  },

  login: async (data: LoginData): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/api/auth/login', data)
    return response.data
  },
}
