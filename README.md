# ParcourStup

Application web pour la gestion des vœux Parcoursup avec prédiction de compatibilité.

## Fonctionnalités

### Interface Étudiant
- 📝 **Gestion des notes** : Saisie et import de notes avec OCR (optical character recognition)
- 🏫 **Recherche d'écoles** : Recherche et sélection d'établissements
- 🎯 **Prédiction de compatibilité** : Algorithme de recommandation basé sur les notes et préférences
- 💾 **Sauvegarde des vœux** : Enregistrement des vœux dans la base de données

### Interface Admin (Nouveau)
- 📊 **Tableau de bord** : Vue d'ensemble de tous les étudiants et leurs vœux
- 👥 **Liste des étudiants** : Affichage de tous les étudiants avec leurs statistiques de vœux
- 🔍 **Recherche par nom** : Recherche d'un étudiant par nom ou email
- 📋 **Gestion des vœux** : Consultation et traitement de tous les vœux de chaque étudiant
- 👤 **Détails complets** : Affichage des notes et de tous les vœux d'un étudiant
- ✅ **Statuts des vœux** : Acceptation, refus ou mise en attente des candidatures
- 🎯 **Filtres** : Filtrer par statut (en attente, accepté, refusé)

## Installation

1. Installer les dépendances :
```bash
npm install
```

2. Configurer les variables d'environnement (`.env`) :
```
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_cle_anon
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key (pour créer des admins)
```

   Voir `.env.example` pour un exemple de configuration.

3. Exécuter la migration de base de données (voir `DATABASE_MIGRATION.md`)

4. Lancer le serveur de développement :
```bash
npm run dev
```

## Migration de la base de données

Pour activer la gestion des statuts des vœux dans l'interface école, exécutez la migration SQL décrite dans `DATABASE_MIGRATION.md`.

## Technologies

- **Frontend** : React + TypeScript + Vite
- **Styling** : CSS moderne avec variables CSS
- **Animations** : Framer Motion
- **Base de données** : Supabase
- **OCR** : Tesseract.js (pour l'import de notes depuis PDF)
- **Algorithme de prédiction** : Algorithme personnalisé basé sur les notes et préférences

## Structure du projet

```
src/
├── components/
│   ├── Auth/          # Authentification (Login, Signup)
│   ├── School/        # Interface école (nouveau)
│   ├── GradeForm.tsx  # Formulaire de saisie des notes
│   └── SchoolSelector.tsx  # Sélection d'écoles
├── lib/
│   ├── predict.ts     # Algorithme de recommandation
│   └── supabaseClient.ts
└── App.tsx            # Composant principal avec bascule vue étudiant/école
```

## Utilisation

### Pour les étudiants
1. Se connecter ou créer un compte
2. Basculer en mode "Étudiant" (par défaut)
3. Saisir ses notes dans l'onglet "Mes Notes"
4. Rechercher et sélectionner des écoles dans l'onglet "Faire mes vœux"
5. Valider ses vœux

### Pour les administrateurs
1. Se connecter avec un compte admin (email contenant `@admin.` ou `admin@`)
2. Basculer en mode "Admin" via le sélecteur en haut à droite (visible uniquement pour les admins)
3. Consulter la liste de tous les étudiants
4. Rechercher un étudiant par nom ou email
5. Cliquer sur un étudiant pour voir tous ses vœux et ses notes
6. Accepter, refuser ou mettre en attente chaque vœu individuellement
7. Filtrer les étudiants selon le statut de leurs vœux

**Note** : Pour créer un compte admin, voir le fichier `CREATE_ADMIN.md` pour les instructions détaillées.

**Méthode rapide** :
1. Obtenez votre SERVICE_ROLE_KEY dans Supabase (Settings > API)
2. Ajoutez-la dans votre `.env` : `SUPABASE_SERVICE_ROLE_KEY=votre_cle`
3. Exécutez : `npm run create-admin`

Un compte est reconnu comme admin si son email contient `@admin.` ou `admin@` (ex: `admin@parcoursup.fr`). Vous pouvez modifier cette logique dans `src/App.tsx`.


