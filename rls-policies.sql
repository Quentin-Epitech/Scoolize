-- Script pour configurer les politiques RLS (Row Level Security) pour les admins
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- ============================================
-- 1. DÉSACTIVER RLS TEMPORAIREMENT (si nécessaire)
-- ============================================
-- Si vous avez des problèmes, vous pouvez désactiver RLS temporairement pour tester :
-- ALTER TABLE wishes DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE grades DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. SUPPRIMER LES ANCIENNES POLITIQUES (si elles existent)
-- ============================================
DROP POLICY IF EXISTS "Users can view their own wishes" ON wishes;
DROP POLICY IF EXISTS "Admins can view all wishes" ON wishes;
DROP POLICY IF EXISTS "Admins can update wish status" ON wishes;
DROP POLICY IF EXISTS "Users can insert their own wishes" ON wishes;
DROP POLICY IF EXISTS "Users can delete their own wishes" ON wishes;

DROP POLICY IF EXISTS "Users can view their own grades" ON grades;
DROP POLICY IF EXISTS "Admins can view all grades" ON grades;
DROP POLICY IF EXISTS "Users can insert their own grades" ON grades;

DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view profiles" ON user_profiles;

-- ============================================
-- 3. ACTIVER RLS SUR LES TABLES
-- ============================================
ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

-- Activer RLS sur user_profiles si la table existe
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- ============================================
-- 4. POLITIQUES POUR LA TABLE wishes
-- ============================================

-- Permettre aux utilisateurs de voir leurs propres vœux
CREATE POLICY "Users can view their own wishes"
ON wishes FOR SELECT
USING (auth.uid() = user_id);

-- Permettre aux admins de voir TOUS les vœux
-- Les admins sont identifiés par leur email contenant '@admin.' ou 'admin@'
CREATE POLICY "Admins can view all wishes"
ON wishes FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND (
            auth.users.email LIKE '%@admin.%' 
            OR auth.users.email LIKE 'admin@%'
        )
    )
    OR auth.uid() = user_id  -- Permettre aussi de voir ses propres vœux
);

-- Permettre aux utilisateurs d'insérer leurs propres vœux
CREATE POLICY "Users can insert their own wishes"
ON wishes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Permettre aux admins de mettre à jour TOUS les vœux (pour changer le statut)
CREATE POLICY "Admins can update all wishes"
ON wishes FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND (
            auth.users.email LIKE '%@admin.%' 
            OR auth.users.email LIKE 'admin@%'
        )
    )
    OR auth.uid() = user_id  -- Permettre aussi de modifier ses propres vœux
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND (
            auth.users.email LIKE '%@admin.%' 
            OR auth.users.email LIKE 'admin@%'
        )
    )
    OR auth.uid() = user_id
);

-- Permettre aux utilisateurs de supprimer leurs propres vœux
CREATE POLICY "Users can delete their own wishes"
ON wishes FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- 5. POLITIQUES POUR LA TABLE grades
-- ============================================

-- Permettre aux utilisateurs de voir leurs propres notes
CREATE POLICY "Users can view their own grades"
ON grades FOR SELECT
USING (auth.uid() = user_id);

-- Permettre aux admins de voir TOUTES les notes
CREATE POLICY "Admins can view all grades"
ON grades FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND (
            auth.users.email LIKE '%@admin.%' 
            OR auth.users.email LIKE 'admin@%'
        )
    )
    OR auth.uid() = user_id
);

-- Permettre aux utilisateurs d'insérer leurs propres notes
CREATE POLICY "Users can insert their own grades"
ON grades FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 6. POLITIQUES POUR LA TABLE user_profiles (si elle existe)
-- ============================================

DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        -- Permettre aux utilisateurs de voir leur propre profil
        CREATE POLICY "Users can view their own profile"
        ON user_profiles FOR SELECT
        USING (auth.uid() = id);

        -- Permettre aux admins de voir tous les profils
        CREATE POLICY "Admins can view all profiles"
        ON user_profiles FOR SELECT
        USING (
            EXISTS (
                SELECT 1 FROM auth.users 
                WHERE auth.users.id = auth.uid() 
                AND (
                    auth.users.email LIKE '%@admin.%' 
                    OR auth.users.email LIKE 'admin@%'
                )
            )
            OR auth.uid() = id
        );
    END IF;
END $$;

-- ============================================
-- 7. VÉRIFICATION
-- ============================================
-- Vérifier que les politiques ont été créées
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('wishes', 'grades', 'user_profiles')
ORDER BY tablename, policyname;

