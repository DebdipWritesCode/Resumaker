import { Package, Calendar, Zap, Globe, HelpCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

const ShippingPolicy = () => {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
            <Package className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
            Shipping Policy
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
              Resumaker is a digital service that provides online resume customization tools. This Shipping Policy explains how we deliver our digital services and products to you.
            </p>
          </section>

          {/* Digital Service Delivery */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">1. Digital Service Delivery</h2>
            
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-6 border border-blue-200 dark:border-blue-800 mb-4">
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900 dark:text-blue-200 mb-2">Instant Access</p>
                  <p className="text-blue-800 dark:text-blue-300">
                    All our services are delivered digitally with instant access upon purchase or account creation. No physical shipping is involved.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              As a digital service provider, Resumaker does not ship physical products. All services are delivered electronically through:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 ml-4">
              <li>Immediate access to your account upon registration</li>
              <li>Instant credit activation after payment confirmation</li>
              <li>Real-time resume generation and PDF download</li>
              <li>Cloud-based storage of your resume data</li>
            </ul>
          </section>

          {/* No Physical Shipping */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">2. No Physical Shipping</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              Resumaker provides exclusively digital services. We do not:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 ml-4">
              <li>Ship physical products, documents, or merchandise</li>
              <li>Provide printed resumes or physical copies</li>
              <li>Require shipping addresses for service delivery</li>
              <li>Charge shipping fees or handling charges</li>
            </ul>
            <p className="text-slate-600 dark:text-slate-300 mt-4 leading-relaxed">
              All resume PDFs and documents are generated digitally and can be downloaded directly from your account.
            </p>
          </section>

          {/* Delivery Method */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">3. Delivery Method</h2>
            
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-6">3.1 Account Access</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              Upon successful registration:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 ml-4">
              <li>You receive immediate access to your account dashboard</li>
              <li>You can start creating and customizing resumes right away</li>
              <li>All features are available instantly through your web browser</li>
            </ul>

            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-6">3.2 Credit Activation</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              After purchasing credits:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 ml-4">
              <li>Credits are added to your account immediately upon payment confirmation</li>
              <li>No waiting period or processing time required</li>
              <li>You can use credits instantly to generate resumes or purchase additional slots</li>
            </ul>

            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-6">3.3 Resume PDF Delivery</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              When you generate a resume PDF:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 ml-4">
              <li>The PDF is generated instantly and available for download</li>
              <li>You can download it directly from your account</li>
              <li>PDFs are stored in your account history for future access</li>
              <li>No email delivery required (though you may receive confirmation emails)</li>
            </ul>
          </section>

          {/* Delivery Timeframe */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">4. Delivery Timeframe</h2>
            
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-6 border border-slate-200 dark:border-slate-700 space-y-4">
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Account Registration</h4>
                <p className="text-slate-600 dark:text-slate-300">Instant (immediate access)</p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Credit Purchase</h4>
                <p className="text-slate-600 dark:text-slate-300">Instant (upon payment confirmation, typically within seconds)</p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Resume PDF Generation</h4>
                <p className="text-slate-600 dark:text-slate-300">Instant (typically 5-30 seconds depending on complexity)</p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Email Notifications</h4>
                <p className="text-slate-600 dark:text-slate-300">Within 1-5 minutes of the action</p>
              </div>
            </div>
          </section>

          {/* International Availability */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">5. International Availability</h2>
            
            <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-6 border border-slate-200 dark:border-slate-700 mb-4">
              <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-white mb-2">Global Access</p>
                <p className="text-slate-600 dark:text-slate-300">
                  Resumaker is available worldwide. Since we provide digital services, there are no geographical restrictions or international shipping considerations. Our service is accessible from anywhere with an internet connection.
                </p>
              </div>
            </div>

            <p className="text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              All users, regardless of location, receive:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 ml-4">
              <li>Same instant delivery of digital services</li>
              <li>No additional fees for international users</li>
              <li>Access to all features and functionalities</li>
              <li>Support in English (additional languages may be added in the future)</li>
            </ul>
          </section>

          {/* Technical Requirements */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">6. Technical Requirements</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              To access and use our digital services, you need:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 ml-4">
              <li>A device (computer, tablet, or smartphone) with internet connectivity</li>
              <li>A modern web browser (Chrome, Firefox, Safari, Edge, or Opera)</li>
              <li>JavaScript enabled in your browser</li>
              <li>A valid email address for account registration</li>
              <li>Sufficient storage space on your device for downloading PDFs (if desired)</li>
            </ul>
            <p className="text-slate-600 dark:text-slate-300 mt-4 leading-relaxed">
              No special software installation is required. Our service is web-based and accessible through any standard web browser.
            </p>
          </section>

          {/* Delivery Issues and Support */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">7. Delivery Issues and Support</h2>
            
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-6">7.1 Common Issues</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              If you experience issues accessing our service:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 ml-4">
              <li><strong>Account Access:</strong> Verify your email and password. Use the password reset feature if needed.</li>
              <li><strong>Credit Not Appearing:</strong> Check your payment confirmation email. Contact support if credits don't appear within 5 minutes.</li>
              <li><strong>PDF Download Issues:</strong> Try a different browser or clear your browser cache. Ensure pop-up blockers are disabled.</li>
              <li><strong>Email Not Received:</strong> Check your spam folder. Verify your email address in account settings.</li>
            </ul>

            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-6">7.2 Support</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              If you need assistance with delivery or access issues:
            </p>
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
              <div className="flex items-start gap-3">
                <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white mb-1">Get Help</p>
                  <p className="text-slate-600 dark:text-slate-300">
                    Visit our <Link to="/contact-us" className="text-blue-600 dark:text-blue-400 hover:underline">contact page</Link> for support. Include details about the issue you're experiencing, and we'll respond within 24-48 hours.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Updates and Changes */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">8. Updates and Changes</h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              We may update our service delivery methods or add new features. Any significant changes will be communicated through:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 ml-4 mt-3">
              <li>Email notifications to registered users</li>
              <li>Announcements on our website</li>
              <li>In-app notifications</li>
            </ul>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">9. Contact Information</h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              For questions about service delivery or technical support, please visit our <Link to="/contact-us" className="text-blue-600 dark:text-blue-400 hover:underline">contact page</Link>.
            </p>
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

export default ShippingPolicy
