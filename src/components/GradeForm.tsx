import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Papa from 'papaparse'
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
    const [classAverage, setClassAverage] = useState('')
    const [lowestGrade, setLowestGrade] = useState('')
    const [highestGrade, setHighestGrade] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)
    const [importing, setImporting] = useState(false)
    const [importMessage, setImportMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)
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
                class_average: classAverage ? parseFloat(classAverage) : null,
                lowest_grade: lowestGrade ? parseFloat(lowestGrade) : null,
                highest_grade: highestGrade ? parseFloat(highestGrade) : null,
                tech_series: techSeries || null,
                professional_field: professionalField || null
            }])

            if (error) throw error

            setMessage({ text: 'Note enregistrée avec succès ! ', type: 'success' })
            setGrade('')
            setSubject('')
            setClassAverage('')
            setLowestGrade('')
            setHighestGrade('')

            const { data } = await supabase.from('grades').select('*').eq('user_id', user?.id).order('created_at', { ascending: false })
            if (data) setSavedGrades(data)
        } catch (error: any) {
            setMessage({ text: 'Erreur: ' + error.message, type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    const handleImport = (file: File) => {
        setImporting(true)
        setImportMessage(null)

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim().toLowerCase(),
            complete: async (results) => {
                try {
                    const rows = (results.data as Record<string, any>[]).map(row =>
                        Object.fromEntries(
                            Object.entries(row).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
                        )
                    )

                    const parseNumber = (value: any) => {
                        if (value === null || value === undefined || value === '') return null
                        const num = parseFloat(String(value).replace(',', '.'))
                        return Number.isFinite(num) ? num : null
                    }

                    const normalized = rows
                        .map((row) => {
                            const subjectValue = row.subject
                            const gradeValue = parseNumber(row.grade)

                            if (!subjectValue || gradeValue === null) return null

                            const selectedPathway = (row.student_pathway || row.pathway || pathway) as Pathway
                            const selectedYear = (row.year_level || yearLevel) as YearLevel

                            return {
                                user_id: user?.id,
                                student_pathway: selectedPathway,
                                year_level: selectedYear,
                                term: row.term || term,
                                subject_type: row.subject_type === 'specialite' ? 'specialite' : 'commune',
                                subject: subjectValue,
                                grade: gradeValue,
                                class_average: parseNumber(row.class_average),
                                lowest_grade: parseNumber(row.lowest_grade),
                                highest_grade: parseNumber(row.highest_grade),
                                tech_series: row.tech_series || null,
                                professional_field: row.professional_field || null
                            }
                        })
                        .filter(Boolean) as any[]

                    if (normalized.length === 0) {
                        setImportMessage({ text: 'Aucune ligne valide trouvée (vérifiez sujet et note).', type: 'error' })
                        setImporting(false)
                        return
                    }

                    const { error } = await supabase.from('grades').insert(normalized)
                    if (error) throw error

                    const { data } = await supabase.from('grades').select('*').eq('user_id', user?.id).order('created_at', { ascending: false })
                    if (data) setSavedGrades(data)

                    setImportMessage({ text: `${normalized.length} notes importées.`, type: 'success' })
                } catch (err: any) {
                    setImportMessage({ text: `Erreur lors de l'import : ${err.message}`, type: 'error' })
                } finally {
                    setImporting(false)
                }
            },
            error: (err) => {
                setImporting(false)
                setImportMessage({ text: `Erreur de lecture du fichier : ${err.message}`, type: 'error' })
            }
        })
    }

    const deleteGrade = async (id: number) => {
        if (!confirm('Voulez-vous supprimer cette note ?')) return
        await supabase.from('grades').delete().eq('id', id)
        setSavedGrades(savedGrades.filter(g => g.id !== id))
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
                    Vous devez importer vos notes pour permettre au système de calculer vos chances d'admission dans les formations souhaitées.
                </p>
            </div>

            <div style={{ 
                marginBottom: '2.5rem', 
                padding: '1.5rem', 
                border: '1.5px dashed var(--border)', 
                borderRadius: 'var(--radius-md)', 
                background: 'var(--bg-secondary)',
                backdropFilter: 'blur(10px)'
            }}>
                <div style={{ marginBottom: '0.75rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Importer un bulletin (.csv)</h3>
                </div>
                <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                    Utilisez le modèle pour remplir vos notes puis importez le fichier.
                </p>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])}
                        disabled={importing}
                        style={{ 
                            padding: '0.75rem',
                            cursor: importing ? 'not-allowed' : 'pointer'
                        }}
                    />
                </div>
                {importMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={importMessage.type === 'success' ? 'status-success' : 'status-error'}
                        style={{
                            marginTop: '1rem',
                            padding: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                        }}
                    >
                        <span>{importMessage.text}</span>
                    </motion.div>
                )}
            </div>

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

                <div className="grid-3">
                    <div>
                        <label htmlFor="classAverage">Moyenne de la classe (/20)</label>
                        <input id="classAverage" type="number" min="0" max="20" step="0.01" value={classAverage} onChange={(e) => setClassAverage(e.target.value)} placeholder="Ex: 12.5" />
                    </div>
                    <div>
                        <label htmlFor="lowestGrade">Note la plus basse (/20)</label>
                        <input id="lowestGrade" type="number" min="0" max="20" step="0.01" value={lowestGrade} onChange={(e) => setLowestGrade(e.target.value)} placeholder="Ex: 8.0" />
                    </div>
                    <div>
                        <label htmlFor="highestGrade">Note la plus haute (/20)</label>
                        <input id="highestGrade" type="number" min="0" max="20" step="0.01" value={highestGrade} onChange={(e) => setHighestGrade(e.target.value)} placeholder="Ex: 18.5" />
                    </div>
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Enregistrement...' : 'Ajouter la note'}
                </button>

                {message && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }} 
                        animate={{ opacity: 1, scale: 1 }}
                        className={message.type === 'success' ? 'status-success' : 'status-error'}
                        style={{ 
                            marginTop: '1rem', 
                            padding: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                        }}
                    >
                        <span>{message.text}</span>
                    </motion.div>
                )}
            </form>

            <div style={{ marginTop: '3rem', borderTop: '1px solid var(--border)', paddingTop: '2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h3 style={{ margin: 0 }}>Mes Notes Enregistrées</h3>
                    {savedGrades.length > 0 && (
                        <span className="badge" style={{ fontSize: '0.875rem' }}>
                            {savedGrades.length} note{savedGrades.length > 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                {loadingGrades ? (
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
                ) : savedGrades.length === 0 ? (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '3rem',
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px dashed var(--border)'
                    }}>
                        <p style={{ color: 'var(--text-secondary)' }}>Aucune note enregistrée.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                        {savedGrades.map((g) => (
                            <motion.div 
                                key={g.id} 
                                initial={{ opacity: 0, y: 10 }} 
                                animate={{ opacity: 1, y: 0 }}
                                style={{ 
                                    background: 'var(--bg-primary)', 
                                    padding: '1.5rem', 
                                    borderRadius: 'var(--radius-lg)', 
                                    border: '1px solid var(--border)',
                                    display: 'grid', 
                                    gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1fr auto', 
                                    gap: '1.5rem', 
                                    alignItems: 'center',
                                    transition: 'all 0.3s ease',
                                    position: 'relative'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'var(--bg-secondary)'
                                    e.currentTarget.style.borderColor = 'var(--primary)'
                                    e.currentTarget.style.transform = 'translateY(-2px)'
                                    e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'var(--bg-primary)'
                                    e.currentTarget.style.borderColor = 'var(--border)'
                                    e.currentTarget.style.transform = 'translateY(0)'
                                    e.currentTarget.style.boxShadow = 'none'
                                }}
                            >
                                <div>
                                    <strong style={{ color: 'var(--primary-light)', fontSize: '1.1rem' }}>{g.subject}</strong>
                                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                                        {g.subject_type === 'specialite' ? '⭐ Spécialité' : '📚 Commune'}
                                    </p>
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{g.student_pathway} • {g.year_level}</p>
                                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>{g.term}</p>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ma note</p>
                                    <p style={{ 
                                        margin: '0.5rem 0 0 0', 
                                        fontSize: '1.5rem', 
                                        fontWeight: '700', 
                                        color: g.grade >= 10 ? 'var(--success-light)' : 'var(--error-light)'
                                    }}>
                                        {g.grade}/20
                                    </p>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Moyenne classe</p>
                                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                                        {g.class_average !== null && g.class_average !== undefined ? `${g.class_average}/20` : '—'}
                                    </p>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Note min</p>
                                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                                        {g.lowest_grade !== null && g.lowest_grade !== undefined ? `${g.lowest_grade}/20` : '—'}
                                    </p>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Note max</p>
                                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                                        {g.highest_grade !== null && g.highest_grade !== undefined ? `${g.highest_grade}/20` : '—'}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => deleteGrade(g.id)} 
                                    style={{ 
                                        padding: '0.625rem 1rem', 
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
                                    Supprimer
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
