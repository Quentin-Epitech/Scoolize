import { createClient } from '@supabase/supabase-js'
import readline from 'readline'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Charger les variables d'environnement
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Erreur: Variables d\'environnement manquantes')
    console.error('Assurez-vous d\'avoir défini dans votre fichier .env :')
    console.error('  - VITE_SUPABASE_URL')
    console.error('  - SUPABASE_SERVICE_ROLE_KEY')
    console.error('\nPour obtenir la SERVICE_ROLE_KEY :')
    console.error('  1. Allez dans votre projet Supabase')
    console.error('  2. Settings > API')
    console.error('  3. Copiez la "service_role" key (⚠️ gardez-la secrète!)')
    process.exit(1)
}

// Créer un client Supabase avec la clé de service (permissions admin)
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

function question(query) {
    return new Promise(resolve => rl.question(query, resolve))
}

async function createAdminUser() {
    console.log('\n🔧 Création d\'un compte administrateur\n')
    console.log('ℹ️  Pour être reconnu comme admin, l\'email doit contenir "@admin." ou "admin@"\n')

    try {
        const email = await question('📧 Email de l\'admin: ')
        if (!email || !email.includes('@')) {
            console.error('❌ Email invalide')
            rl.close()
            return
        }

        // Vérifier si l'email contient les patterns admin
        const isAdminEmail = email.includes('@admin.') || email.includes('admin@')
        if (!isAdminEmail) {
            console.warn('⚠️  Attention: Cet email ne sera pas reconnu comme admin automatiquement.')
            console.warn('   Les emails admin doivent contenir "@admin." ou "admin@"')
            const confirm = await question('   Continuer quand même? (o/n): ')
            if (confirm.toLowerCase() !== 'o' && confirm.toLowerCase() !== 'oui') {
                console.log('❌ Annulé')
                rl.close()
                return
            }
        }

        const password = await question('🔒 Mot de passe (min 6 caractères): ')
        if (!password || password.length < 6) {
            console.error('❌ Le mot de passe doit contenir au moins 6 caractères')
            rl.close()
            return
        }

        const confirmPassword = await question('🔒 Confirmer le mot de passe: ')
        if (password !== confirmPassword) {
            console.error('❌ Les mots de passe ne correspondent pas')
            rl.close()
            return
        }

        const fullName = await question('👤 Nom complet (optionnel): ') || null

        console.log('\n⏳ Création du compte en cours...')

        // Créer l'utilisateur avec l'API Admin
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true, // Confirmer l'email automatiquement
            user_metadata: {
                full_name: fullName || email.split('@')[0],
                role: 'admin'
            }
        })

        if (userError) {
            console.error('❌ Erreur lors de la création de l\'utilisateur:', userError.message)
            rl.close()
            return
        }

        if (!userData.user) {
            console.error('❌ Aucun utilisateur créé')
            rl.close()
            return
        }

        console.log('✅ Utilisateur créé avec succès!')

        // Créer un profil dans user_profiles si la table existe
        try {
            const { error: profileError } = await supabaseAdmin
                .from('user_profiles')
                .insert({
                    id: userData.user.id,
                    email: email,
                    full_name: fullName || email.split('@')[0]
                })

            if (profileError) {
                console.warn('⚠️  Note: Impossible de créer le profil utilisateur (la table user_profiles n\'existe peut-être pas)')
                console.warn('   Vous pouvez créer cette table avec la migration SQL dans DATABASE_MIGRATION.md')
            } else {
                console.log('✅ Profil utilisateur créé')
            }
        } catch (err) {
            console.warn('⚠️  Note: Table user_profiles non disponible')
        }

        console.log('\n📋 Informations du compte:')
        console.log(`   Email: ${email}`)
        console.log(`   ID: ${userData.user.id}`)
        console.log(`   Admin: ${isAdminEmail ? '✅ Oui' : '⚠️  Non (email ne correspond pas au pattern)'}`)
        console.log('\n✅ Compte admin créé avec succès!')
        console.log('   Vous pouvez maintenant vous connecter avec cet email et mot de passe.\n')

    } catch (error) {
        console.error('❌ Erreur:', error.message)
    } finally {
        rl.close()
    }
}

// Exécuter le script
createAdminUser().catch(console.error)

