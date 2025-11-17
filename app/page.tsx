import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Brain, Zap, FileText, MessageSquare, Target, Clock, TrendingUp, CheckCircle2, ArrowRight, Star } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Nextudy - Réussissez vos études avec l\'IA',
  description: 'Plateforme d\'apprentissage intelligente propulsée par l\'IA. Créez des résumés, flashcards, QCM et discutez avec votre assistant IA personnel.',
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="container relative mx-auto px-4 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">
              <Sparkles className="h-3 w-3 mr-1" />
              Nouveau : IA de génération avancée
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-balance">
              Réussissez vos études avec l'intelligence artificielle
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-balance">
              Transformez vos cours en résumés, flashcards et QCM en quelques secondes. 
              Nextudy vous aide à apprendre plus vite et mieux.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 bg-white" asChild>
                <Link href="/auth/sign-up">
                  Commencer gratuitement
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/pricing">
                  Voir les tarifs
                </Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Aucune carte bancaire requise · Gratuit pour toujours
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 border-y bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold mb-1">10K+</div>
              <div className="text-sm text-muted-foreground">Étudiants actifs</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">50K+</div>
              <div className="text-sm text-muted-foreground">Résumés générés</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">4.9/5</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Star className="h-4 w-4 fill-primary text-primary" />
                Note moyenne
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">98%</div>
              <div className="text-sm text-muted-foreground">Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4" variant="outline">
              Fonctionnalités
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-balance">
              Tout ce dont vous avez besoin pour réussir
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
              Des outils puissants conçus spécialement pour les étudiants
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Résumés IA</CardTitle>
                <CardDescription>
                  Générez des résumés structurés et pertinents de vos cours en quelques secondes
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Flashcards</CardTitle>
                <CardDescription>
                  Créez automatiquement des flashcards pour mémoriser efficacement
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>QCM Intelligents</CardTitle>
                <CardDescription>
                  Testez vos connaissances avec des QCM générés automatiquement
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Chat IA</CardTitle>
                <CardDescription>
                  Posez vos questions à votre assistant IA personnel 24/7
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Analyse intelligente</CardTitle>
                <CardDescription>
                  Comprenez vos points forts et faibles avec des statistiques avancées
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Mode Pomodoro</CardTitle>
                <CardDescription>
                  Gérez votre temps d'étude efficacement avec le timer intégré
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-balance">
              Comment ça marche ?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
              Trois étapes simples pour transformer votre façon d'étudier
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Importez vos cours</h3>
              <p className="text-muted-foreground">
                Téléchargez vos documents, PDF ou collez votre texte
              </p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">L'IA analyse</h3>
              <p className="text-muted-foreground">
                Notre IA traite votre contenu et génère des supports d'apprentissage
              </p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Apprenez efficacement</h3>
              <p className="text-muted-foreground">
                Révisez avec vos résumés, flashcards et testez-vous
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-balance">
              Ce que disent nos utilisateurs
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <CardDescription>
                  "Nextudy a transformé ma façon d'étudier. Je gagne un temps fou et mes notes se sont améliorées !"
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="font-medium">Marie L.</div>
                <div className="text-sm text-muted-foreground">Étudiante en médecine</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <CardDescription>
                  "Les flashcards générées automatiquement sont parfaites. Je révise partout, même dans le métro."
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="font-medium">Thomas R.</div>
                <div className="text-sm text-muted-foreground">Étudiant en droit</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <CardDescription>
                  "Le chat IA m'aide à comprendre les concepts difficiles. C'est comme avoir un prof perso 24/7."
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="font-medium">Sarah K.</div>
                <div className="text-sm text-muted-foreground">Étudiante en ingénierie</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto border-2 border-primary/20">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl md:text-4xl mb-4 text-balance">
                Prêt à révolutionner vos études ?
              </CardTitle>
              <CardDescription className="text-lg">
                Rejoignez des milliers d'étudiants qui ont déjà amélioré leurs résultats
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 bg-foreground" asChild>
                <Link href="/auth/sign-up">
                  Commencer gratuitement
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
                Gratuit pour toujours · Aucune carte bancaire requise
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
