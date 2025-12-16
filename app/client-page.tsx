"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { PDFUploader } from "@/components/pdf-uploader"
import { AudioRecorder } from "@/components/audio-recorder"
import { HistoryView } from "@/components/history-view"
import { FocusMode } from "@/components/focus-mode"
import {
  FileText,
  History,
  Timer,
  Brain,
  Zap,
  ArrowRight,
  User,
  ListTodo,
  Menu,
  MessageSquare,
  Printer,
  Clock,
  BookOpen,
  ChevronDown,
  Type,
  Upload,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import Image from "next/image"

export default function ClientPage() {
  const [activeView, setActiveView] = useState<"home" | "history" | "focus">("home")
  const [user, setUser] = useState<any>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const uploadSectionRef = useRef<HTMLElement>(null)
  const audioSectionRef = useRef<HTMLDivElement>(null)
  const featuresScrollRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const initAuth = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()

        if (error) {
          console.warn("[v0] Auth check failed:", error.message)
          return
        }

        setUser(user)

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
          setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
      } catch (error) {
        console.warn("[v0] Auth initialization failed:", error)
      }
    }

    initAuth()
  }, [])

  useEffect(() => {
    // Only run auto-scroll when on home view
    if (activeView !== "home") return

    const scrollContainer = featuresScrollRef.current
    if (!scrollContainer) return

    let animationFrameId: number
    let lastTimestamp = 0
    const scrollSpeed = 0.5 // pixels per frame

    const autoScroll = (timestamp: number) => {
      if (scrollContainer) {
        if (timestamp - lastTimestamp > 16) {
          // ~60fps
          const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth

          if (scrollContainer.scrollLeft >= maxScroll) {
            // Reset to beginning for infinite loop
            scrollContainer.scrollLeft = 0
          } else {
            scrollContainer.scrollLeft += scrollSpeed
          }

          lastTimestamp = timestamp
        }
      }
      animationFrameId = requestAnimationFrame(autoScroll)
    }

    animationFrameId = requestAnimationFrame(autoScroll)

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [activeView])

  const scrollToSection = (ref: React.RefObject<HTMLElement>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const handleProfileNavigation = (href: string) => {
    setIsNavigating(true)
    window.location.href = href
  }

  return (
    <main className="min-h-screen bg-background">
      {isNavigating && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </div>
      )}

      <header className="border-b border-border/40 glass sticky top-0 z-50 transition-all duration-300 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button onClick={() => setActiveView("home")} className="flex items-center gap-3 group">
            <div className="bg-black rounded-xl p-2.5 group-hover:scale-110 transition-all duration-300">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight group-hover:opacity-80 transition-all duration-300">
              Nextudy
            </h1>
          </button>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" onClick={() => setActiveView("home")}>
              Accueil
            </Button>
            <Button variant="ghost" onClick={() => setActiveView("history")}>
              Historique
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  Fonctionnalités
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={() => setActiveView("focus")} className="gap-2 cursor-pointer">
                  <Timer className="h-4 w-4" />
                  Concentration
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/chat" className="gap-2 cursor-pointer">
                    <MessageSquare className="h-4 w-4" />
                    Chat IA
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/book-summaries" className="gap-2 cursor-pointer">
                    <BookOpen className="h-4 w-4" />
                    Résumés de Livres
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/texte" className="gap-2 cursor-pointer">
                    <Type className="h-4 w-4" />
                    Traitement de texte
                  </Link>
                </DropdownMenuItem>
                {user && (
                  <DropdownMenuItem asChild>
                    <Link href="/todos" className="gap-2 cursor-pointer">
                      <ListTodo className="h-4 w-4" />
                      Tâches
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {user ? (
              <Button variant="ghost" onClick={() => handleProfileNavigation("/profile")}>
                <User className="h-4 w-4 mr-2" />
                Profil
              </Button>
            ) : (
              <Button variant="default" asChild>
                <Link href="/auth/login">Connexion</Link>
              </Button>
            )}
          </div>

          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[340px] p-0">
              <nav className="flex flex-col h-full py-6">
                <div className="px-6 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-black rounded-xl p-2.5">
                      <Brain className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-bold">Nextudy</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-3">
                  <div className="space-y-1">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setActiveView("home")
                        setIsMenuOpen(false)
                      }}
                      className="gap-3 w-full justify-start h-12 px-4 text-base rounded-lg"
                    >
                      <FileText className="h-5 w-5" />
                      <span>Accueil</span>
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setActiveView("history")
                        setIsMenuOpen(false)
                      }}
                      className="gap-3 w-full justify-start h-12 px-4 text-base rounded-lg"
                    >
                      <History className="h-5 w-5" />
                      <span>Historique</span>
                    </Button>
                  </div>

                  <div className="my-4 px-3">
                    <div className="h-px bg-border" />
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-muted-foreground px-4 mb-3 uppercase tracking-wider">
                      Fonctionnalités
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setActiveView("focus")
                        setIsMenuOpen(false)
                      }}
                      className="gap-3 w-full justify-start h-12 px-4 text-base rounded-lg"
                    >
                      <Timer className="h-5 w-5" />
                      <span>Concentration</span>
                    </Button>
                    <Button
                      variant="ghost"
                      asChild
                      className="gap-3 w-full justify-start h-12 px-4 text-base rounded-lg"
                    >
                      <Link href="/chat" onClick={() => setIsMenuOpen(false)}>
                        <MessageSquare className="h-5 w-5" />
                        <span>Chat IA</span>
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      asChild
                      className="gap-3 w-full justify-start h-12 px-4 text-base rounded-lg"
                    >
                      <Link href="/book-summaries" onClick={() => setIsMenuOpen(false)}>
                        <BookOpen className="h-5 w-5" />
                        <span>Résumés de Livres</span>
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      asChild
                      className="gap-3 w-full justify-start h-12 px-4 text-base rounded-lg"
                    >
                      <Link href="/texte" onClick={() => setIsMenuOpen(false)}>
                        <Type className="h-5 w-5" />
                        <span>Traitement de texte</span>
                      </Link>
                    </Button>
                    {user && (
                      <Button
                        variant="ghost"
                        asChild
                        className="gap-3 w-full justify-start h-12 px-4 text-base rounded-lg"
                      >
                        <Link href="/todos" onClick={() => setIsMenuOpen(false)}>
                          <ListTodo className="h-5 w-5" />
                          <span>Tâches</span>
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>

                <div className="border-t border-border pt-4 px-3 mt-4">
                  {user ? (
                    <Button
                      variant="ghost"
                      asChild
                      className="gap-3 w-full justify-start h-12 px-4 text-base rounded-lg"
                    >
                      <Link href="/profile" onClick={() => setIsMenuOpen(false)}>
                        <User className="h-5 w-5" />
                        <span>Profil</span>
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      asChild
                      className="gap-3 w-full justify-start h-12 px-4 text-base rounded-lg"
                    >
                      <Link href="/auth/login" onClick={() => setIsMenuOpen(false)}>
                        <User className="h-5 w-5" />
                        <span>Connexion</span>
                      </Link>
                    </Button>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {activeView === "home" && (
        <div className="container mx-auto px-4 sm:px-6">
          <section className="py-20 md:py-32">
            <div className="max-w-5xl mx-auto text-center space-y-8">
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-balance leading-[1.1] tracking-tight animate-fade-in">
                Transformez vos cours en révisions efficaces
              </h1>

              <p className="text-lg md:text-2xl text-muted-foreground text-pretty max-w-3xl mx-auto leading-relaxed animate-fade-in animate-delay-200">
                Avec Nextudy, importez vos documents ou enregistrez votre voix pour générer automatiquement des résumés,
                flashcards et fiches de révision grâce à l'intelligence artificielle.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 animate-fade-in animate-delay-300">
                <Button
                  size="lg"
                  onClick={() => scrollToSection(uploadSectionRef)}
                  className="gap-2 text-lg px-8 py-6 rounded-xl group w-full sm:w-auto transition-all duration-300"
                >
                  <FileText className="h-5 w-5" />
                  Importer un fichier
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => scrollToSection(audioSectionRef)}
                  className="gap-2 text-lg px-8 py-6 rounded-xl group w-full sm:w-auto transition-all duration-300"
                >
                  <Image
                    src="/icons/microphone-white.png"
                    alt="Microphone"
                    width={20}
                    height={20}
                    className="h-5 w-5"
                  />
                  Enregistrer audio
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
              </div>
            </div>
          </section>

          <section className="py-16 border-t border-border/40 overflow-hidden">
            <div className="max-w-6xl mx-auto">
              <h3 className="text-3xl md:text-4xl font-bold text-center mb-16 text-balance animate-fade-in">
                Des outils uniques qui repoussent toutes les limites.
              </h3>

              <div ref={featuresScrollRef} className="relative overflow-x-auto scrollbar-hide">
                <div className="flex flex-nowrap gap-6 pb-8 snap-x snap-mandatory">
                  {/* Existing features */}
                  <div className="group p-8 rounded-2xl border border-border bg-card hover:shadow-lg transition-all duration-300 min-w-[320px] flex-shrink-0 snap-center">
                    <div className="bg-black/5 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-300">
                      <FileText className="h-7 w-7 text-black" />
                    </div>
                    <h4 className="text-xl font-semibold mb-3">Résumé Intelligent</h4>
                    <p className="text-muted-foreground leading-relaxed">
                      Analyse automatique de vos documents pour créer des résumés structurés.
                    </p>
                  </div>

                  <div className="group p-8 rounded-2xl border border-border bg-card hover:shadow-lg transition-all duration-300 min-w-[320px] flex-shrink-0 snap-center">
                    <div className="bg-black/5 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-300">
                      <Brain className="h-7 w-7 text-black" />
                    </div>
                    <h4 className="text-xl font-semibold mb-3">Flashcard Automatique</h4>
                    <p className="text-muted-foreground leading-relaxed">
                      Génération instantanée de flashcards basées sur les concepts clés.
                    </p>
                  </div>

                  <div className="group p-8 rounded-2xl border border-border bg-card hover:shadow-lg transition-all duration-300 min-w-[320px] flex-shrink-0 snap-center">
                    <div className="bg-black/5 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-300">
                      <Zap className="h-7 w-7 text-foreground" />
                    </div>
                    <h4 className="text-xl font-semibold mb-3">Multiforme</h4>
                    <p className="text-muted-foreground leading-relaxed">
                      Support de PDF, Word, texte et enregistrement vocal.
                    </p>
                  </div>

                  {/* New features */}
                  <div className="group p-8 rounded-2xl border border-border bg-card hover:shadow-lg transition-all duration-300 min-w-[320px] flex-shrink-0 snap-center">
                    <div className="bg-black/5 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-300">
                      <BookOpen className="h-7 w-7 text-foreground" />
                    </div>
                    <h4 className="text-xl font-semibold mb-3">Fiche de révisions</h4>
                    <p className="text-muted-foreground leading-relaxed">
                      Créations express de courtes fiches de révisions structurées.
                    </p>
                  </div>

                  <div className="group p-8 rounded-2xl border border-border bg-card hover:shadow-lg transition-all duration-300 min-w-[320px] flex-shrink-0 snap-center">
                    <div className="bg-black/5 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-300">
                      <MessageSquare className="h-7 w-7 text-foreground" />
                    </div>
                    <h4 className="text-xl font-semibold mb-3">Chat IA</h4>
                    <p className="text-muted-foreground leading-relaxed">
                      Un chat IA plus puissant que Chat GPT, Gemini et Perplexity.
                    </p>
                  </div>

                  <div className="group p-8 rounded-2xl border border-border bg-card hover:shadow-lg transition-all duration-300 min-w-[320px] flex-shrink-0 snap-center">
                    <div className="bg-black/5 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-300">
                      <Printer className="h-7 w-7 text-foreground" />
                    </div>
                    <h4 className="text-xl font-semibold mb-3">Imprimeur</h4>
                    <p className="text-muted-foreground leading-relaxed">
                      Possibilité d'imprimer tous vos résumés et fiches de révisions.
                    </p>
                  </div>

                  <div className="group p-8 rounded-2xl border border-border bg-card hover:shadow-lg transition-all duration-300 min-w-[320px] flex-shrink-0 snap-center">
                    <div className="bg-black/5 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-300">
                      <Clock className="h-7 w-7 text-white" />
                    </div>
                    <h4 className="text-xl font-semibold mb-3">Mode concentration</h4>
                    <p className="text-muted-foreground leading-relaxed">
                      Soyez concentré sur vos révisions avec la technique pomodoro.
                    </p>
                  </div>

                  <div className="group p-8 rounded-2xl border border-border bg-card hover:shadow-lg transition-all duration-300 min-w-[320px] flex-shrink-0 snap-center">
                    <div className="bg-black/5 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-300">
                      <History className="h-7 w-7 text-foreground" />
                    </div>
                    <h4 className="text-xl font-semibold mb-3">Historique</h4>
                    <p className="text-muted-foreground leading-relaxed">
                      Revisualiser toutes vos fiches et résumés autant que vous le souhaitez.
                    </p>
                  </div>

                  <div className="group p-8 rounded-2xl border border-border bg-card hover:shadow-lg transition-all duration-300 min-w-[320px] flex-shrink-0 snap-center">
                    <div className="bg-black/5 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-300">
                      <ListTodo className="h-7 w-7 text-background" />
                    </div>
                    <h4 className="text-xl font-semibold mb-3">Lister vos taches</h4>
                    <p className="text-muted-foreground leading-relaxed">
                      N'oubliez jamais rien en listant tous ce que vous avez à faire.
                    </p>
                  </div>

                  <div className="group p-8 rounded-2xl border border-border bg-card hover:shadow-lg transition-all duration-300 min-w-[320px] flex-shrink-0 snap-center">
                    <div className="bg-black/5 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-300">
                      <Type className="h-7 w-7 text-primary" />
                    </div>
                    <h4 className="text-xl font-semibold mb-3">Traitement de texte</h4>
                    <p className="text-muted-foreground leading-relaxed">
                      Créez et formatez des documents avec collaboration en temps réel.
                    </p>
                  </div>

                  {/* Duplicate the cards for seamless loop */}
                  <div className="group p-8 rounded-2xl border border-border bg-card hover:shadow-lg transition-all duration-300 min-w-[320px] flex-shrink-0 snap-center">
                    <div className="bg-black/5 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-300">
                      <FileText className="h-7 w-7 text-primary" />
                    </div>
                    <h4 className="text-xl font-semibold mb-3">Résumé Intelligent</h4>
                    <p className="text-muted-foreground leading-relaxed">
                      Analyse automatique de vos documents pour créer des résumés structurés.
                    </p>
                  </div>

                  <div className="group p-8 rounded-2xl border border-border bg-card hover:shadow-lg transition-all duration-300 min-w-[320px] flex-shrink-0 snap-center">
                    <div className="bg-black/5 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-300">
                      <Brain className="h-7 w-7 text-foreground" />
                    </div>
                    <h4 className="text-xl font-semibold mb-3">Flashcard Automatique</h4>
                    <p className="text-muted-foreground leading-relaxed">
                      Génération instantanée de flashcards basées sur les concepts clés.
                    </p>
                  </div>

                  <div className="group p-8 rounded-2xl border border-border bg-card hover:shadow-lg transition-all duration-300 min-w-[320px] flex-shrink-0 snap-center">
                    <div className="bg-black/5 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-300">
                      <Zap className="h-7 w-7 text-foreground" />
                    </div>
                    <h4 className="text-xl font-semibold mb-3">Multiforme</h4>
                    <p className="text-muted-foreground leading-relaxed">
                      Support de PDF, Word, texte et enregistrement vocal.
                    </p>
                  </div>

                  <div className="group p-8 rounded-2xl border border-border bg-card hover:shadow-lg transition-all duration-300 min-w-[320px] flex-shrink-0 snap-center">
                    <div className="bg-black/5 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-300">
                      <BookOpen className="h-7 w-7 text-foreground" />
                    </div>
                    <h4 className="text-xl font-semibold mb-3">Fiche de révisions</h4>
                    <p className="text-muted-foreground leading-relaxed">
                      Créations express de courtes fiches de révisions structurées.
                    </p>
                  </div>

                  <div className="group p-8 rounded-2xl border border-border bg-card hover:shadow-lg transition-all duration-300 min-w-[320px] flex-shrink-0 snap-center">
                    <div className="bg-black/5 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-300">
                      <MessageSquare className="h-7 w-7 text-foreground" />
                    </div>
                    <h4 className="text-xl font-semibold mb-3">Chat IA</h4>
                    <p className="text-muted-foreground leading-relaxed">
                      Un chat IA plus puissant que Chat GPT, Gemini et Perplexity.
                    </p>
                  </div>

                  <div className="group p-8 rounded-2xl border border-border bg-card hover:shadow-lg transition-all duration-300 min-w-[320px] flex-shrink-0 snap-center">
                    <div className="bg-black/5 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-300">
                      <Printer className="h-7 w-7 text-foreground" />
                    </div>
                    <h4 className="text-xl font-semibold mb-3">Imprimeur</h4>
                    <p className="text-muted-foreground leading-relaxed">
                      Possibilité d'imprimer tous vos résumés et fiches de révisions.
                    </p>
                  </div>

                  <div className="group p-8 rounded-2xl border border-border bg-card hover:shadow-lg transition-all duration-300 min-w-[320px] flex-shrink-0 snap-center">
                    <div className="bg-black/5 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-300">
                      <Clock className="h-7 w-7 text-foreground" />
                    </div>
                    <h4 className="text-xl font-semibold mb-3">Mode concentration</h4>
                    <p className="text-muted-foreground leading-relaxed">
                      Soyez concentré sur vos révisions avec la technique pomodoro.
                    </p>
                  </div>

                  <div className="group p-8 rounded-2xl border border-border bg-card hover:shadow-lg transition-all duration-300 min-w-[320px] flex-shrink-0 snap-center">
                    <div className="bg-black/5 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-300">
                      <History className="h-7 w-7 text-foreground" />
                    </div>
                    <h4 className="text-xl font-semibold mb-3">Historique</h4>
                    <p className="text-muted-foreground leading-relaxed">
                      Revisualiser toutes vos fiches et résumés autant que vous le souhaitez.
                    </p>
                  </div>

                  <div className="group p-8 rounded-2xl border border-border bg-card hover:shadow-lg transition-all duration-300 min-w-[320px] flex-shrink-0 snap-center">
                    <div className="bg-black/5 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-300">
                      <ListTodo className="h-7 w-7 text-foreground" />
                    </div>
                    <h4 className="text-xl font-semibold mb-3">Lister vos taches</h4>
                    <p className="text-muted-foreground leading-relaxed">
                      N'oubliez jamais rien en listant tous ce que vous avez à faire.
                    </p>
                  </div>

                  <div className="group p-8 rounded-2xl border border-border bg-card hover:shadow-lg transition-all duration-300 min-w-[320px] flex-shrink-0 snap-center">
                    <div className="bg-black/5 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-300">
                      <Type className="h-7 w-7 text-foreground" />
                    </div>
                    <h4 className="text-xl font-semibold mb-3">Traitement de texte</h4>
                    <p className="text-muted-foreground leading-relaxed">
                      Créez et formatez des documents avec collaboration en temps réel.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="py-16 border-t border-border/40">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
              <section ref={uploadSectionRef} className="scroll-mt-20 animate-fade-in">
                <div className="max-w-2xl mx-auto">
                  <div className="text-center mb-12">
                    <div
                      className={`inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-black/5 mb-4 transition-all duration-300 ${isDragging ? "scale-110 bg-black/10" : ""}`}
                    >
                      <Upload
                        className={`h-6 w-6 sm:h-8 sm:w-8 text-white transition-transform duration-300 ${isDragging ? "scale-110" : ""}`}
                      />
                    </div>
                    <h3 className="text-3xl md:text-4xl font-bold mb-4 text-balance">Importez vos documents</h3>
                    <p className="text-lg text-muted-foreground text-pretty">
                      PDF, Word, TXT, Markdown, RTF, Images (JPG, JPEG, PNG, WEBP)
                    </p>
                    <p className="text-xs text-muted-foreground text-pretty">
                      Vous pouvez importer plusieurs fichiers à la fois
                    </p>
                  </div>
                  <PDFUploader />
                </div>
              </section>

              <section ref={audioSectionRef} className="scroll-mt-20 animate-fade-in animate-delay-200">
                <div className="max-w-2xl mx-auto">
                  <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-black/5 mb-4 transition-all duration-300">
                      <Image
                        src="/icons/microphone-white.png"
                        alt="Microphone"
                        width={32}
                        height={32}
                        className="h-6 w-6 sm:h-8 sm:w-8"
                      />
                    </div>
                    <h3 className="text-3xl md:text-4xl font-bold mb-4 text-balance">Enregistrez votre voix</h3>
                    <p className="text-lg text-white text-pretty">Transcription et résumé automatique</p>
                  </div>
                  <AudioRecorder />
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {activeView === "history" && (
        <div className="container mx-auto px-4 sm:px-6 py-12 animate-fade-in">
          <HistoryView />
        </div>
      )}

      {activeView === "focus" && (
        <div className="container mx-auto px-4 sm:px-6 py-12 animate-fade-in">
          <FocusMode />
        </div>
      )}
    </main>
  )
}
