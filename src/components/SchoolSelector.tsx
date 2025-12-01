import { useState, useEffect } from 'react'
import Papa from 'papaparse'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './Auth/AuthProvider'

interface School {
    'Identifiant de l\'établissement': string
    'Nom de l\'établissement': string
    'Commune': string
    'Département': string
    'Nom long de la formation': string
    'Lien vers la fiche formation': string
}

export default function SchoolSelector() {
    const { user } = useAuth()
    const [schools, setSchools] = useState<School[]>([])
    const [filteredSchools, setFilteredSchools] = useState<School[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState(true)
    const [selectedSchools, setSelectedSchools] = useState<School[]>([])
    const [saving, setSaving] = useState(false)
    const [savedWishes, setSavedWishes] = useState<any[]>([])
    const [loadingWishes, setLoadingWishes] = useState(true)

    useEffect(() => {
        Papa.parse('/fr-esr-cartographie_formations_parcoursup.csv', {
            download: true,
            header: true,
            delimiter: ';',
            complete: (results) => {
                const data = (results.data as School[]).filter(s => s['Nom de l\'établissement'])
                setSchools(data)
                setLoading(false)
            },
            error: () => setLoading(false)
        })
    }, [])

    useEffect(() => {
        if (!user) return
        setLoadingWishes(true)
        supabase.from('wishes').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
            .then(({ data, error }) => {
                if (!error && data) setSavedWishes(data)
                setLoadingWishes(false)
            })
    }, [user])

    useEffect(() => {
        if (searchTerm.length < 3) {
            setFilteredSchools([])
            return
        }
        const lowerTerm = searchTerm.toLowerCase()
        const filtered = schools.filter(s =>
            s['Nom de l\'établissement']?.toLowerCase().includes(lowerTerm) ||
            s['Commune']?.toLowerCase().includes(lowerTerm) ||
            s['Nom long de la formation']?.toLowerCase().includes(lowerTerm)
        ).slice(0, 20)
        setFilteredSchools(filtered)
    }, [searchTerm, schools])

    const toggleSelection = (school: School) => {
        setSelectedSchools(selectedSchools.includes(school)
            ? selectedSchools.filter(s => s !== school)
            : [...selectedSchools, school]
        )
    }

    const saveWishes = async () => {
        setSaving(true)
        try {
            const wishes = selectedSchools.map(s => ({
                user_id: user?.id,
                school_name: s['Nom de l\'établissement'],
                program_name: s['Nom long de la formation'],
                city: s['Commune']
            }))

            const { error } = await supabase.from('wishes').insert(wishes)
            if (error) throw error

            alert('Vœux enregistrés !')
            setSelectedSchools([])

            const { data } = await supabase.from('wishes').select('*').eq('user_id', user?.id).order('created_at', { ascending: false })
            if (data) setSavedWishes(data)
        } catch (error: any) {
            alert('Erreur: ' + error.message)
        } finally {
            setSaving(false)
        }
    }

    const deleteWish = async (id: number) => {
        if (!confirm('Supprimer ce vœu ?')) return
        await supabase.from('wishes').delete().eq('id', id)
        setSavedWishes(savedWishes.filter(w => w.id !== id))
    }

    return (
        <div className="glass-card">
            <h2>🏫 Choisir mes Écoles</h2>

            <div style={{ marginBottom: '2rem' }}>
                <input type="text" placeholder="Rechercher une école, une ville..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%' }} />
                {loading && <p>Chargement...</p>}
                {!loading && searchTerm.length < 3 && <p style={{ opacity: 0.7 }}>Tapez au moins 3 caractères.</p>}
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {filteredSchools.map((school, index) => (
                    <motion.div key={index} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: 'var(--card-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{school['Nom de l\'établissement']}</h3>
                            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{school['Nom long de la formation']}</p>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--primary-color)' }}>📍 {school['Commune']} ({school['Département']})</p>
                        </div>
                        <button className="btn-secondary" onClick={() => toggleSelection(school)} style={{ background: selectedSchools.includes(school) ? 'var(--success-color)' : 'transparent', borderColor: selectedSchools.includes(school) ? 'var(--success-color)' : 'var(--border-color)', color: selectedSchools.includes(school) ? 'white' : 'inherit' }}>
                            {selectedSchools.includes(school) ? 'Sélectionné' : 'Choisir'}
                        </button>
                    </motion.div>
                ))}
            </div>

            {selectedSchools.length > 0 && (
                <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                    <h3>Mes Vœux ({selectedSchools.length})</h3>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {selectedSchools.map((s, i) => (
                            <li key={i} style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{s['Nom de l\'établissement']} - {s['Nom long de la formation']}</span>
                                <button onClick={() => toggleSelection(s)} style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', background: 'var(--error-color)', border: 'none', borderRadius: '4px', color: 'white' }}>X</button>
                            </li>
                        ))}
                    </ul>
                    <button className="btn-primary" onClick={saveWishes} disabled={saving}>
                        {saving ? 'Enregistrement...' : 'Valider mes vœux'}
                    </button>
                </div>
            )}

            <div style={{ marginTop: '3rem', borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
                <h3> Mes Vœux Enregistrés</h3>
                {loadingWishes ? <p style={{ opacity: 0.7 }}>Chargement...</p> :
                    savedWishes.length === 0 ? <p style={{ opacity: 0.7 }}>Aucun vœu enregistré.</p> :
                        <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                            {savedWishes.map((wish, index) => (
                                <motion.div key={wish.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ marginBottom: '0.5rem' }}>
                                            <span style={{ background: 'var(--primary-color)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: '600' }}>Vœu {index + 1}</span>
                                        </div>
                                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: 'var(--text-primary)' }}>{wish.school_name}</h4>
                                        <p style={{ margin: '0 0 0.5rem 0', color: 'var(--primary-color)', fontSize: '0.95rem' }}>{wish.program_name}</p>
                                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>📍 {wish.city}</p>
                                    </div>
                                    <button onClick={() => deleteWish(wish.id)} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', background: 'var(--error-color)', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer', fontWeight: '500' }}>
                                        Supprimer
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                }
            </div>
        </div>
    )
}
