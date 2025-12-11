import { useState } from 'react'
import { motion } from 'framer-motion'
import { AuthProvider, useAuth } from './components/Auth/AuthProvider'
import Login from './components/Auth/Login'
import Signup from './components/Auth/Signup'
import GradeForm from './components/GradeForm'
import SchoolSelector from './components/SchoolSelector'
import SchoolDashboard from './components/School/SchoolDashboard'
import './App.css'

function AppContent() {
  const { user, loading, signOut } = useAuth()
  const isAdmin = user?.email?.includes('@admin.') || user?.email?.includes('admin@') || false
  const [activeTab, setActiveTab] = useState<'grades' | 'schools'>('grades')
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '5rem' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ display: 'inline-block' }}
        >
          <div style={{ 
            width: '60px', 
            height: '60px', 
            border: '4px solid var(--border)',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            margin: '0 auto 1.5rem',
            animation: 'spin 1s linear infinite'
          }} />
          <h2 style={{ color: 'var(--text-primary)' }}>Chargement...</h2>
        </motion.div>
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--bg-secondary)',
        padding: '2rem'
      }}>
        <div style={{ width: '100%', maxWidth: '500px' }}>
          <motion.header 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ 
              marginBottom: '3rem', 
              textAlign: 'center'
            }}
          >
            <h1 style={{ marginBottom: '0.5rem', fontSize: '2.5rem', color: 'var(--primary)' }}>ParcourStup</h1>
            <p style={{ 
              fontSize: '1.125rem', 
              color: 'var(--text-secondary)',
              fontWeight: 400
            }}>
              Préparez vos vœux Parcoursup avec intelligence
            </p>
          </motion.header>

          {authMode === 'login' ? (
            <Login onToggleMode={() => setAuthMode('signup')} />
          ) : (
            <Signup onToggleMode={() => setAuthMode('login')} />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <a href="#" className="republique-logo">
              <div className="marianne-icon">RF</div>
              <div className="republique-text">
                <strong>RÉPUBLIQUE FRANÇAISE</strong>
                <span>Liberté Égalité Fraternité</span>
              </div>
            </a>
          </div>
          <nav className="header-nav">
            <div className="user-info">
              <span className="user-email">{user.email}</span>
              {isAdmin && (
                <span style={{ 
                  padding: '0.25rem 0.5rem',
                  background: '#f0f7ff',
                  borderRadius: '4px',
                  color: '#0066cc',
                  fontSize: '0.75rem',
                  fontWeight: 500
                }}>
                  Admin
                </span>
              )}
              <button
                onClick={signOut}
                style={{ 
                  padding: '0.5rem 1rem',
                  background: 'transparent',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  color: '#212121',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                Déconnexion
              </button>
            </div>
          </nav>
        </div>
      </header>

      <div className="main-layout">
        {!isAdmin && (
          <aside className="sidebar">
            <ul className="sidebar-menu">
              <li className="sidebar-menu-item">
                <a href="#" className="sidebar-menu-link active">
                  Mes vœux
                </a>
                <ul className="sidebar-submenu">
                  <li className="sidebar-submenu-item">
                    <a 
                      href="#" 
                      className={`sidebar-submenu-link ${activeTab === 'schools' ? 'active' : ''}`}
                      onClick={(e) => {
                        e.preventDefault()
                        setActiveTab('schools')
                      }}
                    >
                      Vœux
                    </a>
                  </li>
                  <li className="sidebar-submenu-item">
                    <a 
                      href="#" 
                      className={`sidebar-submenu-link ${activeTab === 'grades' ? 'active' : ''}`}
                      onClick={(e) => {
                        e.preventDefault()
                        setActiveTab('grades')
                      }}
                    >
                      Mes Notes
                    </a>
                  </li>
                </ul>
              </li>
            </ul>
          </aside>
        )}

        <main className="main-content">
          {isAdmin ? (
            <SchoolDashboard />
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'grades' ? <GradeForm /> : <SchoolSelector />}
            </motion.div>
          )}
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>)
}

export default App
