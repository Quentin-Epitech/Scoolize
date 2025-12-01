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
            style={{ maxWidth: '400px', margin: '2rem auto' }}
        >
            <h2>Inscription</h2>
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

                <div>
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

                <LyceeSelector
                    onSelect={setLycee}
                    selectedLycee={lycee}
                    required={false}
                />

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

                {success && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                            marginTop: '1rem',
                            padding: '1rem',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(72, 187, 120, 0.2)',
                            color: '#48bb78'
                        }}
                    >
                         Compte créé avec succès ! Redirection...
                    </motion.div>
                )}

                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Création...' : 'Créer mon compte'}
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
                        Déjà un compte ? Se connecter
                    </button>
                </div>
            </form>
        </motion.div>
    )
}
