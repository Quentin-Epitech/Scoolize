export const PATHWAYS = [
    'Générale',
    'Technologique',
    'Professionnelle'
] as const

export type Pathway = typeof PATHWAYS[number]

export const YEAR_LEVELS = [
    'Seconde',
    'Première',
    'Terminale'
] as const

export type YearLevel = typeof YEAR_LEVELS[number]

export const TERMS = [
    'Trimestre 1',
    'Trimestre 2',
    'Trimestre 3'
] as const

export const COMMON_SUBJECTS = [
    'Français',
    'Mathématiques',
    'Histoire-Géographie',
    'LVA (Anglais)',
    'LVB (Espagnol/Allemand/Italien)',
    'EMC (Enseignement Moral et Civique)',
    'EPS (Éducation Physique et Sportive)',
    'Physique-Chimie',
    'SVT (Sciences de la Vie et de la Terre)',
    'SES (Sciences Économiques et Sociales)',
    'SNT (Sciences Numériques et Technologie)'
]


export const GENERAL_SPECIALTIES = [
    'Mathématiques',
    'Physique-Chimie',
    'SVT (Sciences de la Vie et de la Terre)',
    'Sciences de l\'Ingénieur',
    'NSI (Numérique et Sciences Informatiques)',
    'SES (Sciences Économiques et Sociales)',
    'HGGSP (Histoire-Géographie, Géopolitique et Sciences Politiques)',
    'HLP (Humanités, Littérature et Philosophie)',
    'LLCER (Langues, Littératures et Cultures Étrangères et Régionales)',
    'Arts (Plastiques, Musique, Théâtre, Cinéma-Audiovisuel, Danse, Histoire des Arts)',
    'Biologie-Écologie (lycées agricoles)'
]


export const TECH_SERIES = {
    'STI2D': 'Sciences et Technologies de l\'Industrie et du Développement Durable',
    'STL': 'Sciences et Technologies de Laboratoire',
    'STMG': 'Sciences et Technologies du Management et de la Gestion',
    'STD2A': 'Sciences et Technologies du Design et des Arts Appliqués',
    'ST2S': 'Sciences et Technologies de la Santé et du Social',
    'S2TMD': 'Sciences et Techniques du Théâtre, de la Musique et de la Danse',
    'STHR': 'Sciences et Technologies de l\'Hôtellerie et de la Restauration',
    'STAV': 'Sciences et Technologies de l\'Agronomie et du Vivant'
} as const

export const TECH_SPECIALTIES: Record<keyof typeof TECH_SERIES, string[]> = {
    'STI2D': [
        'Innovation Technologique',
        'Ingénierie et Développement Durable',
        'Architecture et Construction',
        'Énergies et Environnement',
        'Systèmes d\'Information et Numérique',
        'Innovation Technologique et Éco-Conception'
    ],
    'STL': [
        'Biochimie-Biologie-Biotechnologies',
        'Sciences Physiques et Chimiques en Laboratoire'
    ],
    'STMG': [
        'Gestion et Finance',
        'Mercatique (Marketing)',
        'Ressources Humaines et Communication',
        'Systèmes d\'Information de Gestion'
    ],
    'STD2A': [
        'Design et Métiers d\'Art'
    ],
    'ST2S': [
        'Sciences et Techniques Sanitaires et Sociales',
        'Biologie et Physiopathologie Humaines'
    ],
    'S2TMD': [
        'Culture et Sciences Chorégraphiques',
        'Culture et Sciences Musicales',
        'Culture et Sciences Théâtrales'
    ],
    'STHR': [
        'Sciences et Technologies Culinaires',
        'Sciences et Technologies des Services'
    ],
    'STAV': [
        'Production Agricole',
        'Aménagement et Valorisation des Espaces'
    ]
}


export const PROFESSIONAL_FIELDS = [
    'Commerce et Vente',
    'Gestion-Administration',
    'Métiers de l\'Électricité et de ses Environnements Connectés',
    'Maintenance des Équipements Industriels',
    'Métiers de la Sécurité',
    'Accompagnement, Soins et Services à la Personne',
    'Cuisine',
    'Commercialisation et Services en Restauration',
    'Métiers de la Mode',
    'Artisanat et Métiers d\'Art',
    'Technicien d\'Usinage',
    'Systèmes Numériques',
    'Travaux Publics',
    'Métiers du Bois'
]

export const PROFESSIONAL_SUBJECTS = [
    'Enseignement Professionnel',
    'Français',
    'Mathématiques',
    'Histoire-Géographie et EMC',
    'LVA',
    'LVB',
    'Arts Appliqués et Cultures Artistiques',
    'EPS',
    'Prévention Santé Environnement',
    'Économie-Droit',
    'Économie-Gestion'
]
