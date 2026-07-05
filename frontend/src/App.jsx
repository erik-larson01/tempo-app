import './App.css'
import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import ProjectsOverview from './pages/ProjectsOverview'
import ProjectDetail from './pages/ProjectDetail'
import NotFound from './pages/NotFound'
import { useAuth0 } from '@auth0/auth0-react'
import LandingPage from './pages/LandingPage'
import LoadingScreen from './components/common/LoadingScreen'
import Profile from './pages/Profile'

function App() {
  const { isLoading, isAuthenticated, error } = useAuth0()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (error) {
    return <LandingPage error={error.message} />
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="*" element={<LandingPage />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<ProjectsOverview />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
