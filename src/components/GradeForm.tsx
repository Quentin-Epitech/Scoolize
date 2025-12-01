import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './Auth/AuthProvider'
import {
    PATHWAYS,
    YEAR_LEVELS,
    TERMS,
    COMMON_SUBJECTS,
    GENERAL_SPECIALTIES,
    TECH_SERIES,
    TECH_SPECIALTIES,
    PROFESSIONAL_FIELDS,
    PROFESSIONAL_SUBJECTS,
    type Pathway,
    type YearLevel
} from '../data/subjects'

export default function GradeForm() {
    const { user } = useAuth()

    const [pathway, setPathway] = useState<Pathway>('Générale')
    const [yearLevel, setYearLevel] = useState<YearLevel>('Seconde')
    const [term, setTerm] = useState('Trimestre 1')
    const [techSeries, setTechSeries] = useState<keyof typeof TECH_SERIES | ''>('')
    const [professionalField, setProfessionalField] = useState('')
    const [subjectType, setSubjectType] = useState<'commune' | 'specialite'>('commune')
    const [subject, setSubject] = useState('')
    const [grade, setGrade] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)
    const [savedGrades, setSavedGrades] = useState<any[]>([])
    const [loadingGrades, setLoadingGrades] = useState(true)

    useEffect(() => {
        if (!user) return
        setLoadingGrades(true)
        supabase.from('grades').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
            .then(({ data, error }) => {
                if (!error && data) setSavedGrades(data)
                setLoadingGrades(false)
            })
    }, [user])

    useEffect(() => {
        setSubject('')
        setTechSeries('')
        setProfessionalField('')
    }, [pathway])

    useEffect(() => setSubject(''), [subjectType])

    const getAvailableSubjects = () => {
        if (subjectType === 'commune') {
            return pathway === 'Professionnelle' ? PROFESSIONAL_SUBJECTS : COMMON_SUBJECTS
        }
        if (pathway === 'Générale') return GENERAL_SPECIALTIES
        if (pathway === 'Technologique' && techSeries) return TECH_SPECIALTIES[techSeries] || []
        return []
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        if (!subject || !grade) {
            setMessage({ text: 'Veuillez remplir tous les champs', type: 'error' })
            setLoading(false)
            return
        }

        try {
            const { error } = await supabase.from('grades').insert([{
                user_id: user?.id,
                student_pathway: pathway,
                year_level: yearLevel,
                term,
                subject_type: subjectType,
                subject,
                grade: parseFloat(grade),
                tech_series: techSeries || null,
                professional_field: professionalField || null
            }])

            if (error) throw error

            setMessage({ text: 'Note enregistrée avec succès ! ', type: 'success' })
            setGrade('')
            setSubject('')

            const { data } = await supabase.from('grades').select('*').eq('user_id', user?.id).order('created_at', { ascending: false })
            if (data) setSavedGrades(data)
        } catch (error: any) {
            setMessage({ text: 'Erreur: ' + error.message, type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    const deleteGrade = async (id: number) => {
        if (!confirm('Voulez-vous supprimer cette note ?')) return
        await supabase.from('grades').delete().eq('id', id)
        setSavedGrades(savedGrades.filter(g => g.id !== id))
    }

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card">
            <h2>📝 Mes Notes</h2>
            <form onSubmit={handleSubmit}>
                <div className="grid-2">
                    <div>
                        <label htmlFor="pathway">Parcours</label>
                        <select id="pathway" value={pathway} onChange={(e) => setPathway(e.target.value as Pathway)}>
                            {PATHWAYS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="yearLevel">Année</label>
                        <select id="yearLevel" value={yearLevel} onChange={(e) => setYearLevel(e.target.value as YearLevel)}>
                            {YEAR_LEVELS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>

                {pathway === 'Technologique' && (
                    <div>
                        <label htmlFor="techSeries">Série Technologique</label>
                        <select id="techSeries" value={techSeries} onChange={(e) => setTechSeries(e.target.value as keyof typeof TECH_SERIES)}>
                            <option value="">Choisir une série...</option>
                            {Object.entries(TECH_SERIES).map(([key, name]) => <option key={key} value={key}>{key} - {name}</option>)}
                        </select>
                    </div>
                )}

                {pathway === 'Professionnelle' && (
                    <div>
                        <label htmlFor="professionalField">Filière Professionnelle</label>
                        <select id="professionalField" value={professionalField} onChange={(e) => setProfessionalField(e.target.value)}>
                            <option value="">Choisir une filière...</option>
                            {PROFESSIONAL_FIELDS.map(field => <option key={field} value={field}>{field}</option>)}
                        </select>
                    </div>
                )}

                <div className="grid-2">
                    <div>
                        <label htmlFor="subjectType">Type de matière</label>
                        <select id="subjectType" value={subjectType} onChange={(e) => setSubjectType(e.target.value as 'commune' | 'specialite')}>
                            <option value="commune">Matière commune</option>
                            {pathway !== 'Professionnelle' && <option value="specialite">Spécialité</option>}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="term">Période</label>
                        <select id="term" value={term} onChange={(e) => setTerm(e.target.value)}>
                            {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid-2">
                    <div>
                        <label htmlFor="subject">{subjectType === 'commune' ? 'Matière' : 'Spécialité'}</label>
                        <select id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} disabled={pathway === 'Technologique' && subjectType === 'specialite' && !techSeries}>
                            <option value="">Choisir...</option>
                            {getAvailableSubjects().map(subj => <option key={subj} value={subj}>{subj}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="grade">Note (/20)</label>
                        <input id="grade" type="number" min="0" max="20" step="0.01" value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="Ex: 15.5" />
                    </div>
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Enregistrement...' : 'Ajouter la note'}
                </button>

                {message && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: '1rem', padding: '1rem', borderRadius: '8px', backgroundColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: message.type === 'success' ? 'var(--success-color)' : 'var(--error-color)' }}>
                        {message.text}
                    </motion.div>
                )}
            </form>

            <div style={{ marginTop: '3rem', borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
                <h3>Mes Notes Enregistrées</h3>
                {loadingGrades ? <p style={{ opacity: 0.7 }}>Chargement...</p> :
                    savedGrades.length === 0 ? <p style={{ opacity: 0.7 }}>Aucune note enregistrée.</p> :
                        <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                            {savedGrades.map((g) => (
                                <motion.div key={g.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: 'var(--card-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1rem', alignItems: 'center' }}>
                                    <div>
                                        <strong style={{ color: 'var(--primary-color)' }}>{g.subject}</strong>
                                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', opacity: 0.7 }}>
                                            {g.subject_type === 'specialite' ? 'Spécialité' : 'Commune'}
                                        </p>
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.7 }}>{g.student_pathway} • {g.year_level}</p>
                                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', opacity: 0.7 }}>{g.term}</p>
                                    </div>
                                    <div style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold', color: g.grade >= 10 ? 'var(--success-color)' : 'var(--error-color)' }}>
                                        {g.grade}/20
                                    </div>
                                    <button onClick={() => deleteGrade(g.id)} style={{ padding: '0.5rem', fontSize: '0.8rem', background: 'var(--error-color)', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>
                                        Supprimer
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                }
            </div>
        </motion.div>
    )
}
