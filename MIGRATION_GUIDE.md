# Guide de Migration - Ajouter la colonne status

Ce guide vous explique comment ajouter la colonne `status` à la table `wishes` dans Supabase.

## Méthode 1 : Via l'éditeur SQL de Supabase (Recommandé)

### Étape 1 : Ouvrir l'éditeur SQL
1. Allez sur [supabase.com](https://supabase.com)
2. Connectez-vous à votre projet
3. Cliquez sur **SQL Editor** dans le menu de gauche

### Étape 2 : Exécuter la migration
1. Copiez le contenu du fichier `migration.sql`
2. Collez-le dans l'éditeur SQL
3. Cliquez sur **Run** (ou appuyez sur `Cmd+Enter` / `Ctrl+Enter`)

### Étape 3 : Vérifier
Vous devriez voir un message de succès. La colonne `status` est maintenant ajoutée à la table `wishes`.

## Méthode 2 : Via l'interface Table Editor

1. Allez dans **Table Editor** dans Supabase
2. Sélectionnez la table `wishes`
3. Cliquez sur **Add Column**
4. Configurez la colonne :
   - **Name**: `status`
   - **Type**: `text`
   - **Default value**: `pending`
   - **Is nullable**: Non (décoché)
5. Cliquez sur **Save**

Ensuite, exécutez cette requête SQL pour ajouter la contrainte CHECK :

```sql
ALTER TABLE wishes 
ADD CONSTRAINT wishes_status_check 
CHECK (status IN ('pending', 'accepted', 'rejected'));
```

## Vérification

Pour vérifier que la migration a réussi, exécutez cette requête :

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'wishes' AND column_name = 'status';
```

Vous devriez voir :
- `column_name`: status
- `data_type`: text
- `column_default`: pending

## Valeurs possibles

La colonne `status` peut avoir trois valeurs :
- `pending` : En attente (valeur par défaut)
- `accepted` : Accepté
- `rejected` : Refusé

## Problèmes courants

### Erreur : "column already exists"
La colonne existe déjà. Vous pouvez ignorer cette erreur ou exécuter :
```sql
ALTER TABLE wishes DROP COLUMN IF EXISTS status;
```
Puis réexécutez la migration.

### Erreur : "permission denied"
Assurez-vous d'être connecté avec un compte ayant les permissions d'administration sur le projet Supabase.

### Les vœux existants n'ont pas de statut
Exécutez cette requête pour mettre à jour tous les vœux existants :
```sql
UPDATE wishes 
SET status = 'pending' 
WHERE status IS NULL;
```

