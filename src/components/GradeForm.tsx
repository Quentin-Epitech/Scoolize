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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card">
            <h2>📝 Mes Notes</h2>

            <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px dashed var(--border-color)', borderRadius: '8px', background: 'rgba(102, 126, 234, 0.05)' }}>
                <h3 style={{ marginTop: 0 }}>Importer un bulletin (.csv)</h3>
                <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>
                    Utilisez le modèle pour remplir vos notes puis importez le fichier.
                </p>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])}
                        disabled={importing}
                    />
                   
                </div>
                {importMessage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                            marginTop: '0.75rem',
                            padding: '0.75rem',
                            borderRadius: '6px',
                            backgroundColor: importMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: importMessage.type === 'success' ? 'var(--success-color)' : 'var(--error-color)'
                        }}
                    >
                        {importMessage.text}
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
                                <motion.div key={g.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: 'var(--card-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1fr auto', gap: '1rem', alignItems: 'center' }}>
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
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.7 }}>Ma note</p>
                                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.2rem', fontWeight: 'bold', color: g.grade >= 10 ? 'var(--success-color)' : 'var(--error-color)' }}>
                                            {g.grade}/20
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.7 }}>Moyenne classe</p>
                                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                            {g.class_average !== null && g.class_average !== undefined ? `${g.class_average}/20` : '-'}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.7 }}>Note min</p>
                                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                            {g.lowest_grade !== null && g.lowest_grade !== undefined ? `${g.lowest_grade}/20` : '-'}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.7 }}>Note max</p>
                                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                            {g.highest_grade !== null && g.highest_grade !== undefined ? `${g.highest_grade}/20` : '-'}
                                        </p>
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
