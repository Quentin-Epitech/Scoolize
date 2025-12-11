# Créer un compte administrateur

Ce guide vous explique comment créer un compte administrateur pour accéder à l'interface admin.

## Méthode 1 : Script automatique (Recommandé)

### Prérequis

1. **Obtenir la SERVICE_ROLE_KEY de Supabase** :
   - Allez dans votre projet Supabase
   - Settings > API
   - Copiez la **"service_role" key** (⚠️ **GARDEZ-LA SECRÈTE !** Ne la commitez jamais dans Git)
   - Cette clé a des permissions administrateur complètes

2. **Ajouter la clé dans votre fichier `.env`** :
   ```bash
   # Ajoutez cette ligne à votre fichier .env
   SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key_ici
   ```

3. **Installer les dépendances** (si ce n'est pas déjà fait) :
   ```bash
   npm install
   ```

### Créer un compte admin

Exécutez le script :
```bash
npm run create-admin
```

Le script vous demandera :
- 📧 L'email de l'admin (doit contenir `@admin.` ou `admin@` pour être reconnu automatiquement)
- 🔒 Le mot de passe (minimum 6 caractères)
- 👤 Le nom complet (optionnel)

**Exemple d'emails admin valides** :
- `admin@parcoursup.fr`
- `john@admin.parcoursup.fr`
- `admin@example.com`

## Méthode 2 : Création manuelle via l'interface Supabase

1. Allez dans votre projet Supabase
2. Authentication > Users
3. Cliquez sur "Add user" > "Create new user"
4. Entrez un email contenant `@admin.` ou `admin@`
5. Entrez un mot de passe
6. Cochez "Auto Confirm User" pour activer le compte immédiatement
7. Cliquez sur "Create user"

## Méthode 3 : Création via l'interface web (Inscription normale)

Vous pouvez aussi créer un compte normalement via l'interface d'inscription, mais assurez-vous que l'email contient `@admin.` ou `admin@` pour être reconnu comme admin.

1. Allez sur votre application
2. Cliquez sur "S'inscrire"
3. Utilisez un email contenant `@admin.` ou `admin@`
4. Créez votre compte
5. Connectez-vous

## Vérifier qu'un compte est admin

Un compte est considéré comme admin si son email contient :
- `@admin.` (ex: `user@admin.example.com`)
- `admin@` (ex: `admin@example.com`)

Cette logique est définie dans `src/App.tsx` ligne 14. Vous pouvez la modifier selon vos besoins.

## Dépannage

### Erreur : "Variables d'environnement manquantes"
- Vérifiez que vous avez bien ajouté `SUPABASE_SERVICE_ROLE_KEY` dans votre fichier `.env`
- Assurez-vous que le fichier `.env` est à la racine du projet

### Erreur : "Invalid API key"
- Vérifiez que vous avez copié la **service_role** key et non la **anon** key
- La service_role key est beaucoup plus longue que l'anon key

### Le compte n'est pas reconnu comme admin
- Vérifiez que l'email contient bien `@admin.` ou `admin@`
- Vous pouvez modifier la logique de détection dans `src/App.tsx`

### Erreur lors de la création du profil
- C'est normal si la table `user_profiles` n'existe pas encore
- Vous pouvez créer cette table avec la migration SQL dans `DATABASE_MIGRATION.md`

## Sécurité

⚠️ **IMPORTANT** :
- Ne partagez JAMAIS votre SERVICE_ROLE_KEY
- Ne commitez JAMAIS votre fichier `.env` dans Git
- Ajoutez `.env` à votre `.gitignore`
- La SERVICE_ROLE_KEY donne un accès complet à votre base de données

