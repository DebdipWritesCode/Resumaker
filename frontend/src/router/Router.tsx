import Login from '@/pages/Auth/Login'
import Signup from '@/pages/Auth/Signup'
import VerifyEmail from '@/pages/Auth/VerifyEmail'
import NotFound from '@/pages/NotFound'
import { Route, Routes } from 'react-router-dom'

import DashboardLayout from '@/layouts/DashboardLayout'
import ProtectedRoute from './ProtectedRoute'
import Landing from '@/pages/Landing'
import Dashboard from '@/pages/Dashboard'
import MyElements from '@/pages/MyElements'
import MakeResume from '@/pages/MakeResume'
import History from '@/pages/History'
import MyProfile from '@/pages/MyProfile'
import ResumeTips from '@/pages/ResumeTips'
import Heading from '@/pages/Heading'
import Education from '@/pages/Education'
import Experience from '@/pages/Experience'
import Projects from '@/pages/Projects'
import Skills from '@/pages/Skills'

const Router = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify" element={<VerifyEmail />} />

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
        <Route path="/make-resume" element={<MakeResume />} />
        <Route path="/history" element={<History />} />
        <Route path="/my-profile" element={<MyProfile />} />
        <Route path="/resume-tips" element={<ResumeTips />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default Router
