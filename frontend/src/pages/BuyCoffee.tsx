import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store'
import { paymentApi } from '@/api/payment'
import { toast } from 'react-toastify'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Coffee, Heart, CheckCircle } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

// Declare Razorpay type for window
declare global {
  interface Window {
    Razorpay: any
  }
}

const BuyCoffee = () => {
  const userName = useSelector((state: RootState) => state.auth.name)
  const userEmail = useSelector((state: RootState) => state.auth.email)
  const [amount, setAmount] = useState<number>(100)
  const [processing, setProcessing] = useState(false)
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)

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

  const handleAmountChange = (value: string) => {
    const numValue = parseInt(value, 10)
    if (isNaN(numValue)) {
      setAmount(0)
      return
    }
    if (numValue < 10) {
      setAmount(10)
      toast.warning('Minimum amount is ₹10')
      return
    }
    if (numValue > 10000) {
      setAmount(10000)
      toast.warning('Maximum amount is ₹10,000')
      return
    }
    setAmount(numValue)
  }

  const handleBuyCoffee = async () => {
    if (!razorpayLoaded) {
      toast.error('Payment gateway is still loading. Please wait a moment and try again.')
      return
    }

    if (amount < 10) {
      toast.error('Minimum amount is ₹10')
      return
    }

    if (amount > 10000) {
      toast.error('Maximum amount is ₹10,000')
      return
    }

    try {
      setProcessing(true)

      // Create order
      const orderData = await paymentApi.createCoffeeOrder(amount)

      // Initialize Razorpay
      const options = {
        key: orderData.key_id,
        amount: orderData.amount * 100, // Convert to paise
        currency: orderData.currency,
        name: 'Resume Customizer',
        description: 'Buy Coffee - Support Us',
        order_id: orderData.order_id,
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyData = await paymentApi.verifyCoffeePayment({
              payment_id: response.razorpay_payment_id,
              order_id: response.razorpay_order_id,
              signature: response.razorpay_signature,
              amount: orderData.amount,
            })

            toast.success(
              `Thank you for your support! Your donation of ₹${verifyData.amount_paid} is greatly appreciated.`,
              {
                icon: <Heart className="h-5 w-5 text-red-500" />,
              }
            )
          } catch (error: any) {
            console.error('Payment verification error:', error)
            toast.error(
              error.response?.data?.detail || 'Payment verification failed. Please contact support.'
            )
          } finally {
            setProcessing(false)
          }
        },
        prefill: {
          name: userName || undefined,
          email: userEmail || undefined,
        },
        theme: {
          color: '#3399cc',
        },
        modal: {
          ondismiss: () => {
            setProcessing(false)
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
      setProcessing(false)
    }
  }

  const quickAmounts = [50, 100, 200, 500, 1000]

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 sm:mb-12 text-center">
          <div className="inline-block mb-4 px-4 py-1.5 bg-linear-to-br from-amber-500/10 to-orange-500/10 rounded-full border border-amber-500/20">
            <span className="text-sm font-semibold bg-linear-to-br from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Support Our Platform
            </span>
          </div>
          <div className="flex items-center justify-center gap-3 mb-4">
            <Coffee className="h-8 w-8 sm:h-10 sm:w-10 text-amber-600 dark:text-amber-400" />
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-linear-to-br from-slate-900 via-amber-900 to-slate-900 dark:from-white dark:via-amber-200 dark:to-white bg-clip-text text-transparent leading-tight">
              Buy a Coffee
            </h1>
          </div>
          <p className="text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Show your support by buying us a coffee! Your contribution helps us maintain and improve the platform.
          </p>
        </div>

        {/* Main Card */}
        <Card className="shadow-xl border-2">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl sm:text-3xl mb-2">Make a Donation</CardTitle>
            <CardDescription className="text-base">
              Choose an amount between ₹10 and ₹10,000 to support our work
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Quick Amount Buttons */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Quick Select</Label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {quickAmounts.map((quickAmount) => (
                  <Button
                    key={quickAmount}
                    variant={amount === quickAmount ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() => setAmount(quickAmount)}
                    disabled={processing}
                  >
                    ₹{quickAmount}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Amount Input */}
            <div>
              <Label htmlFor="amount" className="text-sm font-medium mb-2 block">
                Or Enter Custom Amount
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-semibold">
                  ₹
                </span>
                <Input
                  id="amount"
                  type="number"
                  min={10}
                  max={10000}
                  value={amount || ''}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="pl-8 text-lg font-semibold"
                  placeholder="Enter amount"
                  disabled={processing}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Minimum: ₹10 | Maximum: ₹10,000
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Heart className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Note:</p>
                  <p>
                    This is a donation to support the platform. No credits will be added to your account.
                    Your contribution helps us continue providing this service.
                  </p>
                </div>
              </div>
            </div>

            {/* Donate Button */}
            <Button
              onClick={handleBuyCoffee}
              disabled={processing || amount < 10 || amount > 10000}
              className="w-full h-12 text-lg font-semibold"
              size="lg"
            >
              {processing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Coffee className="h-5 w-5 mr-2" />
                  Donate ₹{amount}
                </>
              )}
            </Button>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
                <p className="text-sm font-semibold mb-1">Secure Payment</p>
                <p className="text-xs text-muted-foreground">
                  Powered by Razorpay
                </p>
              </div>
              <div className="text-center">
                <Heart className="h-6 w-6 text-red-500 mx-auto mb-2" />
                <p className="text-sm font-semibold mb-1">Support Us</p>
                <p className="text-xs text-muted-foreground">
                  Help us grow and improve
                </p>
              </div>
              <div className="text-center">
                <Coffee className="h-6 w-6 text-amber-600 dark:text-amber-400 mx-auto mb-2" />
                <p className="text-sm font-semibold mb-1">Any Amount</p>
                <p className="text-xs text-muted-foreground">
                  From ₹10 to ₹10,000
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Thank You Message */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Thank you for considering supporting our platform! Every contribution makes a difference.
          </p>
        </div>
      </div>
    </div>
  )
}

export default BuyCoffee
