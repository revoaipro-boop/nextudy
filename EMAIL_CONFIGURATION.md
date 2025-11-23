# Configuration des E-mails

## Service d'envoi : Gmail SMTP

Le système utilise maintenant **Gmail SMTP** pour l'envoi d'e-mails. Aucun service tiers comme Resend n'est utilisé.

### Configuration SMTP
- **Serveur SMTP** : `smtp.gmail.com`
- **Port** : `587` (STARTTLS)
- **Authentification** : Mot de passe d'application Gmail

### Configuration requise

Pour que les e-mails soient correctement envoyés, vous devez :

1. **Activer l'authentification à 2 facteurs** sur votre compte Google
2. **Générer un mot de passe d'application** :
   - Allez dans les paramètres de votre compte Google
   - Sécurité → Validation en deux étapes → Mots de passe des applications
   - Générez un nouveau mot de passe pour "Mail"
   - Copiez ce mot de passe (16 caractères)

3. **Configurer les variables d'environnement** :

\`\`\`env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=votre-mot-de-passe-application
ADMIN_EMAIL=elliothuet2@gmail.com
NEXT_PUBLIC_APP_URL=https://votre-domaine.com
\`\`\`

## Flux d'e-mails

### 1. Inscription
- **Destinataire** : Administrateur uniquement (`elliothuet2@gmail.com`)
- **Contenu** : Nom, e-mail, UUID, date d'inscription
- **Actions** : Boutons "Valider" et "Rejeter"
- **Aucun e-mail envoyé à l'utilisateur**

### 2. Connexion
- **Destinataire** : Utilisateur (son propre e-mail)
- **Contenu** : Lien de vérification magique
- **Validité** : 15 minutes
- **Envoyé uniquement si le compte est validé par l'admin**

## Variables d'environnement

\`\`\`env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=mot-de-passe-application-16-caracteres
ADMIN_EMAIL=elliothuet2@gmail.com
NEXT_PUBLIC_APP_URL=https://votre-domaine.com
\`\`\`

## Test de l'envoi

Pour tester l'envoi d'e-mails :

1. Inscrivez un nouvel utilisateur
2. Vérifiez que l'e-mail arrive à `elliothuet2@gmail.com`
3. Cliquez sur "Valider l'inscription"
4. L'utilisateur peut maintenant se connecter

## Dépannage

Si les e-mails n'arrivent pas :

1. Vérifiez que toutes les variables SMTP sont correctement configurées
2. Vérifiez que le mot de passe d'application Gmail est valide
3. Vérifiez que l'authentification à 2 facteurs est activée sur votre compte Google
4. Consultez les logs dans la console avec `[v0]`
5. Vérifiez les alertes de sécurité dans votre compte Gmail

## Limites Gmail

Gmail SMTP a des limites d'envoi :
- **500 e-mails par jour** pour les comptes Gmail gratuits
- **2000 e-mails par jour** pour Google Workspace

Pour des volumes plus importants, envisagez d'utiliser un service d'envoi d'e-mails dédié.
