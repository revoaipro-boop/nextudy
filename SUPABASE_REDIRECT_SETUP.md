# Configuration des URLs de redirection Supabase

## Problème

Lorsqu'un utilisateur clique sur le lien magique envoyé par e-mail, Supabase redirige vers votre application avec les tokens d'authentification dans le fragment d'URL (hash) :

\`\`\`
https://v0-remix-of-study-ai-ten.vercel.app/auth/session-handler#access_token=...&refresh_token=...
\`\`\`

Pour que cette redirection fonctionne, vous **DEVEZ** configurer l'URL de redirection dans les paramètres Supabase.

## Solution

### 1. Configurer les variables d'environnement

Assurez-vous que la variable `NEXT_PUBLIC_APP_URL` est définie dans vos variables d'environnement Vercel :

\`\`\`bash
NEXT_PUBLIC_APP_URL=https://v0-remix-of-study-ai-ten.vercel.app
\`\`\`

**Important :** Cette variable doit être définie **sans** le slash final.

### 2. Configurer Supabase Dashboard

1. Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans **Authentication** → **URL Configuration**
4. Ajoutez les URLs suivantes dans **Redirect URLs** :

\`\`\`
https://v0-remix-of-study-ai-ten.vercel.app/auth/session-handler
https://v0-remix-of-study-ai-ten.vercel.app/
\`\`\`

5. Ajoutez également l'URL de développement si nécessaire :

\`\`\`
http://localhost:3000/auth/session-handler
http://localhost:3000/
\`\`\`

6. Cliquez sur **Save**

### 3. Vérifier la configuration

Pour vérifier que tout fonctionne :

1. Demandez un lien de connexion depuis `/auth/login`
2. Cliquez sur le lien dans l'e-mail
3. Vous devriez être redirigé vers `/auth/session-handler` avec les tokens dans l'URL
4. La page devrait afficher "Connexion en cours..." puis vous rediriger vers la page d'accueil

### 4. Débogage

Si vous voyez l'erreur "Aucun token de session trouvé dans l'URL" :

1. **Vérifiez les logs de la console** - Ouvrez les DevTools (F12) et regardez les messages `[v0]`
2. **Vérifiez l'URL** - L'URL doit contenir `#access_token=...` après `/auth/session-handler`
3. **Vérifiez Supabase** - Assurez-vous que l'URL est bien configurée dans les Redirect URLs
4. **Vérifiez la variable d'environnement** - `NEXT_PUBLIC_APP_URL` doit correspondre exactement à votre domaine de production

### 5. Erreurs courantes

#### "Redirect URL not allowed"

Cela signifie que l'URL n'est pas configurée dans Supabase. Ajoutez-la dans **Authentication** → **URL Configuration** → **Redirect URLs**.

#### "No tokens found in URL"

Cela signifie que Supabase a redirigé vers une URL différente de celle attendue. Vérifiez :
- Que `NEXT_PUBLIC_APP_URL` est correctement définie
- Que l'URL dans Supabase correspond exactement (pas de slash final)
- Que vous utilisez le lien le plus récent (les anciens liens peuvent avoir une ancienne URL de redirection)

#### "Invalid session"

Le lien a peut-être expiré (15 minutes). Demandez un nouveau lien de connexion.

## Flux complet

Voici le flux complet de l'authentification par lien magique :

1. **Utilisateur demande un lien** → `/auth/login` (formulaire)
2. **Serveur envoie un e-mail** → avec un lien vers `/auth/verify-login?token=...`
3. **Utilisateur clique sur le lien** → `/auth/verify-login?token=...`
4. **Serveur vérifie le token** → génère un lien magique Supabase
5. **Serveur redirige** → vers le lien magique Supabase
6. **Supabase traite le lien** → redirige vers `/auth/session-handler#access_token=...&refresh_token=...`
7. **Page session-handler** → extrait les tokens du hash, crée la session
8. **Redirection finale** → vers la page d'accueil, utilisateur connecté

## Support

Si vous rencontrez toujours des problèmes après avoir suivi ces étapes, vérifiez les logs de la console (messages `[v0]`) et contactez le support.
\`\`\`

```typescript file="" isHidden
