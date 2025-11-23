"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { BookOpen, ArrowLeft, Sparkles, Zap, Brain, Clock, Star, Rocket } from "lucide-react"
import Link from "next/link"

export default function BookSummariesClient() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-background to-indigo-950">
      <header className="border-b border-border/40 glass sticky top-0 z-50 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <Button variant="ghost" size="icon" className="group-hover:scale-110 transition-all duration-300">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl p-2.5 shadow-lg">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Résumés de Livres</h1>
            </div>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-16">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-500/20 to-indigo-500/20 border border-violet-500/30 text-violet-300 text-sm font-medium">
              <Rocket className="h-4 w-4" />
              Bientôt disponible
            </div>
            <h2 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Une révolution arrive
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Préparez-vous à découvrir une façon totalement nouvelle de lire et comprendre les livres
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 bg-gradient-to-br from-violet-500/10 to-transparent border-violet-500/20 hover:border-violet-500/40 transition-all">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-violet-400" />
                </div>
                <h3 className="text-xl font-bold">Résumés Instantanés</h3>
                <p className="text-muted-foreground">
                  Obtenez l'essentiel de n'importe quel livre en quelques minutes grâce à l'IA
                </p>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-indigo-500/10 to-transparent border-indigo-500/20 hover:border-indigo-500/40 transition-all">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                  <Brain className="h-6 w-6 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold">Compréhension Profonde</h3>
                <p className="text-muted-foreground">
                  Des analyses détaillées des thèmes, personnages et messages clés
                </p>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20 hover:border-purple-500/40 transition-all">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold">Gagnez du Temps</h3>
                <p className="text-muted-foreground">Lisez 10 livres en une semaine avec nos résumés intelligents</p>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-pink-500/10 to-transparent border-pink-500/20 hover:border-pink-500/40 transition-all">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center">
                  <Star className="h-6 w-6 text-pink-400" />
                </div>
                <h3 className="text-xl font-bold">Citations Mémorables</h3>
                <p className="text-muted-foreground">Découvrez et sauvegardez les passages les plus marquants</p>
              </div>
            </Card>
          </div>

          {/* Coming Soon Card */}
          <Card className="p-12 text-center space-y-6 bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-indigo-500/5 border-2 border-dashed border-violet-500/30">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center mx-auto">
              <Sparkles className="h-12 w-12 text-violet-400 animate-pulse" />
            </div>

            <div className="space-y-3">
              <h3 className="text-3xl font-bold">En Développement Actif</h3>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                Notre équipe travaille jour et nuit pour vous offrir la meilleure expérience de lecture possible. Cette
                fonctionnalité sera bientôt disponible !
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/">
                <Button size="lg" variant="outline" className="gap-2 bg-transparent">
                  <ArrowLeft className="h-4 w-4" />
                  Retour à l'accueil
                </Button>
              </Link>
              <Button
                size="lg"
                className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
              >
                <Star className="h-4 w-4" />
                Être notifié du lancement
              </Button>
            </div>
          </Card>

          {/* Timeline */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-center">Feuille de Route</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-green-400 font-bold">✓</span>
                </div>
                <div>
                  <p className="font-medium">Phase 1 : Conception et Design</p>
                  <p className="text-sm text-muted-foreground">Terminé</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-4 w-4 text-yellow-400 animate-pulse" />
                </div>
                <div>
                  <p className="font-medium">Phase 2 : Développement de l'IA</p>
                  <p className="text-sm text-muted-foreground">En cours</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border border-border">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <span className="text-muted-foreground font-bold">3</span>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Phase 3 : Tests et Optimisation</p>
                  <p className="text-sm text-muted-foreground">À venir</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border border-border">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <Rocket className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Phase 4 : Lancement Public</p>
                  <p className="text-sm text-muted-foreground">Bientôt</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
