-- Migration pour ajouter la colonne status à la table wishes
-- Exécutez ce script dans l'éditeur SQL de Supabase

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

-- Vérifier que la colonne a été créée
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'wishes' AND column_name = 'status';

