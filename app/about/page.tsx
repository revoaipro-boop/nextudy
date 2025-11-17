import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Target, Users, Zap, Heart, Award, Lightbulb, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'À propos - Nextudy',
  description: 'Découvrez l\'histoire et la mission de Nextudy, la plateforme d\'apprentissage intelligente propulsée par l\'IA',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="container relative mx-auto px-4 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">
              Notre mission
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-balance">
              Révolutionner l'apprentissage avec l'intelligence artificielle
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground text-balance">
              Nous aidons des milliers d'étudiants à réussir leurs études en leur donnant accès 
              aux outils d'apprentissage les plus avancés.
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Notre histoire</h2>
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                Nextudy est né d'une observation simple : les étudiants passent trop de temps à créer 
                des résumés et des fiches de révision, au lieu de se concentrer sur l'apprentissage 
                et la compréhension.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                En 2024, nous avons lancé Nextudy avec une mission claire : utiliser l'intelligence 
                artificielle pour automatiser les tâches répétitives de l'apprentissage et permettre 
                aux étudiants de se concentrer sur ce qui compte vraiment.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Aujourd'hui, plus de 10 000 étudiants utilisent Nextudy pour réussir leurs études. 
                Nous continuons d'innover et d'améliorer notre plateforme chaque jour.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Nos valeurs</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Les principes qui guident notre travail au quotidien
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Excellence</CardTitle>
                <CardDescription>
                  Nous visons l'excellence dans tout ce que nous faisons, de la qualité de notre IA 
                  à l'expérience utilisateur.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Lightbulb className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Innovation</CardTitle>
                <CardDescription>
                  Nous restons à la pointe de la technologie pour offrir les meilleurs outils 
                  d'apprentissage à nos utilisateurs.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Accessibilité</CardTitle>
                <CardDescription>
                  Nous croyons que l'éducation de qualité doit être accessible à tous, 
                  c'est pourquoi nous proposons un plan gratuit généreux.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">L'équipe Nextudy</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Une équipe passionnée dédiée à votre réussite
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                  JD
                </div>
                <CardTitle>Jean Dupont</CardTitle>
                <CardDescription>Fondateur & CEO</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center">
                  Ancien étudiant, Jean a créé Nextudy après avoir passé trop de nuits 
                  à faire des fiches de révision.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                  SM
                </div>
                <CardTitle>Sophie Martin</CardTitle>
                <CardDescription>CTO</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center">
                  Experte en IA, Sophie développe les algorithmes qui rendent 
                  Nextudy si puissant et précis.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                  ML
                </div>
                <CardTitle>Marc Leclerc</CardTitle>
                <CardDescription>Head of Product</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center">
                  Marc s'assure que chaque fonctionnalité est intuitive et 
                  répond aux besoins réels des étudiants.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center max-w-4xl mx-auto">
            <div>
              <div className="flex items-center justify-center mb-2">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div className="text-3xl md:text-4xl font-bold mb-1">10K+</div>
              <div className="text-sm text-muted-foreground">Étudiants actifs</div>
            </div>

            <div>
              <div className="flex items-center justify-center mb-2">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <div className="text-3xl md:text-4xl font-bold mb-1">50K+</div>
              <div className="text-sm text-muted-foreground">Résumés créés</div>
            </div>

            <div>
              <div className="flex items-center justify-center mb-2">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <div className="text-3xl md:text-4xl font-bold mb-1">4.9/5</div>
              <div className="text-sm text-muted-foreground">Note moyenne</div>
            </div>

            <div>
              <div className="flex items-center justify-center mb-2">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <div className="text-3xl md:text-4xl font-bold mb-1">98%</div>
              <div className="text-sm text-muted-foreground">Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="max-w-3xl mx-auto border-2 border-primary/20">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl md:text-4xl mb-4 text-balance">
                Prêt à rejoindre l'aventure ?
              </CardTitle>
              <CardDescription className="text-lg">
                Rejoignez des milliers d'étudiants qui ont déjà transformé leur façon d'apprendre
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" asChild>
                <Link href="/auth/sign-up">
                  Commencer gratuitement
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
                Aucune carte bancaire requise
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
