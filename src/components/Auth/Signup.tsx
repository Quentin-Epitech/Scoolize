import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from './AuthProvider'
import LyceeSelector from '../LyceeSelector'
import { supabase } from '../../lib/supabaseClient'

interface SignupProps {
    onToggleMode: () => void
}

export default function Signup({ onToggleMode }: SignupProps) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [lycee, setLycee] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const { signUp } = useAuth()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(false)

       
        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas')
            setLoading(false)
            return
        }

        if (password.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères')
            setLoading(false)
            return
        }

        const { data, error } = await signUp(email, password)

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
        
            if (data?.user && lycee) {
                try {
                    const { error: profileError } = await supabase
                        .from('user_profiles')
                        .insert({
                            id: data.user.id,
                            lycee_id: lycee.Identifiant_de_l_etablissement,
                            lycee_nom: lycee.Nom_etablissement
                        })

                    if (profileError) {
                        console.error('Erreur lors de la création du profil:', profileError)
                    }
                } catch (err) {
                    console.error('Erreur:', err)
                }
            }

            setSuccess(true)
            setLoading(false)
           
            setTimeout(() => {
                onToggleMode()
            }, 2000)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card"
            style={{ maxWidth: '500px', margin: '2rem auto' }}
        >
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    margin: '0 auto 1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'white',
                    boxShadow: 'var(--shadow-md)'
                }}>
                    INSCRIPTION
                </div>
                <h2 style={{ marginBottom: '0.5rem' }}>Inscription</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                    Créez votre compte pour commencer
                </p>
            </div>
            
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="votre@email.fr"
                        required
                    />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label htmlFor="password">Mot de passe</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                    />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
                    <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                    />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <LyceeSelector
                        onSelect={setLycee}
                        selectedLycee={lycee}
                        required={false}
                    />
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="status-error"
                        style={{
                            marginBottom: '1rem',
                            padding: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                        }}
                    >
                        <span>{error}</span>
                    </motion.div>
                )}

                {success && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="status-success"
                        style={{
                            marginBottom: '1rem',
                            padding: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                        }}
                    >
                        <span>Compte créé avec succès ! Redirection...</span>
                    </motion.div>
                )}

                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <span style={{
                                width: '16px',
                                height: '16px',
                                border: '2px solid rgba(255,255,255,0.3)',
                                borderTopColor: 'white',
                                borderRadius: '50%',
                                animation: 'spin 0.8s linear infinite',
                                display: 'inline-block'
                            }} />
                            Création...
                        </span>
                    ) : (
                        'Créer mon compte'
                    )}
                </button>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                    <button
                        type="button"
                        onClick={onToggleMode}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--primary-light)',
                            cursor: 'pointer',
                            fontSize: '0.95rem',
                            fontWeight: 500,
                            textDecoration: 'none',
                            transition: 'color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--primary-light)'}
                    >
                        Déjà un compte ? <strong>Se connecter</strong>
                    </button>
                </div>
            </form>
        </motion.div>
    )
}
