import { Shield, Mail, Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
            <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
            Privacy Policy
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
              At Resumaker, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our resume customization service.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">1. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-6">1.1 Personal Information</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              When you register for an account, we collect:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 ml-4">
              <li>Name and email address</li>
              <li>Password (stored in encrypted form)</li>
              <li>Profile information you choose to provide</li>
            </ul>

            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-6">1.2 Resume Data</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              We collect and store the resume information you provide, including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 ml-4">
              <li>Personal details (name, contact information, links)</li>
              <li>Education history</li>
              <li>Work experience</li>
              <li>Projects, skills, certifications, awards, and volunteer experiences</li>
              <li>Resume versions and PDFs you generate</li>
            </ul>

            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-6">1.3 Payment Information</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              When you make a purchase:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 ml-4">
              <li>Payment details are processed securely through Razorpay, our payment gateway</li>
              <li>We do not store your credit card or banking information</li>
              <li>We maintain records of transactions for accounting and support purposes</li>
            </ul>

            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-6">1.4 Usage Data</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              We automatically collect information about how you use our service:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 ml-4">
              <li>IP address and device information</li>
              <li>Browser type and version</li>
              <li>Pages visited and time spent on pages</li>
              <li>Date and time of access</li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">2. How We Use Your Information</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 ml-4">
              <li>Provide, maintain, and improve our resume customization service</li>
              <li>Process your transactions and manage your account</li>
              <li>Generate and deliver your customized resumes</li>
              <li>Send you service-related communications, including updates and support</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Detect, prevent, and address technical issues and security threats</li>
              <li>Comply with legal obligations and enforce our terms of service</li>
              <li>Analyze usage patterns to improve user experience</li>
            </ul>
          </section>

          {/* Data Storage and Security */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">3. Data Storage and Security</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              We implement industry-standard security measures to protect your information:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 ml-4">
              <li>Data encryption in transit (HTTPS/TLS) and at rest</li>
              <li>Secure password hashing using bcrypt</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Secure cloud infrastructure with reputable providers</li>
            </ul>
            <p className="text-slate-600 dark:text-slate-300 mt-4 leading-relaxed">
              However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          {/* Cookies and Tracking */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">4. Cookies and Tracking Technologies</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              We use cookies and similar tracking technologies to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 ml-4">
              <li>Maintain your session and authentication state</li>
              <li>Remember your preferences and settings</li>
              <li>Analyze service usage and improve functionality</li>
              <li>Provide personalized content and features</li>
            </ul>
            <p className="text-slate-600 dark:text-slate-300 mt-4 leading-relaxed">
              You can control cookies through your browser settings. However, disabling cookies may limit your ability to use certain features of our service.
            </p>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">5. Third-Party Services</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              We use third-party services that may collect information:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 ml-4">
              <li><strong>Razorpay:</strong> Payment processing. Their privacy policy governs payment data handling.</li>
              <li><strong>Cloud Storage:</strong> For storing resume PDFs and uploaded files</li>
              <li><strong>Email Services:</strong> For sending transactional and service emails</li>
              <li><strong>Analytics:</strong> To understand usage patterns and improve our service</li>
            </ul>
            <p className="text-slate-600 dark:text-slate-300 mt-4 leading-relaxed">
              These third parties have their own privacy policies. We encourage you to review them. We are not responsible for the privacy practices of third-party services.
            </p>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">6. Your Rights</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              You have the following rights regarding your personal information:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 ml-4">
              <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
              <li><strong>Portability:</strong> Export your resume data in a portable format</li>
              <li><strong>Objection:</strong> Object to certain processing of your information</li>
              <li><strong>Withdrawal:</strong> Withdraw consent where processing is based on consent</li>
            </ul>
            <p className="text-slate-600 dark:text-slate-300 mt-4 leading-relaxed">
              To exercise these rights, please contact us using the information provided in the Contact section below.
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">7. Data Retention</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              We retain your information for as long as necessary to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 ml-4">
              <li>Provide our services to you</li>
              <li>Comply with legal obligations</li>
              <li>Resolve disputes and enforce agreements</li>
              <li>Maintain business records for accounting and tax purposes</li>
            </ul>
            <p className="text-slate-600 dark:text-slate-300 mt-4 leading-relaxed">
              When you delete your account, we will delete or anonymize your personal information, except where we are required to retain it for legal or legitimate business purposes.
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">8. Children's Privacy</h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Our service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you become aware that a child has provided us with personal information, please contact us, and we will take steps to delete such information.
            </p>
          </section>

          {/* Changes to Privacy Policy */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">9. Changes to This Privacy Policy</h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this Privacy Policy periodically to stay informed about how we protect your information.
            </p>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">10. Contact Us</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white mb-1">Email</p>
                  <p className="text-slate-600 dark:text-slate-300">
                    <Link to="/contact-us" className="text-blue-600 dark:text-blue-400 hover:underline">
                      Contact us through our contact page
                    </Link>
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

export default PrivacyPolicy
