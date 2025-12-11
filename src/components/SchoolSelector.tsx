import { useState, useEffect, useMemo, useCallback } from 'react'
import Papa from 'papaparse'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './Auth/AuthProvider'
import type { ScoresEtudiant, Formation, Preferences } from '../lib/predict'
import { recommanderFormations } from '../lib/predict'
interface School {
    'Identifiant de l\'établissement': string
    'Nom de l\'établissement': string
    'Commune': string
    'Département': string
    'Nom long de la formation': string
    'Lien vers la fiche formation': string
}

type GradeRow = {
    id: number
    subject: string
    grade: number
}

type Rule = {
    keywords: string[]
    prerequis: Record<string, number>
    poids: Record<string, number>
}

const RULES: Rule[] = [
    {
        keywords: ['ingénieur', 'ingénierie', 'science', 'physique', 'math'],
        prerequis: { 'Mathématiques': 12, 'Physique-Chimie': 11 },
        poids: { 'Mathématiques': 0.5, 'Physique-Chimie': 0.3, 'Anglais': 0.2 }
    },
    {
        keywords: ['data', 'numérique', 'informatique', 'ia', 'algorithmie'],
        prerequis: { 'Mathématiques': 13, 'NSI': 12 },
        poids: { 'Mathématiques': 0.45, 'NSI': 0.35, 'Anglais': 0.2 }
    },
    {
        keywords: ['commerce', 'gestion', 'business', 'eco', 'marketing'],
        prerequis: { 'SES': 11, 'Anglais': 11 },
        poids: { 'SES': 0.4, 'Anglais': 0.3, 'Mathématiques': 0.3 }
    },
    {
        keywords: ['santé', 'médical', 'biologie', 'svt'],
        prerequis: { 'SVT': 13, 'Physique-Chimie': 12 },
        poids: { 'SVT': 0.5, 'Physique-Chimie': 0.3, 'Mathématiques': 0.2 }
    },
    {
        keywords: ['design', 'art', 'graphisme', 'création'],
        prerequis: { 'Arts plastiques': 11, 'Anglais': 10 },
        poids: { 'Arts plastiques': 0.5, 'Anglais': 0.3, 'Mathématiques': 0.2 }
    }
]

const DEFAULT_RULE: Rule = {
    keywords: [],
    prerequis: { 'Mathématiques': 10, 'Anglais': 10 },
    poids: { 'Mathématiques': 0.6, 'Anglais': 0.4 }
}

const aggregateScores = (grades: GradeRow[]): ScoresEtudiant => {
    const accumulator: Record<string, { sum: number, count: number }> = {}

    grades.forEach(({ subject, grade }) => {
        if (!subject) return
        if (!accumulator[subject]) {
            accumulator[subject] = { sum: 0, count: 0 }
        }
        accumulator[subject].sum += grade
        accumulator[subject].count += 1
    })

    const aggregated: ScoresEtudiant = {}
    Object.entries(accumulator).forEach(([subject, { sum, count }]) => {
        aggregated[subject] = parseFloat((sum / count).toFixed(2))
    })

    return aggregated
}

const findRuleForProgram = (programName: string): Rule => {
    const lower = programName.toLowerCase()
    return RULES.find(rule => rule.keywords.some(keyword => lower.includes(keyword))) || DEFAULT_RULE
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
const hashBias = (text: string) => ((text.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % 9) - 4) // [-4;4]

const toFormation = (school: School): Formation => {
    const rule = findRuleForProgram(school['Nom long de la formation'] || '')
    return {
        nom: school['Nom de l\'établissement'],
        prerequis: rule.prerequis,
        poids: rule.poids,
        cout: 0,
        distanceKm: 10,
        mode: 'presentiel',
        tags: rule.keywords,
        capaciteDisponible: 100
    }
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
    const [studentGrades, setStudentGrades] = useState<GradeRow[]>([])
    const [loadingGrades, setLoadingGrades] = useState(true)

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
        if (!user) return
        setLoadingGrades(true)
        supabase.from('grades')
            .select('id, subject, grade')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .then(({ data, error }) => {
                if (!error && data) setStudentGrades(data as GradeRow[])
                setLoadingGrades(false)
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

    const aggregatedScores = useMemo(() => aggregateScores(studentGrades), [studentGrades])
    const overallAvg = useMemo(() => {
        if (!studentGrades.length) return 10
        const total = studentGrades.reduce((s, g) => s + (g.grade || 0), 0)
        return parseFloat((total / studentGrades.length).toFixed(2))
    }, [studentGrades])

    const defaultPreferences = useMemo<Preferences>(() => ({
        budgetMax: 100000,
        distanceMaxKm: 1000,
        modeSouhaite: 'indifferent',
        tagsInterets: []
    }), [])

    const computeCompatibility = useCallback((school: School) => {
        if (!studentGrades.length) return null
        const formation = toFormation(school)
        const scoresComplets: ScoresEtudiant = { ...aggregatedScores }
        Object.keys(formation.prerequis).forEach((m) => {
            if (scoresComplets[m] === undefined) scoresComplets[m] = overallAvg
        })
        Object.keys(formation.poids).forEach((m) => {
            if (scoresComplets[m] === undefined) scoresComplets[m] = overallAvg
        })
        const [reco] = recommanderFormations(scoresComplets, defaultPreferences, [formation])
        if (!reco) return null
        const biais = hashBias(formation.nom)
        return Math.round(clamp(reco.score + biais, 0, 100))
    }, [aggregatedScores, defaultPreferences, overallAvg, studentGrades.length])

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
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <p style={{ 
                    fontSize: '0.9375rem', 
                    color: 'var(--text-secondary)', 
                    margin: '0 0 1.5rem 0',
                    lineHeight: '1.6'
                }}>
                    Recherchez et sélectionnez les formations pour lesquelles vous souhaitez formuler un vœu. Vous pouvez formuler jusqu'à 10 vœux.
                </p>
            </div>

            <div style={{ 
                marginBottom: '2rem', 
                padding: '1.25rem', 
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)'
            }}>
                {loadingGrades ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                        <div style={{
                            width: '20px',
                            height: '20px',
                            border: '2px solid var(--border)',
                            borderTopColor: 'var(--primary)',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite'
                        }} />
                        <span>Analyse de vos notes...</span>
                    </div>
                ) : studentGrades.length === 0 ? (
                    <div style={{ color: 'var(--text-secondary)' }}>
                        Ajoutez vos notes dans l'onglet « Mes Notes » pour estimer la compatibilité avec chaque école.
                    </div>
                ) : (
                    <div style={{ color: 'var(--text-secondary)' }}>
                        Compatibilité calculée sur <strong style={{ color: 'var(--primary)' }}>{studentGrades.length}</strong> note{studentGrades.length > 1 ? 's' : ''} enregistrée{studentGrades.length > 1 ? 's' : ''}.
                    </div>
                )}
            </div>

            <div style={{ marginBottom: '2rem', position: 'relative' }}>
                <input 
                    type="text" 
                    placeholder="Rechercher une école, une ville, une formation..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    style={{ 
                        width: '100%',
                        paddingLeft: '3rem',
                        fontSize: '1rem'
                    }} 
                />
                <div style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '1.25rem',
                    opacity: 0.5
                }}>
                </div>
                {loading && (
                    <p style={{ marginTop: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                            width: '16px',
                            height: '16px',
                            border: '2px solid var(--border)',
                            borderTopColor: 'var(--primary)',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite'
                        }} />
                        Chargement...
                    </p>
                )}
                {!loading && searchTerm.length > 0 && searchTerm.length < 3 && (
                    <p style={{ marginTop: '0.75rem', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                        Tapez au moins 3 caractères pour rechercher
                    </p>
                )}
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {filteredSchools.map((school, index) => {
                    const compatibility = computeCompatibility(school)
                    const isSelected = selectedSchools.includes(school)
                    return (
                        <motion.div 
                            key={index} 
                            initial={{ opacity: 0, y: 10 }} 
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            style={{ 
                                background: isSelected ? 'rgba(46, 125, 50, 0.08)' : 'var(--bg-primary)', 
                                padding: '1.5rem', 
                                borderRadius: 'var(--radius-lg)', 
                                border: `1.5px solid ${isSelected ? 'var(--success)' : 'var(--border)'}`, 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                gap: '1.5rem',
                                transition: 'all 0.15s ease',
                                position: 'relative'
                            }}
                            onMouseEnter={(e) => {
                                if (!isSelected) {
                                    e.currentTarget.style.background = 'var(--bg-secondary)'
                                    e.currentTarget.style.borderColor = 'var(--primary)'
                                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isSelected) {
                                    e.currentTarget.style.background = 'var(--bg-primary)'
                                    e.currentTarget.style.borderColor = 'var(--border)'
                                    e.currentTarget.style.transform = 'translateY(0)'
                                    e.currentTarget.style.boxShadow = 'none'
                                }
                            }}
                        >
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                                    {school['Nom de l\'établissement']}
                                </h3>
                                <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                                    {school['Nom long de la formation']}
                                </p>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    {school['Commune']} ({school['Département']})
                                </p>
                            </div>
                            <div style={{ 
                                textAlign: 'center', 
                                marginRight: '1rem',
                                minWidth: '100px'
                            }}>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Compatibilité
                                </p>
                                <p style={{ 
                                    margin: '0.5rem 0 0 0', 
                                    fontSize: '1.75rem', 
                                    fontWeight: '700', 
                                    color: compatibility !== null && compatibility >= 70 ? 'var(--success-light)' : 
                                           compatibility !== null && compatibility >= 50 ? 'var(--primary-light)' : 
                                           compatibility !== null ? 'var(--warning)' : 'var(--text-tertiary)'
                                }}>
                                    {compatibility !== null ? `${compatibility}%` : '—'}
                                </p>
                            </div>
                            <button 
                                className="btn-secondary" 
                                onClick={() => toggleSelection(school)} 
                                style={{ 
                                    background: isSelected ? 'var(--success)' : 'transparent', 
                                    borderColor: isSelected ? 'var(--success)' : 'var(--border)', 
                                    color: isSelected ? 'white' : 'var(--text-secondary)',
                                    whiteSpace: 'nowrap',
                                    padding: '0.75rem 1.5rem',
                                    fontWeight: 600
                                }}
                            >
                                {isSelected ? '✓ Sélectionné' : 'Choisir'}
                            </button>
                        </motion.div>
                    )
                })}
            </div>

            {selectedSchools.length > 0 && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ 
                        marginTop: '2.5rem', 
                        borderTop: '1px solid var(--border)', 
                        paddingTop: '2rem' 
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <h3 style={{ margin: 0 }}>Mes Vœux</h3>
                        <span className="badge" style={{ fontSize: '0.875rem' }}>
                            {selectedSchools.length} sélectionné{selectedSchools.length > 1 ? 's' : ''}
                        </span>
                    </div>
                    <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        {selectedSchools.map((s, i) => (
                            <div 
                                key={i} 
                                style={{ 
                                    padding: '1rem 1.25rem', 
                                    background: 'var(--bg-secondary)',
                                    borderRadius: 'var(--radius-lg)',
                                    border: '1px solid var(--border)',
                                    display: 'flex', 
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: '1rem'
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <strong style={{ color: 'var(--primary-light)' }}>{s['Nom de l\'établissement']}</strong>
                                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                        {s['Nom long de la formation']}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => toggleSelection(s)} 
                                    style={{ 
                                        padding: '0.5rem 0.75rem', 
                                        fontSize: '0.875rem', 
                                        background: 'rgba(239, 68, 68, 0.2)', 
                                        border: '1px solid rgba(239, 68, 68, 0.3)', 
                                        borderRadius: 'var(--radius-lg)', 
                                        color: 'var(--error-light)',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'var(--error)'
                                        e.currentTarget.style.borderColor = 'var(--error)'
                                        e.currentTarget.style.color = 'white'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'
                                        e.currentTarget.style.color = 'var(--error-light)'
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                    <button className="btn-primary" onClick={saveWishes} disabled={saving}>
                        {saving ? (
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
                                Enregistrement...
                            </span>
                        ) : (
                            '✓ Valider mes vœux'
                        )}
                    </button>
                </motion.div>
            )}

            <div style={{ marginTop: '3rem', borderTop: '1px solid var(--border)', paddingTop: '2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h3 style={{ margin: 0 }}>Mes Vœux Enregistrés</h3>
                    {savedWishes.length > 0 && (
                        <span className="badge" style={{ fontSize: '0.875rem' }}>
                            {savedWishes.length} vœu{savedWishes.length > 1 ? 'x' : ''}
                        </span>
                    )}
                </div>
                {loadingWishes ? (
                    <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.7 }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            border: '3px solid var(--border)',
                            borderTopColor: 'var(--primary)',
                            borderRadius: '50%',
                            margin: '0 auto 1rem',
                            animation: 'spin 1s linear infinite'
                        }} />
                        <p>Chargement...</p>
                    </div>
                ) : savedWishes.length === 0 ? (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '3rem',
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px dashed var(--border)'
                    }}>
                        <p style={{ color: 'var(--text-secondary)' }}>Aucun vœu enregistré.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                        {savedWishes.map((wish, index) => {
                            const compatibility = computeCompatibility({
                                'Identifiant de l\'établissement': '',
                                'Nom de l\'établissement': wish.school_name,
                                'Commune': wish.city,
                                'Département': '',
                                'Nom long de la formation': wish.program_name,
                                'Lien vers la fiche formation': ''
                            })
                            return (
                                <motion.div 
                                    key={wish.id} 
                                    initial={{ opacity: 0, y: 10 }} 
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{ 
                                        background: 'var(--bg-primary)', 
                                        padding: '1.5rem', 
                                        borderRadius: 'var(--radius-lg)', 
                                        border: '1px solid var(--border)', 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'flex-start', 
                                        gap: '1.5rem', 
                                        flexWrap: 'wrap',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'var(--bg-secondary)'
                                        e.currentTarget.style.borderColor = 'var(--primary)'
                                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'var(--bg-primary)'
                                        e.currentTarget.style.borderColor = 'var(--border)'
                                        e.currentTarget.style.transform = 'translateY(0)'
                                        e.currentTarget.style.boxShadow = 'none'
                                    }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <span className="badge" style={{ 
                                                background: 'var(--primary)',
                                                color: 'white',
                                                border: 'none'
                                            }}>
                                                Vœu {index + 1}
                                            </span>
                                        </div>
                                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                                            {wish.school_name}
                                        </h4>
                                        <p style={{ margin: '0 0 0.5rem 0', color: 'var(--primary-light)', fontSize: '0.95rem', fontWeight: 500 }}>
                                            {wish.program_name}
                                        </p>
                                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                            {wish.city}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'center', minWidth: '120px' }}>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Compatibilité
                                        </p>
                                        <p style={{ 
                                            margin: '0.5rem 0 0 0', 
                                            fontSize: '1.75rem', 
                                            fontWeight: 700, 
                                            color: compatibility !== null && compatibility >= 70 ? 'var(--success-light)' : 
                                                   compatibility !== null && compatibility >= 50 ? 'var(--primary-light)' : 
                                                   compatibility !== null ? 'var(--warning)' : 'var(--text-tertiary)'
                                        }}>
                                            {compatibility !== null ? `${compatibility}%` : '—'}
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => deleteWish(wish.id)} 
                                        style={{ 
                                            padding: '0.625rem 1rem', 
                                            fontSize: '0.875rem', 
                                            background: 'rgba(239, 68, 68, 0.2)', 
                                            border: '1px solid rgba(239, 68, 68, 0.3)', 
                                            borderRadius: 'var(--radius-lg)', 
                                            color: 'var(--error-light)', 
                                            cursor: 'pointer', 
                                            fontWeight: '600',
                                            transition: 'all 0.2s ease',
                                            whiteSpace: 'nowrap'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'var(--error)'
                                            e.currentTarget.style.borderColor = 'var(--error)'
                                            e.currentTarget.style.color = 'white'
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'
                                            e.currentTarget.style.color = 'var(--error-light)'
                                        }}
                                    >
                                        Supprimer
                                    </button>
                                </motion.div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
