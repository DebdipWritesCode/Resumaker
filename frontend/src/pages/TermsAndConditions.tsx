import { FileText, Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
            <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
            Terms and Conditions
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
              Welcome to Resumaker. These Terms and Conditions ("Terms") govern your access to and use of our resume customization service. By creating an account, accessing, or using our service, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our service.
            </p>
          </section>

          {/* Service Description */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">1. Service Description</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              Resumaker provides an online platform that allows users to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 ml-4">
              <li>Create and customize professional resumes</li>
              <li>Store and manage resume elements (education, experience, projects, skills, etc.)</li>
              <li>Generate PDF versions of resumes</li>
              <li>Access AI-powered resume customization features</li>
              <li>Purchase credits for additional resume slots and features</li>
            </ul>
          </section>

          {/* Eligibility */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">2. Eligibility</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              To use our service, you must:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 ml-4">
              <li>Be at least 18 years of age or have parental consent</li>
              <li>Have the legal capacity to enter into binding agreements</li>
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Comply with all applicable laws and regulations</li>
            </ul>
          </section>

          {/* User Accounts */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">3. User Accounts</h2>
            
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-6">3.1 Account Creation</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              You are responsible for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 ml-4">
              <li>Maintaining the confidentiality of your account password</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized access</li>
              <li>Ensuring your account information is accurate and up-to-date</li>
            </ul>

            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-6">3.2 Account Termination</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              We reserve the right to suspend or terminate your account at any time if you violate these Terms, engage in fraudulent activity, or for any other reason we deem necessary to protect our service and other users.
            </p>
          </section>

          {/* Acceptable Use */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">4. Acceptable Use Policy</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              You agree not to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 ml-4">
              <li>Use the service for any illegal or unauthorized purpose</li>
              <li>Violate any laws, regulations, or third-party rights</li>
              <li>Transmit any viruses, malware, or harmful code</li>
              <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
              <li>Interfere with or disrupt the service or servers</li>
              <li>Use automated systems (bots, scrapers) to access the service without permission</li>
              <li>Impersonate any person or entity</li>
              <li>Upload false, misleading, or fraudulent information</li>
              <li>Reverse engineer, decompile, or disassemble any part of the service</li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">5. Intellectual Property Rights</h2>
            
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-6">5.1 Our Rights</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              The service, including its design, features, functionality, and content, is owned by Resumaker and protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or create derivative works without our express written permission.
            </p>

            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-6">5.2 Your Content</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              You retain ownership of the resume content and data you upload. By using our service, you grant us a license to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 ml-4">
              <li>Store, process, and display your content to provide the service</li>
              <li>Generate and deliver resume PDFs as requested</li>
              <li>Use anonymized, aggregated data for service improvement</li>
            </ul>
          </section>

          {/* Payment Terms */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">6. Payment Terms</h2>
            
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-6">6.1 Pricing</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              We offer various credit packages and plans. All prices are displayed in INR (Indian Rupees) and are subject to change. We reserve the right to modify pricing at any time, but changes will not affect purchases already completed.
            </p>

            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-6">6.2 Payment Processing</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              Payments are processed securely through Razorpay. By making a purchase, you agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 ml-4">
              <li>Provide accurate payment information</li>
              <li>Authorize us to charge the specified amount</li>
              <li>Comply with Razorpay's terms of service</li>
            </ul>

            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-6">6.3 Credits and Refunds</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Credits purchased are non-transferable and subject to our refund policy. Please review our <Link to="/cancellations-refunds" className="text-blue-600 dark:text-blue-400 hover:underline">Cancellations and Refunds Policy</Link> for details.
            </p>
          </section>

          {/* Service Availability */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">7. Service Availability and Modifications</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              We strive to provide reliable service but do not guarantee:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 ml-4">
              <li>Uninterrupted or error-free service</li>
              <li>That the service will meet all your requirements</li>
              <li>That defects will be corrected immediately</li>
            </ul>
            <p className="text-slate-600 dark:text-slate-300 mt-4 leading-relaxed">
              We reserve the right to modify, suspend, or discontinue any part of the service at any time with or without notice. We may also impose limits on certain features or restrict access to parts of the service.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">8. Limitation of Liability</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              To the maximum extent permitted by law:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 ml-4">
              <li>We provide the service "as is" and "as available" without warranties of any kind</li>
              <li>We are not liable for any indirect, incidental, special, or consequential damages</li>
              <li>Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim</li>
              <li>We are not responsible for any loss of data, profits, or business opportunities</li>
            </ul>
            <p className="text-slate-600 dark:text-slate-300 mt-4 leading-relaxed">
              Some jurisdictions do not allow the exclusion of certain warranties or limitations of liability, so some of the above limitations may not apply to you.
            </p>
          </section>

          {/* Dispute Resolution */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">9. Dispute Resolution</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              If you have any concerns or disputes regarding the service:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-slate-600 dark:text-slate-300 ml-4">
              <li>Contact us first through our <Link to="/contact-us" className="text-blue-600 dark:text-blue-400 hover:underline">contact page</Link> to attempt resolution</li>
              <li>We will work in good faith to resolve the dispute within 30 days</li>
              <li>If resolution cannot be reached, disputes shall be resolved through binding arbitration in accordance with applicable laws</li>
            </ol>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">10. Governing Law</h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions. Any legal action or proceeding arising under these Terms will be brought exclusively in the courts of India.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">11. Changes to Terms</h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify you of material changes by posting the updated Terms on this page and updating the "Last updated" date. Your continued use of the service after such changes constitutes acceptance of the modified Terms. If you do not agree to the changes, you must stop using the service.
            </p>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">12. Contact Information</h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              If you have any questions about these Terms, please contact us through our <Link to="/contact-us" className="text-blue-600 dark:text-blue-400 hover:underline">contact page</Link>.
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

export default TermsAndConditions
