import { useState, useEffect, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '@/store'
import { setCredits, setMaxResume } from '@/store/slices/authSlice'
import { paymentApi, type PlanName, type PaymentHistoryItem } from '@/api/payment'
import { customResumeApi } from '@/api/custom-resume'
import { toast } from 'react-toastify'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, CreditCard, Coins, FileText, Check } from 'lucide-react'
import { PAYMENT_PLANS, RESUME_SLOT_COST } from '@/utils/paymentConstants'

// Declare Razorpay type for window
declare global {
  interface Window {
    Razorpay: any
  }
}

const Payments = () => {
  const dispatch = useDispatch()
  const credits = useSelector((state: RootState) => state.auth.credits)
  const maxResume = useSelector((state: RootState) => state.auth.max_resume)
  const [resumes, setResumes] = useState<any[]>([])
  const [loadingResumes, setLoadingResumes] = useState(false)
  const [processingPlan, setProcessingPlan] = useState<PlanName | null>(null)
  const [isBuySlotDialogOpen, setIsBuySlotDialogOpen] = useState(false)
  const [buyingSlot, setBuyingSlot] = useState(false)
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Function to fetch payment history
  const fetchPaymentHistory = useCallback(async () => {
    try {
      setLoadingHistory(true)
      const data = await paymentApi.getPaymentHistory()
      setPaymentHistory(data.payments)
    } catch (error: any) {
      console.error('Error fetching payment history:', error)
      toast.error(
        error.response?.data?.detail || 'Failed to fetch payment history'
      )
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  // Load Razorpay script
  useEffect(() => {
    if (window.Razorpay) {
      setRazorpayLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => {
      setRazorpayLoaded(true)
    }
    script.onerror = () => {
      console.error('Failed to load Razorpay script')
      toast.error('Failed to load payment gateway. Please refresh the page.')
    }
    document.body.appendChild(script)

    return () => {
      // Cleanup: remove script if component unmounts
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
      if (existingScript) {
        document.body.removeChild(existingScript)
      }
    }
  }, [])

  // Fetch current resume count
  useEffect(() => {
    const fetchResumes = async () => {
      try {
        setLoadingResumes(true)
        const data = await customResumeApi.getAllResumes()
        setResumes(data)
      } catch (error: any) {
        console.error('Error fetching resumes:', error)
      } finally {
        setLoadingResumes(false)
      }
    }
    fetchResumes()
  }, [])

  // Fetch payment history on mount
  useEffect(() => {
    fetchPaymentHistory()
  }, [fetchPaymentHistory])

  const handleBuyCredits = async (planName: PlanName) => {
    if (!razorpayLoaded) {
      toast.error('Payment gateway is still loading. Please wait a moment and try again.')
      return
    }

    try {
      setProcessingPlan(planName)
      
      // Create order
      const orderData = await paymentApi.createOrder(planName)

      // Initialize Razorpay
      const options = {
        key: orderData.key_id,
        amount: orderData.amount * 100, // Convert to paise
        currency: orderData.currency,
        name: 'Resume Customizer',
        description: `${orderData.credits} Credits - ${orderData.plan_name}`,
        order_id: orderData.order_id,
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyData = await paymentApi.verifyPayment({
              payment_id: response.razorpay_payment_id,
              order_id: response.razorpay_order_id,
              signature: response.razorpay_signature,
              plan_name: orderData.plan_name,
            })

            // Update credits in Redux
            // We need to calculate new credits: current + credits_added
            const currentCredits = credits || 0
            dispatch(setCredits(currentCredits + verifyData.credits_added))

            // Refresh payment history to show the new payment
            await fetchPaymentHistory()

            toast.success(`Successfully added ${verifyData.credits_added} credits!`)
          } catch (error: any) {
            console.error('Payment verification error:', error)
            toast.error(
              error.response?.data?.detail || 'Payment verification failed. Please contact support.'
            )
          } finally {
            setProcessingPlan(null)
          }
        },
        prefill: {
          // User details if available
        },
        theme: {
          color: '#3399cc',
        },
        modal: {
          ondismiss: () => {
            setProcessingPlan(null)
          },
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error: any) {
      console.error('Error creating payment order:', error)
      toast.error(
        error.response?.data?.detail || 'Failed to create payment order. Please try again.'
      )
      setProcessingPlan(null)
    }
  }

  const handleBuyResumeSlot = async () => {
    if (credits === null || credits < RESUME_SLOT_COST) {
      toast.error(`Insufficient credits. You need ${RESUME_SLOT_COST} credits but only have ${credits || 0} credits.`)
      setIsBuySlotDialogOpen(false)
      return
    }

    try {
      setBuyingSlot(true)
      const response = await paymentApi.buyResumeSlot()

      // Update Redux state
      dispatch(setCredits(response.credits_remaining))
      dispatch(setMaxResume(response.max_resume))

      // Refresh resume list
      const data = await customResumeApi.getAllResumes()
      setResumes(data)

      toast.success(response.message)
      setIsBuySlotDialogOpen(false)
    } catch (error: any) {
      console.error('Error buying resume slot:', error)
      const errorMessage =
        error.response?.data?.detail ||
        'Failed to purchase resume slot. Please try again.'
      toast.error(errorMessage)
    } finally {
      setBuyingSlot(false)
    }
  }

  const currentResumeCount = resumes.length
  const canCreateMore = maxResume !== null && currentResumeCount < maxResume

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Payments</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Purchase credits and manage your resume slots
        </p>
      </div>

      {/* Buy Credits Section */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <Coins className="h-6 w-6 text-primary" />
          <h2 className="text-xl sm:text-2xl font-semibold">Buy Credits</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {PAYMENT_PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative border rounded-lg p-6 hover:shadow-lg transition-shadow bg-card ${
                plan.popular ? 'ring-2 ring-primary' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
                    POPULAR
                  </span>
                </div>
              )}
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
                <div className="mb-2">
                  <span className="text-3xl font-bold">₹{plan.price}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                <div className="flex items-center justify-center gap-2 text-lg font-semibold text-primary">
                  <Coins className="h-5 w-5" />
                  <span>{plan.credits} Credits</span>
                </div>
              </div>
              <Button
                className="w-full mt-4"
                onClick={() => handleBuyCredits(plan.name)}
                disabled={processingPlan !== null}
              >
                {processingPlan === plan.name ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Buy Now
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Buy Resume Slot Section */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="h-6 w-6 text-primary" />
          <h2 className="text-xl sm:text-2xl font-semibold">Resume Slots</h2>
        </div>
        <div className="border rounded-lg p-6 bg-card">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Resume Count</p>
                <p className="text-2xl font-bold">{loadingResumes ? '...' : currentResumeCount}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Max Resume Slots</p>
                <p className="text-2xl font-bold">{maxResume !== null ? maxResume : '...'}</p>
              </div>
            </div>
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-semibold mb-1">Buy Additional Resume Slot</p>
                  <p className="text-sm text-muted-foreground">
                    Cost: <span className="font-semibold text-primary">{RESUME_SLOT_COST} Credits</span>
                  </p>
                  {credits !== null && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Your Credits: <span className="font-semibold">{credits}</span>
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => setIsBuySlotDialogOpen(true)}
                  disabled={credits !== null && credits < RESUME_SLOT_COST}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Buy Slot
                </Button>
              </div>
              {credits !== null && credits < RESUME_SLOT_COST && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Insufficient credits. You need {RESUME_SLOT_COST} credits but only have {credits} credits.{' '}
                    <a href="#buy-credits" className="underline font-semibold">
                      Buy more credits
                    </a>
                  </p>
                </div>
              )}
              {!canCreateMore && maxResume !== null && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3 mt-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    You have reached your resume limit ({maxResume} resumes). Buy a new slot to
                    create more resumes.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment History Section */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <CreditCard className="h-6 w-6 text-primary" />
          <h2 className="text-xl sm:text-2xl font-semibold">Payment History</h2>
        </div>
        <div className="border rounded-lg p-6 bg-card">
          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : paymentHistory.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No payment history found
            </p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paymentHistory.map((payment) => (
                  <div
                    key={payment.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-background"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{payment.plan_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(payment.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          payment.status === 'completed'
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                            : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'
                        }`}
                      >
                        {payment.status}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Amount Paid:</span>
                        <span className="font-semibold">₹{payment.amount_paid}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Credits Added:</span>
                        <span className="font-semibold text-primary">
                          {payment.credits_added} Credits
                        </span>
                      </div>
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground truncate" title={payment.payment_id}>
                          Payment ID: {payment.payment_id}
                        </p>
                        <p className="text-xs text-muted-foreground truncate" title={payment.order_id}>
                          Order ID: {payment.order_id}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t text-center">
                <p className="text-sm text-muted-foreground">
                  Total Payments: <span className="font-semibold">{paymentHistory.length}</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Buy Resume Slot Confirmation Dialog */}
      <Dialog open={isBuySlotDialogOpen} onOpenChange={setIsBuySlotDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buy Resume Slot</DialogTitle>
            <DialogDescription>
              This will cost {RESUME_SLOT_COST} credits. After purchase, you'll be able to create one additional
              resume.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cost:</span>
                <span className="font-semibold">{RESUME_SLOT_COST} Credits</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Your Credits:</span>
                <span className="font-semibold">{credits !== null ? credits : '...'}</span>
              </div>
              {credits !== null && (
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-muted-foreground">Remaining Credits:</span>
                  <span className="font-semibold text-primary">
                    {credits >= RESUME_SLOT_COST ? credits - RESUME_SLOT_COST : 'Insufficient'}
                  </span>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsBuySlotDialogOpen(false)}
              disabled={buyingSlot}
            >
              Cancel
            </Button>
            <Button onClick={handleBuyResumeSlot} disabled={buyingSlot || (credits !== null && credits < RESUME_SLOT_COST)}>
              {buyingSlot ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Confirm Purchase
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Payments
