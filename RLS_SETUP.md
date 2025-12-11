# Configuration des permissions RLS pour les admins

Ce guide vous explique comment configurer les politiques RLS (Row Level Security) dans Supabase pour que les admins puissent voir et modifier tous les vœux.

## Problème

Si vous êtes admin et que vous ne voyez pas les vœux de tous les étudiants, ou si vous ne pouvez pas accepter/refuser des vœux, c'est probablement dû aux politiques RLS qui ne sont pas correctement configurées.

## Solution

### Étape 1 : Ouvrir l'éditeur SQL dans Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Connectez-vous à votre projet
3. Cliquez sur **SQL Editor** dans le menu de gauche

### Étape 2 : Exécuter le script de configuration RLS

1. Ouvrez le fichier `rls-policies.sql` dans votre projet
2. **Copiez tout le contenu** du fichier
3. Collez-le dans l'éditeur SQL de Supabase
4. Cliquez sur **Run** (ou appuyez sur `Cmd+Enter` / `Ctrl+Enter`)

### Étape 3 : Vérifier

Le script va :
- ✅ Supprimer les anciennes politiques (si elles existent)
- ✅ Créer de nouvelles politiques permettant aux admins de voir tous les vœux
- ✅ Permettre aux admins de modifier le statut des vœux
- ✅ Afficher un résumé des politiques créées

## Ce que fait le script

### Pour la table `wishes` :
- ✅ Les utilisateurs peuvent voir leurs propres vœux
- ✅ **Les admins peuvent voir TOUS les vœux** (identifiés par email contenant `@admin.` ou `admin@`)
- ✅ Les utilisateurs peuvent créer leurs propres vœux
- ✅ **Les admins peuvent modifier TOUS les vœux** (pour changer le statut)
- ✅ Les utilisateurs peuvent supprimer leurs propres vœux

### Pour la table `grades` :
- ✅ Les utilisateurs peuvent voir leurs propres notes
- ✅ **Les admins peuvent voir TOUTES les notes**
- ✅ Les utilisateurs peuvent créer leurs propres notes

### Pour la table `user_profiles` (si elle existe) :
- ✅ Les utilisateurs peuvent voir leur propre profil
- ✅ **Les admins peuvent voir tous les profils**

## Détection des admins

Les admins sont automatiquement détectés par leur email :
- Email contenant `@admin.` (ex: `user@admin.example.com`)
- Email commençant par `admin@` (ex: `admin@example.com`)

Cette logique correspond à celle dans `src/App.tsx`.

## Dépannage

### Erreur : "permission denied"
- Vérifiez que vous êtes connecté avec un compte admin dans Supabase
- Vérifiez que votre email contient `@admin.` ou `admin@`

### Les vœux ne s'affichent toujours pas
1. Vérifiez que le script s'est exécuté sans erreur
2. Rafraîchissez la page de l'application
3. Déconnectez-vous et reconnectez-vous
4. Vérifiez dans Supabase > Authentication > Users que votre compte a bien un email admin

### Erreur lors de la modification du statut
- Vérifiez que la colonne `status` existe (voir `migration.sql`)
- Vérifiez que les politiques UPDATE ont été créées (voir la section "Vérification" du script)

## Alternative : Désactiver RLS (non recommandé pour la production)

Si vous voulez tester rapidement sans RLS, vous pouvez désactiver temporairement RLS :

```sql
ALTER TABLE wishes DISABLE ROW LEVEL SECURITY;
ALTER TABLE grades DISABLE ROW LEVEL SECURITY;
```

⚠️ **Attention** : Ne faites cela que pour le développement. En production, gardez RLS activé pour la sécurité.

## Vérification des politiques

Pour voir toutes les politiques actives, exécutez :

```sql
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('wishes', 'grades', 'user_profiles')
ORDER BY tablename, policyname;
```

