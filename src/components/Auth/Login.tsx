import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from './AuthProvider'

interface LoginProps {
    onToggleMode: () => void
}

export default function Login({ onToggleMode }: LoginProps) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { signIn } = useAuth()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { error } = await signIn(email, password)

        if (error) {
            setError(error.message)
            setLoading(false)
        }
        
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card"
            style={{ maxWidth: '400px', margin: '2rem auto' }}
        >
            <h2>Connexion</h2>
            <form onSubmit={handleSubmit}>
                <div>
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

                <div>
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

                {error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                            marginTop: '1rem',
                            padding: '1rem',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(245, 101, 101, 0.2)',
                            color: '#f56565'
                        }}
                    >
                        {error}
                    </motion.div>
                )}

                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Connexion...' : 'Se connecter'}
                </button>

                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <button
                        type="button"
                        onClick={onToggleMode}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#667eea',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                        }}
                    >
                        Pas encore de compte ? S'inscrire
                    </button>
                </div>
            </form>
        </motion.div>
    )
}


