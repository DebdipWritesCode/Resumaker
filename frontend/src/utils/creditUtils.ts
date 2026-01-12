import type { Dispatch } from '@reduxjs/toolkit'
import type { NavigateFunction } from 'react-router-dom'
import { setCredits } from '@/store/slices/authSlice'
import { toast } from 'react-toastify'

/**
 * Check if user has enough credits for an operation
 * @param required - Number of credits required
 * @param current - Current credit balance (can be null if not loaded)
 * @returns true if user has enough credits, false otherwise
 */
export const checkCredits = (required: number, current: number | null): boolean => {
  if (current === null) {
    // Credits not loaded yet, assume insufficient to be safe
    return false
  }
  return current >= required
}

/**
 * Generate a consistent error message for insufficient credits
 * @param required - Number of credits required
 * @param current - Current credit balance (can be null if not loaded)
 * @returns Error message string
 */
export const getCreditErrorMessage = (required: number, current: number | null): string => {
  const currentCredits = current ?? 0
  return `Insufficient credits. You need ${required} credits but only have ${currentCredits} credits.`
}

/**
 * Handle credit-related errors from API responses
 * Updates credits from response if available, shows error message, and optionally navigates to payments
 * @param error - The error object from the API call
 * @param dispatch - Redux dispatch function
 * @param navigate - Optional navigation function to redirect to payments page
 */
export const handleCreditError = (
  error: any,
  dispatch: Dispatch,
  navigate?: NavigateFunction
): void => {
  // Check if it's a 400 Bad Request with credit-related message
  if (error.response?.status === 400) {
    const errorDetail = error.response?.data?.detail || ''
    
    // Check if error is credit-related
    if (errorDetail.toLowerCase().includes('insufficient credits') || 
        errorDetail.toLowerCase().includes('credit')) {
      // Extract credits_remaining from response if available
      if (error.response?.data?.credits_remaining !== undefined) {
        dispatch(setCredits(error.response.data.credits_remaining))
      }
      
      // Show error message
      toast.error(errorDetail || 'Insufficient credits for this operation')
      
      // Optionally navigate to payments page
      if (navigate) {
        // Small delay to let user see the error message
        setTimeout(() => {
          navigate('/payments')
        }, 1500)
      }
      return
    }
  }
  
  // For non-credit errors, just show the error message
  const errorMessage = error.response?.data?.detail || error.message || 'Operation failed'
  toast.error(errorMessage)
}

/**
 * Update credits after a successful operation
 * Uses credits_remaining from response if available, otherwise manually deducts
 * @param response - API response object
 * @param dispatch - Redux dispatch function
 * @param currentCredits - Current credit balance
 * @param cost - Cost of the operation
 */
export const updateCreditsAfterOperation = (
  response: any,
  dispatch: Dispatch,
  currentCredits: number | null,
  cost: number
): void => {
  if (response?.data?.credits_remaining !== undefined) {
    // Use credits from backend response (most accurate)
    dispatch(setCredits(response.data.credits_remaining))
  } else if (currentCredits !== null) {
    // Fallback: manually deduct from current credits
    dispatch(setCredits(currentCredits - cost))
  }
}
