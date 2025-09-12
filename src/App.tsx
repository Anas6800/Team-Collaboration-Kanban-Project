import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import { useAuth } from './context/AuthContext'
import Teams from './pages/Teams'
import TeamDetail from './pages/TeamDetail'
import { TeamProvider } from './context/TeamContext'
import { BoardProvider } from './context/BoardContext'
import ChangePassword from './pages/ChangePassword'
import Boards from './pages/Boards'
import BoardDetail from './pages/BoardDetail'

function Dashboard() {
  const { logout, user } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  return (
    <div className="min-h-screen">
      {/* Hero Section - Responsive */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-24">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6">
              Welcome to <span className="gradient-text">KanbanFlow</span>
            </h1>
            <p className="text-lg sm:text-xl text-blue-100 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
              Organize your team's work with beautiful, intuitive Kanban boards. 
              Collaborate in real-time and boost productivity.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <Link to="/teams" className="btn-primary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4">
                Get Started
              </Link>
              <Link to="/boards" className="btn-secondary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4">
                View Boards
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation - Responsive */}
      <nav className="nav-glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <h2 className="text-lg sm:text-xl font-bold gradient-text">KanbanFlow</h2>
              {/* Desktop Navigation */}
              <div className="hidden md:flex space-x-6">
                <Link to="/teams" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                  Workspaces
                </Link>
                <Link to="/boards" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                  Boards
                </Link>
                <Link to="/settings/password" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                  Settings
                </Link>
              </div>
            </div>
            
            {/* Desktop User Menu */}
            <div className="hidden md:flex items-center space-x-4">
              <span className="text-sm text-gray-600 truncate max-w-64">Welcome, {user?.email}</span>
              <button 
                onClick={logout} 
                className="text-red-600 hover:text-red-700 font-medium transition-colors"
              >
                Logout
              </button>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 p-2 rounded-md"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
          
          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
                <Link 
                  to="/teams" 
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Workspaces
                </Link>
                <Link 
                  to="/boards" 
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Boards
                </Link>
                <Link 
                  to="/settings/password" 
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Settings
                </Link>
                <div className="border-t border-gray-200 pt-3">
                  <div className="px-3 py-2 text-sm text-gray-600 truncate">
                    Welcome, {user?.email}
                  </div>
                  <button 
                    onClick={() => { logout(); setMobileMenuOpen(false); }} 
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need to stay organized</h2>
            <p className="text-lg text-gray-600">Powerful features designed for modern teams</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center card-hover p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Visual Boards</h3>
              <p className="text-gray-600">Organize tasks with beautiful, drag-and-drop Kanban boards</p>
            </div>
            
            <div className="text-center card-hover p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Team Collaboration</h3>
              <p className="text-gray-600">Work together in real-time with your team members</p>
            </div>
            
            <div className="text-center card-hover p-6 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Real-time Updates</h3>
              <p className="text-gray-600">See changes instantly as your team moves tasks around</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <TeamProvider>
        <BoardProvider>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teams"
              element={
                <ProtectedRoute>
                  <Teams />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teams/:teamId"
              element={
                <ProtectedRoute>
                  <TeamDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/boards"
              element={
                <ProtectedRoute>
                  <Boards />
                </ProtectedRoute>
              }
            />
            <Route
              path="/boards/:boardId"
              element={
                <ProtectedRoute>
                  <BoardDetail />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot" element={<ForgotPassword />} />
            <Route
              path="/settings/password"
              element={
                <ProtectedRoute>
                  <ChangePassword />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BoardProvider>
      </TeamProvider>
    </BrowserRouter>
  )
}
