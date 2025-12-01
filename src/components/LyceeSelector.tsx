import { useState, useEffect } from 'react'
import Papa from 'papaparse'
import { motion, AnimatePresence } from 'framer-motion'

interface Lycee {
    Identifiant_de_l_etablissement: string
    Nom_etablissement: string
    Type_etablissement: string
    Statut_public_prive: string
    Code_postal: string
    Nom_commune: string
    Code_departement: string
    Libelle_departement: string
}

interface LyceeSelectorProps {
    onSelect: (lycee: Lycee | null) => void
    selectedLycee?: Lycee | null
    required?: boolean
}

export default function LyceeSelector({ onSelect, selectedLycee, required = false }: LyceeSelectorProps) {
    const [lycees, setLycees] = useState<Lycee[]>([])
    const [filteredLycees, setFilteredLycees] = useState<Lycee[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState(true)
    const [showDropdown, setShowDropdown] = useState(false)

    useEffect(() => {
        Papa.parse('/lycees_seulement.csv', {
            download: true,
            header: true,
            complete: (results) => {
                const data = (results.data as Lycee[]).filter(l => l.Nom_etablissement)
                setLycees(data)
                setLoading(false)
            },
            error: () => {
                console.error('Erreur lors du chargement des lycées')
                setLoading(false)
            }
        })
    }, [])

    useEffect(() => {
        if (searchTerm.length < 2) {
            setFilteredLycees([])
            setShowDropdown(false)
            return
        }

        const lowerTerm = searchTerm.toLowerCase()
        const filtered = lycees.filter(l =>
            l.Nom_etablissement?.toLowerCase().includes(lowerTerm) ||
            l.Nom_commune?.toLowerCase().includes(lowerTerm) ||
            l.Libelle_departement?.toLowerCase().includes(lowerTerm)
        ).slice(0, 15)

        setFilteredLycees(filtered)
        setShowDropdown(true)
    }, [searchTerm, lycees])

    const handleSelect = (lycee: Lycee) => {
        onSelect(lycee)
        setSearchTerm(lycee.Nom_etablissement)
        setShowDropdown(false)
    }

    const handleClear = () => {
        onSelect(null)
        setSearchTerm('')
        setShowDropdown(false)
    }

    return (
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <label htmlFor="lycee-search" style={{ display: 'block', marginBottom: '0.5rem' }}>
                Lycée {required && <span style={{ color: 'var(--error-color)' }}>*</span>}
            </label>

            <div style={{ position: 'relative' }}>
                <input
                    id="lycee-search"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => searchTerm.length >= 2 && setShowDropdown(true)}
                    placeholder="Rechercher votre lycée..."
                    disabled={loading}
                    required={required}
                    style={{ width: '100%', paddingRight: selectedLycee ? '40px' : '10px' }}
                />

                {selectedLycee && (
                    <button
                        type="button"
                        onClick={handleClear}
                        style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '1.2rem',
                            color: 'var(--text-secondary)',
                            padding: '0',
                            lineHeight: '1'
                        }}
                        aria-label="Effacer la sélection"
                    >
                        ×
                    </button>
                )}
            </div>

            {loading && (
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    Chargement des lycées...
                </p>
            )}

            {!loading && searchTerm.length > 0 && searchTerm.length < 2 && (
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    Tapez au moins 2 caractères pour rechercher
                </p>
            )}

            <AnimatePresence>
                {showDropdown && filteredLycees.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            maxHeight: '300px',
                            overflowY: 'auto',
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            marginTop: '0.5rem',
                            zIndex: 1000,
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                        }}
                    >
                        {filteredLycees.map((lycee, index) => (
                            <div
                                key={index}
                                onClick={() => handleSelect(lycee)}
                                style={{
                                    padding: '1rem',
                                    cursor: 'pointer',
                                    borderBottom: index < filteredLycees.length - 1 ? '1px solid var(--border-color)' : 'none',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.1)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent'
                                }}
                            >
                                <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                                    {lycee.Nom_etablissement}
                                </div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    📍 {lycee.Nom_commune} ({lycee.Libelle_departement})
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                    {lycee.Type_etablissement} • {lycee.Statut_public_prive}
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {selectedLycee && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                        marginTop: '0.5rem',
                        padding: '0.75rem',
                        background: 'rgba(102, 126, 234, 0.1)',
                        borderRadius: '6px',
                        fontSize: '0.9rem'
                    }}
                >
                    <div style={{ fontWeight: '500', color: 'var(--primary-color)' }}>
                        ✓ Lycée sélectionné
                    </div>
                    <div style={{ marginTop: '0.25rem', color: 'var(--text-secondary)' }}>
                        {selectedLycee.Nom_commune} ({selectedLycee.Libelle_departement})
                    </div>
                </motion.div>
            )}
        </div>
    )
}
