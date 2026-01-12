declare module 'razorpay' {
  interface RazorpayOptions {
    key: string
    amount: number
    currency: string
    name: string
    description: string
    order_id: string
    handler: (response: RazorpayPaymentResponse) => void | Promise<void>
    prefill?: {
      name?: string
      email?: string
      contact?: string
    }
    theme?: {
      color?: string
    }
    modal?: {
      ondismiss?: () => void
    }
  }

  interface RazorpayPaymentResponse {
    razorpay_payment_id: string
    razorpay_order_id: string
    razorpay_signature: string
  }

  class Razorpay {
    constructor(options: RazorpayOptions)
    open(): void
    on(event: string, handler: (response: RazorpayPaymentResponse) => void): void
  }

  export = Razorpay
}
