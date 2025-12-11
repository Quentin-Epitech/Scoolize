# Migration de la base de données pour l'interface Admin

Pour activer la gestion des statuts des vœux dans l'interface admin, vous devez ajouter une colonne `status` à la table `wishes` dans Supabase.

## Migration SQL

Exécutez cette requête SQL dans l'éditeur SQL de Supabase :

```sql
-- Ajouter la colonne status à la table wishes
ALTER TABLE wishes 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' 
CHECK (status IN ('pending', 'accepted', 'rejected'));

-- Créer un index pour améliorer les performances des requêtes filtrées
CREATE INDEX IF NOT EXISTS idx_wishes_status ON wishes(status);

-- Mettre à jour les vœux existants pour qu'ils aient le statut 'pending' par défaut
UPDATE wishes 
SET status = 'pending' 
WHERE status IS NULL;
```

## Structure de la table wishes

La table `wishes` devrait maintenant avoir la structure suivante :

- `id` (bigint, primary key)
- `user_id` (uuid, foreign key vers auth.users)
- `school_name` (text)
- `program_name` (text)
- `city` (text)
- `status` (text) - Nouvelle colonne avec valeurs possibles : 'pending', 'accepted', 'rejected'
- `created_at` (timestamp)

## Permissions RLS (Row Level Security)

Assurez-vous que les politiques RLS permettent aux écoles de voir et modifier les vœux. Exemple de politique :

```sql
-- Permettre aux utilisateurs de voir leurs propres vœux
CREATE POLICY "Users can view their own wishes"
ON wishes FOR SELECT
USING (auth.uid() = user_id);

-- Permettre aux admins de voir tous les vœux
-- Note: Vous pouvez créer une table admin_users pour gérer les admins
-- Pour l'instant, on permet à tous les utilisateurs authentifiés de voir tous les vœux
-- (à adapter selon votre logique de permissions)
CREATE POLICY "Admins can view all wishes"
ON wishes FOR SELECT
USING (true); -- À adapter selon votre logique de permissions

-- Permettre aux admins de mettre à jour le statut des vœux
CREATE POLICY "Admins can update wish status"
ON wishes FOR UPDATE
USING (true) -- À adapter selon votre logique
WITH CHECK (true);
```

## Table user_profiles (optionnelle)

Si vous voulez stocker les emails des étudiants de manière accessible, créez une table `user_profiles` :

```sql
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Permettre aux utilisateurs de voir leur propre profil
CREATE POLICY "Users can view their own profile"
ON user_profiles FOR SELECT
USING (auth.uid() = id);

-- Permettre aux admins de voir les profils (pour afficher les emails et noms)
CREATE POLICY "Admins can view profiles"
ON user_profiles FOR SELECT
USING (true); -- À adapter selon votre logique
```

