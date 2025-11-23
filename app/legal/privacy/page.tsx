import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de confidentialité - Nextudy',
  description: 'Politique de confidentialité et protection des données Nextudy',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto prose prose-slate dark:prose-invert">
          <h1>Politique de confidentialité</h1>
          <p className="lead">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>

          <h2>1. Introduction</h2>
          <p>
            Nextudy ("nous", "notre", "nos") s'engage à protéger votre vie privée. Cette politique de confidentialité explique comment nous collectons, utilisons, partageons et protégeons vos informations personnelles.
          </p>

          <h2>2. Informations que nous collectons</h2>
          <h3>2.1 Informations que vous nous fournissez</h3>
          <ul>
            <li>Nom et adresse email lors de l'inscription</li>
            <li>Informations de paiement (traitées de manière sécurisée par Stripe)</li>
            <li>Documents et contenus que vous téléchargez</li>
            <li>Messages et interactions avec notre support</li>
          </ul>

          <h3>2.2 Informations collectées automatiquement</h3>
          <ul>
            <li>Données de navigation et d'utilisation de la plateforme</li>
            <li>Adresse IP et informations sur l'appareil</li>
            <li>Cookies et technologies similaires</li>
          </ul>

          <h2>3. Utilisation des informations</h2>
          <p>Nous utilisons vos informations pour :</p>
          <ul>
            <li>Fournir et améliorer nos services</li>
            <li>Traiter vos paiements et gérer votre compte</li>
            <li>Vous envoyer des notifications importantes</li>
            <li>Analyser l'utilisation de la plateforme</li>
            <li>Prévenir la fraude et assurer la sécurité</li>
          </ul>

          <h2>4. Partage des informations</h2>
          <p>Nous ne vendons jamais vos données personnelles. Nous partageons vos informations uniquement :</p>
          <ul>
            <li>Avec des prestataires de services (hébergement, paiement, analytics)</li>
            <li>Si la loi l'exige</li>
            <li>Avec votre consentement explicite</li>
          </ul>

          <h2>5. Sécurité des données</h2>
          <p>
            Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées pour protéger vos données contre tout accès non autorisé, perte ou altération.
          </p>

          <h2>6. Vos droits (RGPD)</h2>
          <p>Vous avez le droit de :</p>
          <ul>
            <li>Accéder à vos données personnelles</li>
            <li>Rectifier vos données inexactes</li>
            <li>Supprimer vos données</li>
            <li>Limiter le traitement de vos données</li>
            <li>Vous opposer au traitement</li>
            <li>Demander la portabilité de vos données</li>
          </ul>

          <h2>7. Conservation des données</h2>
          <p>
            Nous conservons vos données aussi longtemps que nécessaire pour fournir nos services ou conformément aux obligations légales.
          </p>

          <h2>8. Cookies</h2>
          <p>
            Nous utilisons des cookies pour améliorer votre expérience. Vous pouvez configurer votre navigateur pour refuser les cookies, mais certaines fonctionnalités peuvent être limitées.
          </p>

          <h2>9. Modifications</h2>
          <p>
            Nous pouvons modifier cette politique de confidentialité. Les changements importants vous seront notifiés par email.
          </p>

          <h2>10. Contact</h2>
          <p>
            Pour toute question concernant cette politique, contactez-nous à : privacy@nextudy.fr
          </p>
        </div>
      </div>
    </div>
  )
}
