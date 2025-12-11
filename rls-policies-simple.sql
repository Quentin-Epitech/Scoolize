-- Script SIMPLIFIÉ pour configurer les permissions RLS pour les admins
-- Exécutez ce script dans l'éditeur SQL de Supabase (SQL Editor)

-- ============================================
-- ÉTAPE 1 : Supprimer les anciennes politiques
-- ============================================
DROP POLICY IF EXISTS "Users can view their own wishes" ON wishes;
DROP POLICY IF EXISTS "Admins can view all wishes" ON wishes;
DROP POLICY IF EXISTS "Admins can update all wishes" ON wishes;
DROP POLICY IF EXISTS "Users can insert their own wishes" ON wishes;
DROP POLICY IF EXISTS "Users can delete their own wishes" ON wishes;

DROP POLICY IF EXISTS "Users can view their own grades" ON grades;
DROP POLICY IF EXISTS "Admins can view all grades" ON grades;
DROP POLICY IF EXISTS "Users can insert their own grades" ON grades;

-- ============================================
-- ÉTAPE 2 : Activer RLS
-- ============================================
ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ÉTAPE 3 : Créer les politiques pour wishes
-- ============================================

-- Les utilisateurs peuvent voir leurs propres vœux
CREATE POLICY "Users can view their own wishes"
ON wishes FOR SELECT
USING (auth.uid() = user_id);

-- Les admins peuvent voir TOUS les vœux
CREATE POLICY "Admins can view all wishes"
ON wishes FOR SELECT
USING (
    -- Vérifier si l'utilisateur est admin (email contient @admin. ou admin@)
    (SELECT email FROM auth.users WHERE id = auth.uid()) LIKE '%@admin.%'
    OR (SELECT email FROM auth.users WHERE id = auth.uid()) LIKE 'admin@%'
    OR auth.uid() = user_id  -- Permettre aussi de voir ses propres vœux
);

-- Les utilisateurs peuvent créer leurs propres vœux
CREATE POLICY "Users can insert their own wishes"
ON wishes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Les admins peuvent modifier TOUS les vœux (pour changer le statut)
CREATE POLICY "Admins can update all wishes"
ON wishes FOR UPDATE
USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) LIKE '%@admin.%'
    OR (SELECT email FROM auth.users WHERE id = auth.uid()) LIKE 'admin@%'
    OR auth.uid() = user_id
)
WITH CHECK (
    (SELECT email FROM auth.users WHERE id = auth.uid()) LIKE '%@admin.%'
    OR (SELECT email FROM auth.users WHERE id = auth.uid()) LIKE 'admin@%'
    OR auth.uid() = user_id
);

-- Les utilisateurs peuvent supprimer leurs propres vœux
CREATE POLICY "Users can delete their own wishes"
ON wishes FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- ÉTAPE 4 : Créer les politiques pour grades
-- ============================================

-- Les utilisateurs peuvent voir leurs propres notes
CREATE POLICY "Users can view their own grades"
ON grades FOR SELECT
USING (auth.uid() = user_id);

-- Les admins peuvent voir TOUTES les notes
CREATE POLICY "Admins can view all grades"
ON grades FOR SELECT
USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) LIKE '%@admin.%'
    OR (SELECT email FROM auth.users WHERE id = auth.uid()) LIKE 'admin@%'
    OR auth.uid() = user_id
);

-- Les utilisateurs peuvent créer leurs propres notes
CREATE POLICY "Users can insert their own grades"
ON grades FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- VÉRIFICATION
-- ============================================
-- Afficher les politiques créées
SELECT 
    tablename,
    policyname,
    cmd as operation
FROM pg_policies 
WHERE tablename IN ('wishes', 'grades')
ORDER BY tablename, policyname;

