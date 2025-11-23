# 📋 Flux d'inscription - Documentation

## ✅ Comportement actuel (conforme aux spécifications)

### 1️⃣ Inscription utilisateur

Lorsqu'un utilisateur remplit le formulaire d'inscription :

1. **Aucun e-mail n'est envoyé à l'utilisateur** ✓
2. **Un e-mail est envoyé uniquement à l'administrateur** ✓
3. **L'utilisateur reste inactif jusqu'à validation manuelle** ✓

### 📧 E-mail envoyé à l'administrateur

**Destinataire :** `ADMIN_EMAIL` (elliothuet2@gmail.com)  
**Expéditeur :** Votre adresse Gmail configurée dans `SMTP_USER`  
**Sujet :** "Nouvelle inscription sur le site"

**Contenu :**
\`\`\`
Nouvelle inscription sur le site.

Nom de l'utilisateur : [nom_affichage]
E-mail de l'utilisateur : [email_utilisateur]
Identifiant (UUID) : [uuid]
Date : [date_heure_complète]
\`\`\`

### 🔧 Variables d'environnement utilisées

- `SMTP_HOST` : Serveur SMTP (smtp.gmail.com)
- `SMTP_PORT` : Port SMTP (587)
- `SMTP_USER` : Votre adresse Gmail
- `SMTP_PASSWORD` : Mot de passe d'application Gmail
- `ADMIN_EMAIL` : Adresse e-mail de l'administrateur (elliothuet2@gmail.com)
- `NEXT_PUBLIC_APP_URL` : URL de l'application pour générer les liens

### 📁 Fichiers impliqués

1. **`app/auth/sign-up/page.tsx`**
   - Formulaire d'inscription
   - Crée le compte utilisateur
   - Appelle l'API `/api/auth/notify-admin`
   - N'envoie JAMAIS d'e-mail à l'utilisateur

2. **`app/api/auth/notify-admin/route.ts`**
   - API endpoint pour notifier l'admin
   - Valide les données reçues
   - Appelle `sendAdminNotification()`

3. **`lib/email.tsx`**
   - Service d'envoi d'e-mails via Gmail SMTP
   - `sendAdminNotification()` : envoie uniquement à ADMIN_EMAIL
   - Logs détaillés avec préfixe `[v0]`

### 🧪 Comment tester

1. Aller sur `/auth/sign-up`
2. Remplir le formulaire :
   - Nom d'affichage
   - E-mail
   - Mot de passe
   - Confirmation du mot de passe
3. Cliquer sur "S'inscrire"
4. Vérifier que :
   - ✅ Message "Notification envoyée à l'administrateur" s'affiche
   - ✅ L'utilisateur ne reçoit AUCUN e-mail
   - ✅ L'administrateur (elliothuet2@gmail.com) reçoit l'e-mail de notification
   - ✅ L'e-mail contient : nom, e-mail, UUID, date

### 🔍 Logs de débogage

Tous les logs utilisent le préfixe `[v0]` pour faciliter le diagnostic :

\`\`\`
[v0] Starting sign up process
[v0] User created successfully
[v0] Sending admin notification...
[v0] sendAdminNotification called
[v0] Sending email via Gmail SMTP...
[v0] ✅ Email sent successfully!
\`\`\`

### ⚠️ Points importants

- **Aucune exception** : L'inscription ne déclenche JAMAIS d'e-mail à l'utilisateur
- **Validation manuelle** : L'administrateur doit valider chaque inscription
- **Gmail SMTP** : Utilise votre compte Gmail pour envoyer les e-mails
- **Sécurité** : Les comptes restent inactifs jusqu'à validation admin

### 🔄 Configuration Gmail

Pour utiliser Gmail SMTP :
1. Activer l'authentification à 2 facteurs sur votre compte Google
2. Générer un mot de passe d'application
3. Configurer les variables SMTP dans votre environnement

---

**Status :** ✅ Implémentation conforme aux spécifications  
**Dernière mise à jour :** 2025-01-26
