# Solution rapide : Permissions RLS

Si vous voyez l'erreur "Les politiques RLS ne sont pas correctement configurées", suivez ces étapes :

## ⚡ Solution la plus rapide (2 minutes)

**Utilisez le fichier `rls-policies-fix.sql`** - C'est la version la plus simple qui fonctionne à coup sûr.

## Solution rapide (5 minutes)

### 1. Ouvrir Supabase SQL Editor
1. Allez sur https://supabase.com
2. Connectez-vous
3. Sélectionnez votre projet
4. Cliquez sur **SQL Editor** dans le menu de gauche

### 2. Copier-coller le script

**⭐ Option A : Script de correction rapide (RECOMMANDÉ - le plus simple)**
- Ouvrez le fichier `rls-policies-fix.sql`
- Copiez **TOUT** le contenu (Cmd+A puis Cmd+C)
- Collez dans l'éditeur SQL de Supabase
- Cliquez sur **Run** (ou Cmd+Enter)

**Option B : Script simplifié**
- Ouvrez le fichier `rls-policies-simple.sql`
- Copiez **TOUT** le contenu
- Collez dans l'éditeur SQL de Supabase
- Cliquez sur **Run**

**Option C : Script complet**
- Ouvrez le fichier `rls-policies.sql`
- Copiez **TOUT** le contenu
- Collez dans l'éditeur SQL de Supabase
- Cliquez sur **Run**

### 3. Vérifier le résultat

Vous devriez voir :
- ✅ Des messages de succès
- ✅ Un tableau listant les politiques créées (à la fin)

### 4. Rafraîchir l'application

1. Retournez sur votre application (localhost:5173)
2. **Déconnectez-vous** puis **reconnectez-vous** avec votre compte admin
3. L'erreur devrait disparaître

## Vérifier que vous êtes bien admin

Votre email doit contenir :
- `@admin.` (ex: `user@admin.example.com`)
- OU `admin@` (ex: `admin@example.com`)

## Si ça ne fonctionne toujours pas

### Vérification 1 : Votre compte est-il admin ?
```sql
-- Exécutez cette requête dans Supabase SQL Editor
SELECT id, email 
FROM auth.users 
WHERE email LIKE '%@admin.%' OR email LIKE 'admin@%';
```

Vous devriez voir votre email dans les résultats.

### Vérification 2 : Les politiques sont-elles créées ?
```sql
-- Exécutez cette requête
SELECT tablename, policyname, cmd
FROM pg_policies 
WHERE tablename = 'wishes';
```

Vous devriez voir au moins 5 politiques pour la table `wishes`.

### Vérification 3 : RLS est-il activé ?
```sql
-- Exécutez cette requête
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'wishes';
```

`rowsecurity` devrait être `true`.

## Solution alternative : Désactiver RLS temporairement

⚠️ **UNIQUEMENT pour le développement, PAS pour la production !**

```sql
ALTER TABLE wishes DISABLE ROW LEVEL SECURITY;
ALTER TABLE grades DISABLE ROW LEVEL SECURITY;
```

Cela permettra à tous les utilisateurs authentifiés de voir tous les vœux, mais c'est moins sécurisé.

## Besoin d'aide ?

Si le problème persiste :
1. Vérifiez la console du navigateur (F12) pour voir les erreurs détaillées
2. Vérifiez les logs dans Supabase > Logs > Postgres Logs
3. Assurez-vous que la colonne `status` existe (voir `migration.sql`)

