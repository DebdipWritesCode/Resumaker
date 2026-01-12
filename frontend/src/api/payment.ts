import api from './axios'

export type PlanName = 'STARTER' | 'POPULAR' | 'PREMIUM'

export interface CreateOrderRequest {
  plan_name: PlanName
}

export interface CreateOrderResponse {
  order_id: string
  amount: number // Amount in INR (not paise)
  currency: string
  key_id: string // Razorpay key ID for frontend
  plan_name: PlanName
  credits: number
}

export interface VerifyPaymentRequest {
  payment_id: string
  order_id: string
  signature: string
  plan_name: PlanName
}

export interface VerifyPaymentResponse {
  id: string
  user_id: string
  plan_name: PlanName
  credits_added: number
  amount_paid: number
  payment_id: string
  order_id: string
  status: string
  created_at: string
}

export interface BuyResumeSlotResponse {
  message: string
  credits_remaining: number
  max_resume: number
}

export interface PaymentHistoryItem {
  id: string
  user_id: string
  plan_name: PlanName
  credits_added: number
  amount_paid: number
  payment_id: string
  order_id: string
  status: string
  created_at: string
}

export interface PaymentHistoryResponse {
  payments: PaymentHistoryItem[]
  total: number
}

export interface CreateCoffeeOrderRequest {
  amount: number
}

export interface CreateCoffeeOrderResponse {
  order_id: string
  amount: number // Amount in INR (not paise)
  currency: string
  key_id: string // Razorpay key ID for frontend
  plan_name: string // Always "BUY_COFFEE"
}

export interface VerifyCoffeePaymentRequest {
  payment_id: string
  order_id: string
  signature: string
  amount: number
}

export interface VerifyCoffeePaymentResponse {
  id: string
  user_id: string
  plan_name: string // Always "BUY_COFFEE"
  credits_added: number // Always 0 for coffee donations
  amount_paid: number
  payment_id: string
  order_id: string
  status: string
  created_at: string
}

export const paymentApi = {
  createOrder: async (plan_name: PlanName): Promise<CreateOrderResponse> => {
    const response = await api.post<CreateOrderResponse>('/api/payment/create-order', {
      plan_name,
    })
    return response.data
  },

  verifyPayment: async (data: VerifyPaymentRequest): Promise<VerifyPaymentResponse> => {
    const response = await api.post<VerifyPaymentResponse>('/api/payment/verify-payment', data)
    return response.data
  },

  buyResumeSlot: async (): Promise<BuyResumeSlotResponse> => {
    const response = await api.post<BuyResumeSlotResponse>('/api/payment/buy-resume-slot')
    return response.data
  },

  getPaymentHistory: async (): Promise<PaymentHistoryResponse> => {
    const response = await api.get<PaymentHistoryResponse>('/api/payment/history')
    return response.data
  },

  createCoffeeOrder: async (amount: number): Promise<CreateCoffeeOrderResponse> => {
    const response = await api.post<CreateCoffeeOrderResponse>('/api/payment/buy-coffee/create-order', {
      amount,
    })
    return response.data
  },

  verifyCoffeePayment: async (data: VerifyCoffeePaymentRequest): Promise<VerifyCoffeePaymentResponse> => {
    const response = await api.post<VerifyCoffeePaymentResponse>('/api/payment/buy-coffee/verify', data)
    return response.data
  },
}
