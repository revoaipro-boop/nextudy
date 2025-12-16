# Instructions de Configuration du Système d'Activation

## Problème Actuel
L'erreur "Could not find the table 'public.activation_tokens' in the schema cache" indique que la table n'existe pas encore dans votre base de données.

## Solution : Exécuter le Script SQL

### Étape 1 : Exécuter le Script de Migration

Le script `scripts/014_create_activation_tokens.sql` doit être exécuté dans votre base de données Supabase.

**Option A : Via l'interface v0 (Recommandé)**
1. Le script est déjà présent dans le dossier `scripts/`
2. v0 peut exécuter automatiquement les scripts SQL
3. Le script créera la table `activation_tokens` avec tous les index et politiques RLS nécessaires

**Option B : Via le Dashboard Supabase**
1. Allez sur [supabase.com](https://supabase.com)
2. Ouvrez votre projet
3. Allez dans "SQL Editor"
4. Copiez le contenu du fichier `scripts/014_create_activation_tokens.sql`
5. Collez-le dans l'éditeur SQL
6. Cliquez sur "Run" pour exécuter

### Étape 2 : Vérifier la Création de la Table

Après l'exécution, vérifiez que la table existe :

```sql
SELECT * FROM activation_tokens LIMIT 1;
```

Si la requête fonctionne (même si elle retourne 0 lignes), la table est créée avec succès.

## Structure de la Table

La table `activation_tokens` contient :
- `id` : UUID unique du token
- `user_id` : Référence vers auth.users(id)
- `token_hash` : Hash bcrypt du token (sécurisé)
- `created_at` : Date de création
- `expires_at` : Date d'expiration (24h après création)
- `used` : Booléen indiquant si le token a été utilisé
- `used_at` : Date d'utilisation (null si non utilisé)

## Flux Complet Après Configuration

### 1. Inscription Utilisateur
- L'utilisateur s'inscrit avec email/mot de passe
- Un token d'activation est généré (32 bytes aléatoires)
- Le hash du token est stocké dans `activation_tokens`
- Un email est envoyé à l'admin avec le lien d'activation

### 2. Email Admin
L'admin reçoit un email contenant :
- Nom de l'utilisateur
- Email de l'utilisateur
- Date d'inscription
- Bouton "Valider l'inscription" avec le token dans l'URL

### 3. Validation Admin
- L'admin clique sur le lien
- Le système vérifie le token (hash, expiration, usage unique)
- Si valide : active le compte et redirige vers `/admin/activation-success`
- Si invalide : redirige vers `/admin/activation-error` avec message d'erreur

### 4. Connexion Utilisateur
- Après validation admin, l'utilisateur peut se connecter
- Un email de vérification est envoyé à chaque connexion
- Après 2 connexions, la session expire automatiquement

## Tests à Effectuer

### Test A : Token Valide
1. Inscrivez un nouvel utilisateur
2. Vérifiez que l'email admin est reçu
3. Cliquez sur "Valider l'inscription"
4. Vérifiez la redirection vers `/admin/activation-success`
5. Vérifiez que le compte est activé dans la base de données

### Test B : Token Déjà Utilisé
1. Utilisez le même lien d'activation une deuxième fois
2. Vérifiez la redirection vers `/admin/activation-error?message=Token%20invalide%20ou%20expir%C3%A9`

### Test C : Token Expiré
1. Créez un token avec une expiration passée (modifiez `expires_at` en base)
2. Essayez d'utiliser le lien
3. Vérifiez la redirection vers `/admin/activation-error?message=Token%20invalide%20ou%20expir%C3%A9`

### Test D : Token Manquant
1. Accédez à `/api/admin/validate-user?action=approve` (sans token)
2. Vérifiez la redirection vers `/admin/activation-error?message=Token%20manquant`

## Variables d'Environnement Requises

Assurez-vous que ces variables sont configurées dans Vercel :

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=studyai.notifications@gmail.com
SMTP_PASSWORD=mitp vtmj izrr eegp

# Admin Configuration
ADMIN_EMAIL=elliothuet2@gmail.com

# Application URL
NEXT_PUBLIC_APP_URL=https://votre-domaine.vercel.app
```

## Sécurité

- Les tokens sont hachés avec bcrypt (10 rounds)
- Expiration automatique après 24h
- Usage unique (marqué comme `used` après validation)
- RLS activé (seul le service role peut accéder)
- Logs structurés pour audit

## Dépannage

### Erreur : "Could not find the table"
→ Le script SQL n'a pas été exécuté. Suivez l'Étape 1 ci-dessus.

### Erreur : "Token invalide ou expiré"
→ Le token a déjà été utilisé ou a expiré. Demandez une nouvelle inscription.

### Erreur : "Utilisateur introuvable"
→ Le profil utilisateur n'existe pas. Vérifiez que l'inscription s'est bien déroulée.

### Email non reçu
→ Vérifiez les variables SMTP et les logs serveur avec `console.log("[v0] ...")`
