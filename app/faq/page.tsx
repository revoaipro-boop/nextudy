import { Metadata } from 'next'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageSquare } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'FAQ - Questions fréquentes | Nextudy',
  description: 'Trouvez les réponses à vos questions sur Nextudy',
}

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Questions fréquentes
            </h1>
            <p className="text-lg text-muted-foreground">
              Trouvez rapidement les réponses à vos questions
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                Qu'est-ce que Nextudy ?
              </AccordionTrigger>
              <AccordionContent>
                Nextudy est une plateforme d'apprentissage intelligente qui utilise l'intelligence artificielle pour vous aider à étudier plus efficacement. Nous transformons vos cours en résumés, flashcards et QCM automatiquement.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                Comment fonctionne la génération de résumés ?
              </AccordionTrigger>
              <AccordionContent>
                Notre IA analyse votre document (PDF, texte, etc.) et extrait automatiquement les informations clés pour créer un résumé structuré et pertinent. Le processus prend quelques secondes seulement.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                Puis-je utiliser Nextudy gratuitement ?
              </AccordionTrigger>
              <AccordionContent>
                Oui ! Notre plan gratuit vous permet de créer 5 résumés, 10 flashcards et 5 QCM par mois. C'est idéal pour tester la plateforme. Pour un usage illimité, passez à Premium.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                Quels sont les avantages du plan Premium ?
              </AccordionTrigger>
              <AccordionContent>
                Le plan Premium vous donne accès à des résumés, flashcards et QCM illimités, un chat IA sans limite, des statistiques avancées, l'export PDF et un support prioritaire. Le tout pour seulement 9,99€/mois.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                Puis-je annuler mon abonnement à tout moment ?
              </AccordionTrigger>
              <AccordionContent>
                Oui, vous pouvez annuler votre abonnement Premium à tout moment depuis votre tableau de bord. Vous conserverez l'accès Premium jusqu'à la fin de votre période de facturation en cours.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                Mes données sont-elles sécurisées ?
              </AccordionTrigger>
              <AccordionContent>
                Absolument. Nous utilisons un chiffrement de bout en bout et suivons les meilleures pratiques de sécurité. Vos documents et données personnelles sont stockés de manière sécurisée et ne sont jamais partagés avec des tiers.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                Quels formats de fichiers sont supportés ?
              </AccordionTrigger>
              <AccordionContent>
                Nous supportons les PDF, documents Word, fichiers texte et vous pouvez également coller directement du texte. Nous travaillons sur l'ajout de nouveaux formats.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                Comment fonctionne le chat IA ?
              </AccordionTrigger>
              <AccordionContent>
                Le chat IA est votre assistant d'apprentissage personnel. Posez-lui des questions sur vos cours, demandez des explications ou des exemples. Il est disponible 24/7 pour vous aider.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-9" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                Y a-t-il une application mobile ?
              </AccordionTrigger>
              <AccordionContent>
                Notre site est entièrement responsive et fonctionne parfaitement sur mobile. Une application native iOS et Android est en cours de développement et sera disponible prochainement.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-10" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                Comment contacter le support ?
              </AccordionTrigger>
              <AccordionContent>
                Vous pouvez nous contacter via la page Contact ou directement par email à support@nextudy.fr. Les utilisateurs Premium bénéficient d'un support prioritaire.
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Card className="mt-12">
            <CardHeader className="text-center">
              <CardTitle>Vous ne trouvez pas votre réponse ?</CardTitle>
              <CardDescription>
                Notre équipe est là pour vous aider
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild>
                <Link href="/contact">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Contactez-nous
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
