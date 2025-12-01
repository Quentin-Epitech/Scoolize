import { useState } from 'react'
import { AuthProvider, useAuth } from './components/Auth/AuthProvider'
import Login from './components/Auth/Login'
import Signup from './components/Auth/Signup'
import GradeForm from './components/GradeForm'
import SchoolSelector from './components/SchoolSelector'
import './App.css'

function AppContent() {
  const { user, loading, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<'grades' | 'schools'>('grades')
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '5rem' }}>
        <h2>Chargement</h2></div>)}

  if (!user) {
    return (
      <div className="container">
        <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h1>Parcourstup <span style={{ fontSize: '0.5em', opacity: 0.5 }}></span></h1>
          <p style={{ fontSize: '1.2rem', color: '#a1a1aa' }}>Preparer vos voeuxs parcoursup</p>
        </header>

        {authMode === 'login' ? (
          <Login onToggleMode={() => setAuthMode('signup')} />
        ) : (
          <Signup onToggleMode={() => setAuthMode('login')} />
        )}
      </div>
    )
  }

  return (
    <div className="container">
      <header style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1>Parcourstup <span style={{ fontSize: '0.5em', opacity: 0.5 }}></span></h1>
            <p style={{ fontSize: '1rem', color: '#a1a1aa', margin: 0 }}>Bienvenue, {user.email}</p>
          </div>
          <button
            onClick={signOut}
            className="btn-secondary"
            style={{ padding: '0.6rem 1.2rem' }}
          >
             Déconnexion
          </button>
        </div>
      </header>

      <nav style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('grades')}
          style={{
            background: activeTab === 'grades' ? 'var(--primary-gradient)' : 'transparent',
            border: activeTab === 'grades' ? 'none' : '1px solid var(--glass-border)',
            color: activeTab === 'grades' ? 'white' : 'var(--text-secondary)'
          }}
        >
           Mes Notes
        </button>
        <button
          onClick={() => setActiveTab('schools')}
          style={{
            background: activeTab === 'schools' ? 'var(--primary-gradient)' : 'transparent',
            border: activeTab === 'schools' ? 'none' : '1px solid var(--glass-border)',
            color: activeTab === 'schools' ? 'white' : 'var(--text-secondary)'
          }}
        >
          Faire mes voeuxs
        </button>
      </nav>

      <main>
        {activeTab === 'grades' ? <GradeForm /> : <SchoolSelector />}
      </main>
    </div>)}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>)}

export default App
