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
  credits: number
  max_resume: number
}

export interface VerifyOtpData {
  email: string
  otp: string
}

export interface VerifyOtpResponse {
  message: string
  email: string
}

export interface ResendVerificationData {
  email: string
}

export interface ResendVerificationResponse {
  message: string
  email: string
}

export interface ForgotPasswordData {
  email: string
}

export interface ForgotPasswordResponse {
  message: string
  email: string
}

export interface VerifyPasswordResetOtpData {
  email: string
  otp: string
}

export interface VerifyPasswordResetOtpResponse {
  message: string
  email: string
}

export interface ResetPasswordData {
  email: string
  new_password: string
}

export interface ResetPasswordResponse {
  message: string
  email: string
}

export interface UpdateNameData {
  first_name: string
  last_name: string
}

export interface UpdateNameResponse {
  id: string
  email: string
  first_name: string
  last_name: string
  is_admin: boolean
  is_verified: boolean
  credits: number
  max_resume: number
  created_at: string
}

export interface RequestEmailChangeResponse {
  message: string
  email: string
}

export interface VerifyEmailChangeOtpData {
  otp: string
}

export interface VerifyEmailChangeOtpResponse {
  message: string
  email: string
}

export interface RequestNewEmailData {
  new_email: string
}

export interface RequestNewEmailResponse {
  message: string
  email: string
}

export interface VerifyNewEmailOtpData {
  new_email: string
  otp: string
}

export interface VerifyNewEmailOtpResponse {
  message: string
  email: string
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

  verifyOtp: async (data: VerifyOtpData): Promise<VerifyOtpResponse> => {
    const response = await api.post<VerifyOtpResponse>('/api/auth/verify-otp', data)
    return response.data
  },

  resendVerification: async (data: ResendVerificationData): Promise<ResendVerificationResponse> => {
    const response = await api.post<ResendVerificationResponse>('/api/auth/resend-verification', data)
    return response.data
  },

  forgotPassword: async (data: ForgotPasswordData): Promise<ForgotPasswordResponse> => {
    const response = await api.post<ForgotPasswordResponse>('/api/auth/forgot-password', data)
    return response.data
  },

  verifyPasswordResetOtp: async (data: VerifyPasswordResetOtpData): Promise<VerifyPasswordResetOtpResponse> => {
    const response = await api.post<VerifyPasswordResetOtpResponse>('/api/auth/verify-password-reset-otp', data)
    return response.data
  },

  resetPassword: async (data: ResetPasswordData): Promise<ResetPasswordResponse> => {
    const response = await api.post<ResetPasswordResponse>('/api/auth/reset-password', data)
    return response.data
  },

  updateName: async (data: UpdateNameData): Promise<UpdateNameResponse> => {
    const response = await api.put<UpdateNameResponse>('/api/auth/update-name', data)
    return response.data
  },

  requestEmailChange: async (): Promise<RequestEmailChangeResponse> => {
    const response = await api.post<RequestEmailChangeResponse>('/api/auth/request-email-change')
    return response.data
  },

  verifyEmailChangeOtp: async (data: VerifyEmailChangeOtpData): Promise<VerifyEmailChangeOtpResponse> => {
    const response = await api.post<VerifyEmailChangeOtpResponse>('/api/auth/verify-email-change-otp', data)
    return response.data
  },

  requestNewEmail: async (data: RequestNewEmailData): Promise<RequestNewEmailResponse> => {
    const response = await api.post<RequestNewEmailResponse>('/api/auth/request-new-email', data)
    return response.data
  },

  verifyNewEmailOtp: async (data: VerifyNewEmailOtpData): Promise<VerifyNewEmailOtpResponse> => {
    const response = await api.post<VerifyNewEmailOtpResponse>('/api/auth/verify-new-email-otp', data)
    return response.data
  },
}
