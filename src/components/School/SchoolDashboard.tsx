import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../Auth/AuthProvider'
import './SchoolDashboard.css'

interface Wish {
    id: number
    user_id: string
    school_name: string
    program_name: string
    city: string
    status?: 'pending' | 'accepted' | 'rejected'
    created_at: string
}

interface Student {
    user_id: string
    email: string
    name: string
    wishes: Wish[]
    grades: any[]
}

export default function SchoolDashboard() {
    const { user } = useAuth()
    const [students, setStudents] = useState<Student[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all')

    useEffect(() => {
        if (!user) return
        loadAllData()
    }, [user])

    useEffect(() => {
        if (selectedStudent && students.length > 0) {
            const updatedStudent = students.find(s => s.user_id === selectedStudent.user_id)
            if (updatedStudent) {
                const hasChanged = JSON.stringify(updatedStudent.wishes) !== JSON.stringify(selectedStudent.wishes)
                if (hasChanged) {
                    setSelectedStudent(updatedStudent)
                }
            }
        }
    }, [students])

    const loadAllData = async () => {
        setLoading(true)
        try {
            const { data: wishesData, error: wishesError } = await supabase
                .from('wishes')
                .select('*')
                .order('created_at', { ascending: false })

            if (wishesError) {
                console.error('Erreur lors de la récupération des vœux:', wishesError)
                if (wishesError.message.includes('permission') || wishesError.message.includes('policy')) {
                    alert('Erreur de permissions: Les politiques RLS (Row Level Security) ne sont pas correctement configurées.\n\nVeuillez exécuter le script SQL dans rls-policies.sql dans Supabase pour configurer les permissions admin.')
                }
                throw wishesError
            }

            const uniqueUserIds = [...new Set((wishesData || []).map(w => w.user_id))]

            const studentsData = await Promise.all(
                uniqueUserIds.map(async (userId) => {
                    const { data: gradesData } = await supabase
                        .from('grades')
                        .select('*')
                        .eq('user_id', userId)
                        .order('created_at', { ascending: false })

                    let studentEmail = `Étudiant ${userId.substring(0, 8)}...`
                    let studentName = studentEmail
                    
                    try {
                        const { data: profileData } = await supabase
                            .from('user_profiles')
                            .select('email, full_name')
                            .eq('id', userId)
                            .single()
                        
                        if (profileData) {
                            if (profileData.email) studentEmail = profileData.email
                            if (profileData.full_name) studentName = profileData.full_name
                        }
                    } catch (e) {
                    }

                    if (studentName === studentEmail && studentEmail.includes('Étudiant')) {
                        const emailParts = studentEmail.split('@')
                        if (emailParts[0]) {
                            studentName = emailParts[0].replace(/[._]/g, ' ').replace(/\d+/g, '').trim() || studentEmail
                        }
                    }

                    const studentWishes = (wishesData || []).filter(w => w.user_id === userId)

                    return {
                        user_id: userId,
                        email: studentEmail,
                        name: studentName,
                        wishes: studentWishes,
                        grades: gradesData || []
                    }
                })
            )

            setStudents(studentsData)
            
            if (studentsData.length === 0) {
                console.log('Aucun étudiant avec des vœux trouvé')
            } else {
                console.log(`${studentsData.length} étudiant(s) trouvé(s) avec des vœux`)
            }
        } catch (error: any) {
            console.error('Erreur lors du chargement des données:', error)
            let errorMessage = 'Erreur: ' + error.message
            
            if (error.message.includes('permission') || error.message.includes('policy') || error.message.includes('RLS')) {
                errorMessage = 'Erreur de permissions: Les politiques RLS (Row Level Security) ne sont pas correctement configurées.\n\n' +
                              'Veuillez exécuter le script SQL dans rls-policies.sql dans Supabase pour configurer les permissions admin.\n\n' +
                              'Voir RLS_SETUP.md pour les instructions détaillées.'
            }
            
            alert(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const updateWishStatus = async (wishId: number, status: 'pending' | 'accepted' | 'rejected') => {
        try {
            const { error } = await supabase
                .from('wishes')
                .update({ status })
                .eq('id', wishId)

            if (error) {
                console.error('Erreur lors de la mise à jour du statut:', error)
                if (error.message.includes('column') && error.message.includes('status')) {
                    alert('Erreur: La colonne "status" n\'existe pas encore dans la base de données.\n\nVeuillez exécuter la migration SQL dans migration.sql')
                } else if (error.message.includes('permission') || error.message.includes('policy')) {
                    alert('Erreur de permissions: Vous n\'avez pas les droits pour modifier ce vœu.\n\nVeuillez exécuter le script SQL dans rls-policies.sql dans Supabase pour configurer les permissions admin.')
                } else {
                    alert('Erreur lors de la mise à jour: ' + error.message)
                }
                return
            }

            await loadAllData()
        } catch (error: any) {
            console.error('Erreur:', error)
            alert('Erreur: ' + error.message)
        }
    }

    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            const matchesSearch = searchTerm === '' || 
                student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.email.toLowerCase().includes(searchTerm.toLowerCase())
            
            if (!matchesSearch) return false

            if (statusFilter !== 'all') {
                const hasMatchingWish = student.wishes.some(wish => {
                    const wishStatus = wish.status || 'pending'
                    return wishStatus === statusFilter
                })
                return hasMatchingWish
            }

            return true
        })
    }, [students, searchTerm, statusFilter])

    const stats = useMemo(() => {
        const allWishes = students.flatMap(s => s.wishes)
        return {
            totalStudents: students.length,
            totalWishes: allWishes.length,
            pending: allWishes.filter(w => !w.status || w.status === 'pending').length,
            accepted: allWishes.filter(w => w.status === 'accepted').length,
            rejected: allWishes.filter(w => w.status === 'rejected').length
        }
    }, [students])

    return (
        <div className="school-dashboard">
            <h1>Administration</h1>
            <p style={{ 
                fontSize: '0.9375rem', 
                color: 'var(--text-secondary)', 
                margin: '0 0 2rem 0'
            }}>
                Gestion des candidatures - Vue globale
            </p>

            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="stat-card"
                >
                    <div className="stat-icon" style={{ background: 'var(--primary)', color: 'white' }}>
                        ET
                    </div>
                    <div className="stat-value">{stats.totalStudents}</div>
                    <div className="stat-label">Étudiants</div>
                </motion.div>
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="stat-card"
                >
                    <div className="stat-icon" style={{ background: 'var(--primary)', color: 'white' }}>
                        VO
                    </div>
                    <div className="stat-value">{stats.totalWishes}</div>
                    <div className="stat-label">Total des vœux</div>
                </motion.div>
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="stat-card"
                >
                    <div className="stat-icon" style={{ background: 'var(--warning)', color: 'white' }}>
                        AT
                    </div>
                    <div className="stat-value">{stats.pending}</div>
                    <div className="stat-label">En attente</div>
                </motion.div>
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="stat-card"
                >
                    <div className="stat-icon" style={{ background: 'var(--success)', color: 'white' }}>
                        AC
                    </div>
                    <div className="stat-value">{stats.accepted}</div>
                    <div className="stat-label">Acceptés</div>
                </motion.div>
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="stat-card"
                >
                    <div className="stat-icon" style={{ background: 'var(--error)', color: 'white' }}>
                        RE
                    </div>
                    <div className="stat-value">{stats.rejected}</div>
                    <div className="stat-label">Refusés</div>
                </motion.div>
            </div>

            <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ 
                    display: 'flex', 
                    gap: '1rem', 
                    flexWrap: 'wrap',
                    alignItems: 'center'
                }}>
                    <div style={{ flex: 1, minWidth: '300px' }}>
                        <input 
                            type="text" 
                            placeholder="Rechercher un étudiant par nom ou email..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            style={{ 
                                width: '100%',
                                padding: '0.875rem 1.25rem',
                                fontSize: '1rem'
                            }} 
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {(['all', 'pending', 'accepted', 'rejected'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setStatusFilter(f)}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: statusFilter === f ? 'var(--primary-gradient)' : 'transparent',
                                    border: statusFilter === f ? 'none' : '1.5px solid var(--border)',
                                    color: statusFilter === f ? 'white' : 'var(--text-secondary)',
                                    fontWeight: 600,
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                {f === 'all' ? 'Tous' : 
                                 f === 'pending' ? 'En attente' :
                                 f === 'accepted' ? 'Acceptés' : 'Refusés'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem' }}>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        border: '4px solid var(--border)',
                        borderTopColor: 'var(--primary)',
                        borderRadius: '50%',
                        margin: '0 auto 1.5rem',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <p style={{ color: 'var(--text-secondary)' }}>Chargement des données...</p>
                </div>
            ) : filteredStudents.length === 0 ? (
                <div className="glass-card" style={{ 
                    textAlign: 'center', 
                    padding: '4rem',
                    background: 'var(--bg-primary)',
                }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                        {searchTerm ? 'Aucun étudiant trouvé.' : 'Aucun étudiant avec des vœux.'}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {filteredStudents.map((student, index) => {
                        const pendingCount = student.wishes.filter(w => !w.status || w.status === 'pending').length
                        const acceptedCount = student.wishes.filter(w => w.status === 'accepted').length
                        const rejectedCount = student.wishes.filter(w => w.status === 'rejected').length
                        
                        return (
                            <motion.div 
                                key={student.user_id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                        className="glass-card student-card"
                        onClick={() => setSelectedStudent(student)}
                        style={{ cursor: 'pointer', borderRadius: 'var(--radius-md)' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem', flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1, minWidth: '300px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                                            <div style={{
                                                width: '50px',
                                                height: '50px',
                                                borderRadius: '50%',
                                                background: 'var(--primary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '1rem',
                                                fontWeight: 600,
                                                color: 'white'
                                            }}>
                                                {student.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                                                    {student.name}
                                                </h3>
                                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                                    {student.email}
                                                </p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                                            <div                                                 style={{ 
                                                    padding: '0.5rem 1rem', 
                                                    background: 'var(--bg-secondary)', 
                                                    borderRadius: 'var(--radius-md)',
                                                    border: '1px solid var(--border)'
                                                }}>
                                                <span style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>Total: </span>
                                                <strong style={{ color: 'var(--text-primary)' }}>{student.wishes.length} vœu{student.wishes.length > 1 ? 'x' : ''}</strong>
                                            </div>
                                            {pendingCount > 0 && (
                                                <div style={{ 
                                                    padding: '0.5rem 1rem', 
                                                    background: 'var(--bg-secondary)', 
                                                    borderRadius: 'var(--radius-md)',
                                                    border: '1px solid var(--warning)'
                                                }}>
                                                    <span style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>En attente: </span>
                                                    <strong style={{ color: 'var(--warning)' }}>{pendingCount}</strong>
                                                </div>
                                            )}
                                            {acceptedCount > 0 && (
                                                <div style={{ 
                                                    padding: '0.5rem 1rem', 
                                                    background: 'var(--bg-secondary)', 
                                                    borderRadius: 'var(--radius-md)',
                                                    border: '1px solid var(--success)'
                                                }}>
                                                    <span style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>Acceptés: </span>
                                                    <strong style={{ color: 'var(--success)' }}>{acceptedCount}</strong>
                                                </div>
                                            )}
                                            {rejectedCount > 0 && (
                                                <div style={{ 
                                                    padding: '0.5rem 1rem', 
                                                    background: 'var(--bg-secondary)', 
                                                    borderRadius: 'var(--radius-md)',
                                                    border: '1px solid var(--error)'
                                                }}>
                                                    <span style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>Refusés: </span>
                                                    <strong style={{ color: 'var(--error)' }}>{rejectedCount}</strong>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setSelectedStudent(student)
                                        }}
                                        className="btn-primary"
                                        style={{ whiteSpace: 'nowrap' }}
                                    >
                                        Voir les vœux
                                    </button>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            )}

            {selectedStudent && (
                <div 
                    className="modal-overlay"
                    onClick={() => setSelectedStudent(null)}
                >
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="modal-content"
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <div>
                                <h2 style={{ margin: 0, marginBottom: '0.5rem' }}>{selectedStudent.name}</h2>
                                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{selectedStudent.email}</p>
                            </div>
                            <button
                                onClick={() => setSelectedStudent(null)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    color: 'var(--text-secondary)',
                                    padding: '0.5rem'
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {selectedStudent.grades.length > 0 && (
                            <div style={{ marginBottom: '2rem' }}>
                                <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Notes de l'étudiant</h3>
                                <div style={{ 
                                    maxHeight: '200px', 
                                    overflowY: 'auto',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: 'var(--radius-sm)',
                                    padding: '1rem',
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                                    gap: '0.75rem'
                                }}>
                                    {selectedStudent.grades.map((grade: any, idx: number) => (
                                        <div 
                                            key={idx}
                                            style={{
                                                padding: '0.75rem',
                                                background: 'var(--bg-primary)',
                                                borderRadius: 'var(--radius-md)',
                                                border: '1px solid var(--border)'
                                            }}
                                        >
                                            <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>
                                                {grade.subject}
                                            </div>
                                            <div style={{ 
                                                color: 'var(--primary)', 
                                                fontSize: '1.1rem',
                                                fontWeight: 600
                                            }}>
                                                {grade.grade}/20
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
                                Vœux de l'étudiant ({selectedStudent.wishes.length})
                            </h3>
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {selectedStudent.wishes.map((wish) => (
                                    <div 
                                        key={wish.id}
                                        style={{
                                            padding: '1.5rem',
                                            background: 'var(--bg-primary)',
                                            borderRadius: 'var(--radius-md)',
                                            border: `1px solid ${
                                                wish.status === 'accepted' ? 'var(--success)' :
                                                wish.status === 'rejected' ? 'var(--error)' :
                                                'var(--warning)'
                                            }`,
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'flex-start',
                                            gap: '1.5rem',
                                            flexWrap: 'wrap',
                                            boxShadow: 'var(--shadow-sm)'
                                        }}
                                    >
                                        <div style={{ flex: 1, minWidth: '300px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                                <span className="badge" style={{ 
                                                    background: wish.status === 'accepted' ? 'var(--success)' :
                                                               wish.status === 'rejected' ? 'var(--error)' :
                                                               'var(--warning)',
                                                    color: 'white',
                                                    border: 'none'
                                                }}>
                                                    {wish.status === 'accepted' ? 'Accepté' :
                                                     wish.status === 'rejected' ? 'Refusé' :
                                                     'En attente'}
                                                </span>
                                                <span style={{ 
                                                    fontSize: '0.875rem', 
                                                    color: 'var(--text-tertiary)' 
                                                }}>
                                                    {new Date(wish.created_at).toLocaleDateString('fr-FR')}
                                                </span>
                                            </div>
                                            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                                                {wish.school_name}
                                            </h4>
                                            <p style={{ margin: '0 0 0.5rem 0', color: 'var(--primary-light)', fontSize: '1rem', fontWeight: 500 }}>
                                                {wish.program_name}
                                            </p>
                                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                                {wish.city}
                                            </p>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                            {wish.status !== 'accepted' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        updateWishStatus(wish.id, 'accepted')
                                                    }}
                                                    className="btn-success"
                                                    style={{ whiteSpace: 'nowrap' }}
                                                >
                                                    Accepter
                                                </button>
                                            )}
                                            {wish.status !== 'rejected' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        updateWishStatus(wish.id, 'rejected')
                                                    }}
                                                    className="btn-danger"
                                                    style={{ whiteSpace: 'nowrap' }}
                                                >
                                                    Refuser
                                                </button>
                                            )}
                                            {wish.status && wish.status !== 'pending' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        updateWishStatus(wish.id, 'pending')
                                                    }}
                                                    className="btn-secondary"
                                                    style={{ whiteSpace: 'nowrap' }}
                                                >
                                                    ↺ En attente
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ 
                            marginTop: '2rem', 
                            paddingTop: '2rem', 
                            borderTop: '1px solid var(--border)',
                            display: 'flex',
                            justifyContent: 'flex-end'
                        }}>
                            <button
                                onClick={() => setSelectedStudent(null)}
                                className="btn-secondary"
                            >
                                Fermer
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}
