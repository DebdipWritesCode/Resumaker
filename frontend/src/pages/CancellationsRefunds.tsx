import { RefreshCw, Calendar, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'

const CancellationsRefunds = () => {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
            <RefreshCw className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
            Cancellations and Refunds
          </h1>
          <div className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Calendar className="h-4 w-4" />
            <span>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-8 sm:p-10 space-y-8">
          {/* Introduction */}
          <section>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              At Resumaker, we want you to be satisfied with your purchase. This policy outlines our refund and cancellation procedures for credit purchases and donations made through our service.
            </p>
          </section>

          {/* Refund Eligibility */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">1. Refund Eligibility</h2>
            
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-6">1.1 Eligible Refunds</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              Refunds may be considered in the following circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 ml-4">
              <li>Duplicate payment made in error</li>
              <li>Technical error preventing service delivery</li>
              <li>Unauthorized transaction on your account</li>
              <li>Service unavailability for an extended period (more than 48 hours)</li>
              <li>Request made within 7 days of purchase and credits have not been used</li>
            </ul>

            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-6">1.2 Non-Refundable Items</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              The following are generally non-refundable:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 ml-4">
              <li>Credits that have been used to generate resumes or purchase resume slots</li>
              <li>Donations made through the "Buy Coffee" feature (voluntary contributions)</li>
              <li>Purchases made more than 30 days ago</li>
              <li>Refunds requested due to user error (e.g., accidental purchase)</li>
            </ul>
          </section>

          {/* Credit Purchases Refund Policy */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">2. Credit Purchases Refund Policy</h2>
            
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-6">2.1 Unused Credits</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              If you have purchased credits but have not used them, you may be eligible for a refund if:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 ml-4">
              <li>The refund request is made within 7 days of purchase</li>
              <li>No credits from the purchase have been used</li>
              <li>The request is due to a valid reason (see Section 1.1)</li>
            </ul>

            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-6">2.2 Partial Refunds</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Partial refunds may be considered on a case-by-case basis if only a portion of purchased credits have been used. The refund amount will be calculated based on the unused credits at the time of the refund request.
            </p>

            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-6">2.3 Refund Process for Credits</h3>
            <ol className="list-decimal list-inside space-y-2 text-slate-600 dark:text-slate-300 ml-4">
              <li>Submit a refund request through our <Link to="/contact-us" className="text-blue-600 dark:text-blue-400 hover:underline">contact page</Link></li>
              <li>Include your order ID, payment ID, and reason for refund</li>
              <li>We will review your request within 2-3 business days</li>
              <li>If approved, the refund will be processed to your original payment method</li>
              <li>Refund processing may take 5-10 business days to reflect in your account</li>
            </ol>
          </section>

          {/* Coffee Donations Refund Policy */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">3. Coffee Donations Refund Policy</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              The "Buy Coffee" feature allows users to make voluntary donations to support our service. These donations are:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 ml-4">
              <li>Voluntary contributions and are generally non-refundable</li>
              <li>Not tied to any service or product delivery</li>
              <li>Processed as one-time payments</li>
            </ul>
            <p className="text-slate-600 dark:text-slate-300 mt-4 leading-relaxed">
              However, refunds for donations may be considered in exceptional circumstances, such as:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 ml-4">
              <li>Accidental duplicate donations</li>
              <li>Unauthorized transactions</li>
              <li>Technical errors during payment processing</li>
            </ul>
            <p className="text-slate-600 dark:text-slate-300 mt-4 leading-relaxed">
              Refund requests for donations must be made within 48 hours of the transaction.
            </p>
          </section>

          {/* Cancellation Procedures */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">4. Cancellation Procedures</h2>
            
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-6">4.1 Account Cancellation</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              You may cancel your account at any time through your account settings. Upon cancellation:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 ml-4">
              <li>Your account and associated data will be deleted according to our data retention policy</li>
              <li>Unused credits will be forfeited unless a refund is requested and approved</li>
              <li>You will lose access to all your saved resumes and data</li>
            </ul>

            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-6">4.2 Subscription Cancellation</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              If we introduce subscription plans in the future, you may cancel your subscription at any time. Cancellation will take effect at the end of your current billing period, and you will continue to have access to paid features until then.
            </p>
          </section>

          {/* Refund Processing Timeframes */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">5. Refund Processing Timeframes</h2>
            
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-6 border border-slate-200 dark:border-slate-700 space-y-4">
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Request Review</h4>
                <p className="text-slate-600 dark:text-slate-300">2-3 business days</p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Refund Processing</h4>
                <p className="text-slate-600 dark:text-slate-300">5-10 business days after approval</p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Bank/Card Reflection</h4>
                <p className="text-slate-600 dark:text-slate-300">Additional 3-5 business days (varies by bank)</p>
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-300 mt-4 leading-relaxed">
              Total time from request to refund appearing in your account: typically 10-18 business days.
            </p>
          </section>

          {/* How to Request a Refund */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">6. How to Request a Refund</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              To request a refund, please:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-slate-600 dark:text-slate-300 ml-4">
              <li>Visit our <Link to="/contact-us" className="text-blue-600 dark:text-blue-400 hover:underline">contact page</Link></li>
              <li>Select "Refund Request" as the subject</li>
              <li>Provide the following information:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li>Your account email address</li>
                  <li>Order ID or Payment ID (from your payment confirmation email)</li>
                  <li>Date of purchase</li>
                  <li>Amount paid</li>
                  <li>Reason for refund request</li>
                </ul>
              </li>
              <li>Submit the form and wait for our response</li>
            </ol>
          </section>

          {/* Dispute Resolution */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">7. Dispute Resolution</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              If you are not satisfied with our refund decision:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 ml-4">
              <li>You may request a review by providing additional information or documentation</li>
              <li>We will conduct a second review within 5 business days</li>
              <li>If the dispute remains unresolved, you may contact your payment provider (Razorpay) or bank for assistance</li>
              <li>You may also seek resolution through applicable consumer protection authorities</li>
            </ul>
          </section>

          {/* Special Circumstances */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">8. Special Circumstances</h2>
            
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-6">8.1 Service Outages</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              If our service is unavailable for more than 48 consecutive hours due to technical issues on our end, we will consider refund requests for purchases made during or immediately before the outage period.
            </p>

            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-6">8.2 Fraudulent Transactions</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              If you notice unauthorized transactions on your account, contact us immediately. We will investigate and process refunds for confirmed fraudulent transactions.
            </p>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">9. Contact Information</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              For refund requests or questions about this policy, please contact us:
            </p>
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white mb-1">Refund Support</p>
                  <p className="text-slate-600 dark:text-slate-300">
                    <Link to="/contact-us" className="text-blue-600 dark:text-blue-400 hover:underline">
                      Submit a refund request through our contact page
                    </Link>
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    Please include your order ID and payment details for faster processing.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center">
          <Link 
            to="/" 
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default CancellationsRefunds
