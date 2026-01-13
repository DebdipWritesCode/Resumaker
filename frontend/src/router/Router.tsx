import Login from '@/pages/Auth/Login'
import Signup from '@/pages/Auth/Signup'
import VerifyEmail from '@/pages/Auth/VerifyEmail'
import ForgotPassword from '@/pages/Auth/ForgotPassword'
import NotFound from '@/pages/NotFound'
import { Route, Routes } from 'react-router-dom'

import DashboardLayout from '@/layouts/DashboardLayout'
import ProtectedRoute from './ProtectedRoute'
import AdminProtectedRoute from './AdminProtectedRoute'
import Landing from '@/pages/Landing'
import Dashboard from '@/pages/Dashboard'
import MyElements from '@/pages/MyElements'
import MakeResume from '@/pages/MakeResume'
import History from '@/pages/History'
import MyProfile from '@/pages/MyProfile'
import ResumeTips from '@/pages/ResumeTips'
import Payments from '@/pages/Payments'
import BuyCoffee from '@/pages/BuyCoffee'
import Heading from '@/pages/Heading'
import Education from '@/pages/Education'
import Experience from '@/pages/Experience'
import Projects from '@/pages/Projects'
import Skills from '@/pages/Skills'
import Certifications from '@/pages/Certifications'
import Awards from '@/pages/Awards'
import VolunteerExperiences from '@/pages/VolunteerExperiences'
import PublicResume from '@/pages/PublicResume'
import Admin from '@/pages/Admin'
import PrivacyPolicy from '@/pages/PrivacyPolicy'
import TermsAndConditions from '@/pages/TermsAndConditions'
import CancellationsRefunds from '@/pages/CancellationsRefunds'
import ShippingPolicy from '@/pages/ShippingPolicy'
import ContactUs from '@/pages/ContactUs'

const Router = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/resume/:id" element={<PublicResume />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
      <Route path="/cancellations-refunds" element={<CancellationsRefunds />} />
      <Route path="/shipping-policy" element={<ShippingPolicy />} />
      <Route path="/contact-us" element={<ContactUs />} />

      <Route
        path="/admin"
        element={
          <AdminProtectedRoute>
            <Admin />
          </AdminProtectedRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/my-elements" element={<MyElements />} />
        <Route path="/my-elements/heading" element={<Heading />} />
        <Route path="/my-elements/education" element={<Education />} />
        <Route path="/my-elements/experience" element={<Experience />} />
        <Route path="/my-elements/projects" element={<Projects />} />
        <Route path="/my-elements/skills" element={<Skills />} />
        <Route path="/my-elements/certifications" element={<Certifications />} />
        <Route path="/my-elements/awards" element={<Awards />} />
        <Route path="/my-elements/volunteer" element={<VolunteerExperiences />} />
        <Route path="/make-resume" element={<MakeResume />} />
        <Route path="/history" element={<History />} />
        <Route path="/my-profile" element={<MyProfile />} />
        <Route path="/resume-tips" element={<ResumeTips />} />
        <Route path="/buy-coffee" element={<BuyCoffee />} />
        <Route path="/payments" element={<Payments />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default Router
