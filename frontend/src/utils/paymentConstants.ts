import type { PlanName } from '@/api/payment'

export interface PaymentPlan {
  name: PlanName
  price: number
  credits: number
  description: string
  popular?: boolean
}

export const PAYMENT_PLANS: PaymentPlan[] = [
  {
    name: 'STARTER',
    price: 60,
    credits: 70,
    description: 'Perfect for getting started',
  },
  {
    name: 'POPULAR',
    price: 250,
    credits: 400,
    description: 'Best value for regular users',
    popular: true,
  },
  {
    name: 'PREMIUM',
    price: 500,
    credits: 1000,
    description: 'Maximum credits for power users',
  },
]

// Cost in credits to purchase one additional resume slot
export const RESUME_SLOT_COST = 30

// Credit costs for AI operations
export const EXTRACT_RESUME_COST = 5
export const REPHRASE_COST = 2 // For all rephrase operations
export const SELECT_ELEMENTS_COST = 5

// Mapping of endpoints to credit costs (for reference)
export const CREDIT_COSTS_BY_ENDPOINT: Record<string, number> = {
  '/api/ai/extract-resume': EXTRACT_RESUME_COST,
  '/api/ai/rephrase-title': REPHRASE_COST,
  '/api/ai/rephrase-subpoints': REPHRASE_COST,
  '/api/ai/rephrase-experience-project': REPHRASE_COST,
  '/api/ai/rephrase-project-subpoints': REPHRASE_COST,
  '/api/ai/rephrase-volunteer-description': REPHRASE_COST,
  '/api/custom-resume/select-elements': SELECT_ELEMENTS_COST,
  '/api/payment/buy-resume-slot': RESUME_SLOT_COST,
}
