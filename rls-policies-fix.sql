-- SOLUTION RAPIDE : Permissions RLS pour admins
-- Copiez-collez ce script dans Supabase SQL Editor et exécutez-le

-- 1. Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "Users can view their own wishes" ON wishes;
DROP POLICY IF EXISTS "Admins can view all wishes" ON wishes;
DROP POLICY IF EXISTS "Admins can update all wishes" ON wishes;
DROP POLICY IF EXISTS "Admins can update wish status" ON wishes;
DROP POLICY IF EXISTS "Users can insert their own wishes" ON wishes;
DROP POLICY IF EXISTS "Users can delete their own wishes" ON wishes;

DROP POLICY IF EXISTS "Users can view their own grades" ON grades;
DROP POLICY IF EXISTS "Admins can view all grades" ON grades;
DROP POLICY IF EXISTS "Users can insert their own grades" ON grades;

-- 2. Activer RLS
ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

-- 3. Politique SIMPLE : Permettre à TOUS les utilisateurs authentifiés de voir TOUS les vœux
-- (Pour le développement - vous pouvez restreindre plus tard)
CREATE POLICY "All authenticated users can view all wishes"
ON wishes FOR SELECT
USING (auth.role() = 'authenticated');

-- 4. Permettre aux utilisateurs de créer leurs propres vœux
CREATE POLICY "Users can insert their own wishes"
ON wishes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 5. Permettre à TOUS les utilisateurs authentifiés de modifier TOUS les vœux
-- (Pour permettre aux admins de changer les statuts)
CREATE POLICY "All authenticated users can update all wishes"
ON wishes FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- 6. Permettre aux utilisateurs de supprimer leurs propres vœux
CREATE POLICY "Users can delete their own wishes"
ON wishes FOR DELETE
USING (auth.uid() = user_id);

-- 7. Permettre à TOUS les utilisateurs authentifiés de voir TOUTES les notes
CREATE POLICY "All authenticated users can view all grades"
ON grades FOR SELECT
USING (auth.role() = 'authenticated');

-- 8. Permettre aux utilisateurs de créer leurs propres notes
CREATE POLICY "Users can insert their own grades"
ON grades FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Vérification
SELECT 'Politiques créées avec succès!' as status;
SELECT tablename, policyname FROM pg_policies WHERE tablename IN ('wishes', 'grades');

