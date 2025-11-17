import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Conditions d\'utilisation - Nextudy',
  description: 'Conditions générales d\'utilisation de la plateforme Nextudy',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto prose prose-slate dark:prose-invert">
          <h1>Conditions d'utilisation</h1>
          <p className="lead">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>

          <h2>1. Acceptation des conditions</h2>
          <p>
            En accédant et en utilisant Nextudy, vous acceptez d'être lié par ces conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.
          </p>

          <h2>2. Description du service</h2>
          <p>
            Nextudy est une plateforme d'apprentissage qui utilise l'intelligence artificielle pour aider les étudiants à créer des résumés, flashcards, QCM et à interagir avec un assistant IA.
          </p>

          <h2>3. Compte utilisateur</h2>
          <h3>3.1 Création de compte</h3>
          <ul>
            <li>Vous devez fournir des informations exactes et à jour</li>
            <li>Vous êtes responsable de la sécurité de votre compte</li>
            <li>Vous devez avoir au moins 13 ans pour créer un compte</li>
          </ul>

          <h3>3.2 Responsabilités</h3>
          <p>Vous vous engagez à :</p>
          <ul>
            <li>Ne pas partager votre compte avec d'autres personnes</li>
            <li>Notifier immédiatement toute utilisation non autorisée</li>
            <li>Utiliser le service de manière légale et éthique</li>
          </ul>

          <h2>4. Utilisation du service</h2>
          <h3>4.1 Utilisations autorisées</h3>
          <p>Vous pouvez utiliser Nextudy pour :</p>
          <ul>
            <li>Créer des supports d'apprentissage personnels</li>
            <li>Réviser et étudier vos cours</li>
            <li>Améliorer votre compréhension des sujets académiques</li>
          </ul>

          <h3>4.2 Utilisations interdites</h3>
          <p>Vous ne pouvez pas :</p>
          <ul>
            <li>Télécharger du contenu protégé par des droits d'auteur sans autorisation</li>
            <li>Utiliser le service pour générer du contenu illégal ou offensant</li>
            <li>Tenter de contourner les limitations du service</li>
            <li>Revendre ou redistribuer le service</li>
            <li>Utiliser des bots ou scripts automatisés</li>
          </ul>

          <h2>5. Contenu utilisateur</h2>
          <h3>5.1 Propriété</h3>
          <p>
            Vous conservez tous les droits sur le contenu que vous téléchargez. En utilisant notre service, vous nous accordez une licence pour traiter ce contenu afin de fournir nos services.
          </p>

          <h3>5.2 Responsabilité</h3>
          <p>
            Vous êtes seul responsable du contenu que vous téléchargez et de son utilisation. Nous nous réservons le droit de supprimer tout contenu inapproprié.
          </p>

          <h2>6. Abonnements et paiements</h2>
          <h3>6.1 Plans</h3>
          <ul>
            <li>Plan Gratuit : Fonctionnalités limitées</li>
            <li>Plan Premium : Fonctionnalités illimitées</li>
          </ul>

          <h3>6.2 Facturation</h3>
          <ul>
            <li>Les abonnements sont facturés mensuellement ou annuellement</li>
            <li>Les paiements sont traités de manière sécurisée par Stripe</li>
            <li>Vous pouvez annuler à tout moment</li>
            <li>Aucun remboursement pour les périodes non utilisées</li>
          </ul>

          <h2>7. Propriété intellectuelle</h2>
          <p>
            Tout le contenu de la plateforme (textes, graphiques, logos, code) est protégé par des droits d'auteur et autres droits de propriété intellectuelle appartenant à Nextudy.
          </p>

          <h2>8. Limitation de responsabilité</h2>
          <p>
            Nextudy est fourni "tel quel". Nous ne garantissons pas que le service sera ininterrompu ou exempt d'erreurs. Nous ne sommes pas responsables des dommages indirects ou consécutifs.
          </p>

          <h2>9. Résiliation</h2>
          <p>
            Nous pouvons suspendre ou résilier votre compte si vous violez ces conditions. Vous pouvez supprimer votre compte à tout moment depuis vos paramètres.
          </p>

          <h2>10. Modifications</h2>
          <p>
            Nous nous réservons le droit de modifier ces conditions à tout moment. Les changements importants vous seront notifiés.
          </p>

          <h2>11. Droit applicable</h2>
          <p>
            Ces conditions sont régies par le droit français. Tout litige sera soumis aux tribunaux compétents de Paris.
          </p>

          <h2>12. Contact</h2>
          <p>
            Pour toute question concernant ces conditions, contactez-nous à : legal@nextudy.fr
          </p>
        </div>
      </div>
    </div>
  )
}
