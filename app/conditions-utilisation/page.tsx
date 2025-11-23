import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ConditionsUtilisationPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl">
        <Link href="/auth/sign-up">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à l'inscription
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Conditions d'Utilisation de Nextudy</CardTitle>
            <p className="text-sm text-muted-foreground">Date de mise à jour : 11 novembre 2025</p>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <p>
              Bienvenue sur Nextudy. En accédant à notre site et en utilisant nos services, vous acceptez les présentes
              conditions d'utilisation. Si vous n'acceptez pas ces conditions, vous n'êtes pas autorisé à utiliser le
              site ou ses services.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3">1. Définition des termes</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Nextudy :</strong> le site internet et les services fournis par HUET Elliot et GIRARD Nathan
              </li>
              <li>
                <strong>Utilisateur :</strong> toute personne qui accède au site ou utilise ses services.
              </li>
              <li>
                <strong>Contenu :</strong> fichiers, textes, images, audio ou autres documents importés ou générés sur
                le site.
              </li>
              <li>
                <strong>Administrateur :</strong> la personne qui valide l'accès des utilisateurs au site (en
                l'occurrence, l'administrateur principal, c'est-à-dire Elliot HUET et Nathan GIRARD).
              </li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-3">2. Accès au site</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>L'accès au site est payant (5 €). L'inscription est validée uniquement par l'administrateur.</li>
              <li>Le paiement se fait en espèces. Aucun paiement en ligne n'est accepté.</li>
              <li>
                Le site peut refuser ou suspendre l'accès à tout utilisateur à la discrétion de l'administrateur, sans
                obligation de justification.
              </li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-3">3. Utilisation des services</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>L'utilisateur s'engage à utiliser Nextudy uniquement à des fins personnelles et éducatives.</li>
              <li>
                Il est interdit de :
                <ul className="list-circle pl-6 mt-2 space-y-1">
                  <li>Copier, distribuer ou revendre le site ou ses fonctionnalités.</li>
                  <li>Tenter d'accéder au site ou aux contenus d'autres utilisateurs sans autorisation.</li>
                  <li>
                    Télécharger ou partager du contenu illégal, offensant ou protégé par des droits d'auteur sans
                    permission.
                  </li>
                </ul>
              </li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-3">4. Propriété intellectuelle</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Tous les contenus, outils, graphiques, textes, fonctionnalités, algorithmes et logiciels de Nextudy sont
                la propriété exclusive de Nextudy ou de ses partenaires.
              </li>
              <li>
                L'utilisateur conserve les droits sur ses propres documents importés, mais autorise Nextudy à les
                traiter pour générer les QCM, flashcards et autres fonctionnalités.
              </li>
              <li>Toute reproduction ou utilisation non autorisée des contenus de Nextudy est interdite.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-3">5. Paiement et accès</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                L'accès aux fonctionnalités est conditionné au paiement de 5 € en espèces. L'utilisateur doit contacter
                l'administrateur pour organiser le paiement.
              </li>
              <li>Une fois le paiement effectué, l'administrateur validera l'accès à l'utilisateur.</li>
              <li>Aucun remboursement ne sera effectué après validation de l'accès.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-3">6. Confidentialité et protection des données</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Nextudy s'engage à protéger les données personnelles de l'utilisateur conformément au RGPD (Règlement
                Général sur la Protection des Données).
              </li>
              <li>Les données collectées incluent l'adresse e-mail et les fichiers importés par l'utilisateur.</li>
              <li>Les données ne seront jamais vendues ou partagées avec des tiers sans consentement explicite.</li>
              <li>L'utilisateur peut demander la suppression de ses données à tout moment en contactant Nextudy.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-3">7. Utilisation de l'intelligence artificielle</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Nextudy utilise l'intelligence artificielle (Groq API, Whisper pour la transcription audio, GPT pour les
                résumés, etc.) pour analyser et traiter les contenus des utilisateurs.
              </li>
              <li>
                L'utilisateur comprend et accepte que les résultats générés par l'IA peuvent contenir des erreurs.
              </li>
              <li>
                L'utilisateur est responsable de vérifier l'exactitude des contenus générés avant de les utiliser dans
                des contextes éducatifs ou professionnels.
              </li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-3">8. Limitation de responsabilité</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Nextudy ne garantit pas l'exactitude, la complétude ou la fiabilité des contenus générés par le site.
              </li>
              <li>L'utilisateur utilise le site à ses propres risques.</li>
              <li>
                Nextudy ne pourra être tenu responsable de toute perte de données, résultats académiques, ou dommages
                directs ou indirects résultant de l'utilisation du site.
              </li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-3">9. Résiliation du compte</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>L'utilisateur peut demander la suppression de son compte à tout moment en contactant Nextudy.</li>
              <li>
                Nextudy se réserve le droit de suspendre ou de supprimer un compte en cas de violation des présentes
                conditions d'utilisation.
              </li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-3">10. Modifications des conditions</h2>
            <p>
              Nextudy se réserve le droit de modifier ces conditions d'utilisation à tout moment. Les utilisateurs
              seront informés des modifications via e-mail ou notification sur le site. L'utilisation continue du site
              après modification vaut acceptation des nouvelles conditions.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3">11. Loi applicable et juridiction</h2>
            <p>
              Les présentes conditions sont régies par le droit français. Tout litige relatif à l'utilisation du site
              sera soumis à la juridiction des tribunaux compétents en France.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3">12. Contact</h2>
            <p>
              Pour toute question relative à ces conditions, vous pouvez nous contacter sur Instagram :{" "}
              <a
                href="https://www.instagram.com/nextudy_pro/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                @nextudy_pro
              </a>
            </p>

            <div className="mt-8 p-4 bg-muted rounded-lg">
              <p className="text-sm">
                En créant un compte sur Nextudy, vous reconnaissez avoir lu, compris et accepté les présentes conditions
                d'utilisation.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
