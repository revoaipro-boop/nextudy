# Configuration SMTP pour l'envoi d'e-mails

## Vue d'ensemble

Le système d'authentification utilise **SMTP via Gmail** pour envoyer tous les e-mails. Aucun service tiers comme Resend n'est utilisé.

## Variables d'environnement requises

Ajoutez ces variables à votre projet Vercel ou fichier `.env.local` :

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=studyai.notifications@gmail.com
SMTP_PASSWORD=mitp vtmj izrr eegp
ADMIN_EMAIL=elliothuet2@gmail.com
NEXT_PUBLIC_APP_URL=https://votre-domaine.vercel.app
```

## Flux d'inscription

### 1. Utilisateur s'inscrit
- L'utilisateur remplit le formulaire d'inscription (email, mot de passe, nom d'affichage)
- Le compte est créé avec le statut `verification_status = 'pending'`
- **AUCUN e-mail n'est envoyé à l'utilisateur**

### 2. Notification à l'administrateur
- Un e-mail est envoyé **uniquement à ADMIN_EMAIL** (elliothuet2@gmail.com)
- Contenu de l'e-mail :
  - E-mail de l'utilisateur
  - Date et heure d'inscription
  - Nom d'affichage
  - UUID de l'utilisateur
  - Bouton "Valider l'inscription"
  - Bouton "Rejeter"

### 3. Validation par l'administrateur
- L'admin clique sur "Valider l'inscription"
- Le statut de l'utilisateur passe à `verification_status = 'approved'`
- L'utilisateur peut maintenant se connecter

## Flux de connexion

### 1. Utilisateur tente de se connecter
- L'utilisateur entre son email
- Un e-mail de vérification est envoyé **à l'adresse e-mail de l'utilisateur**
- L'e-mail contient un lien magique (magic link) valide pendant 15 minutes

### 2. Vérification et connexion
- L'utilisateur clique sur le lien dans l'e-mail
- Il est automatiquement connecté
- Le compteur de connexions (`login_count`) est incrémenté

### 3. Expiration après 2 connexions
- Après 2 connexions réussies, la session expire automatiquement
- L'utilisateur doit se reconnecter via un nouvel e-mail de vérification

## Configuration SMTP

### Gmail App Password
Le mot de passe utilisé (`mitp vtmj izrr eegp`) est un **App Password** Gmail, pas le mot de passe du compte.

Pour créer un App Password :
1. Allez dans votre compte Google
2. Sécurité → Validation en deux étapes (activez-la si nécessaire)
3. App Passwords → Créez un nouveau mot de passe pour "Mail"
4. Utilisez ce mot de passe dans `SMTP_PASSWORD`

### Paramètres SMTP
- **Host** : smtp.gmail.com
- **Port** : 587 (STARTTLS)
- **Secure** : false (utilise STARTTLS)
- **Auth** : user + password

## Sécurité

### Aucun e-mail de test
- Tous les e-mails sont des envois réels via SMTP
- Pas de mode test ou sandbox
- Les e-mails arrivent directement dans les boîtes de réception

### Protection des données
- Les mots de passe utilisateurs sont hashés par Supabase
- Les e-mails ne contiennent jamais de mots de passe
- Les liens de vérification expirent après 15 minutes
- Les comptes restent inactifs jusqu'à validation admin

## Dépannage

### L'e-mail n'arrive pas à l'admin
1. Vérifiez que `ADMIN_EMAIL` est correctement configuré
2. Vérifiez les logs serveur pour voir les erreurs SMTP
3. Vérifiez le dossier spam de l'admin

### L'e-mail de vérification n'arrive pas à l'utilisateur
1. Vérifiez que l'utilisateur a été validé par l'admin (`verification_status = 'approved'`)
2. Vérifiez les logs serveur pour les erreurs SMTP
3. Demandez à l'utilisateur de vérifier son dossier spam

### Erreur SMTP "Invalid login"
1. Vérifiez que vous utilisez un App Password, pas le mot de passe du compte
2. Vérifiez que la validation en deux étapes est activée sur le compte Gmail
3. Vérifiez que `SMTP_USER` et `SMTP_PASSWORD` sont corrects

### Erreur "Connection timeout"
1. Vérifiez que le port 587 n'est pas bloqué par un firewall
2. Vérifiez que `SMTP_HOST` est correct (smtp.gmail.com)
3. Essayez avec le port 465 (SSL) si 587 ne fonctionne pas

## Logs de débogage

Le système utilise des logs préfixés `[v0]` pour faciliter le débogage :

```
[v0] Initializing email module with SMTP...
[v0] SMTP_HOST: smtp.gmail.com
[v0] SMTP_PORT: 587
[v0] SMTP_USER: studyai.notifications@gmail.com
[v0] Creating SMTP transporter...
[v0] ✓ SMTP transporter created successfully
[v0] Sending email via SMTP...
[v0] ✅ Email sent successfully via SMTP!
[v0] Message ID: <...>
```

Consultez les logs serveur pour diagnostiquer les problèmes d'envoi d'e-mails.
