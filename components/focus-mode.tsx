"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, RotateCcw, Timer, Volume2, VolumeX, Music } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

const DEFAULT_VIDEO_ID = "jfKfPfyJRdk"

export function FocusMode() {
  const [duration, setDuration] = useState(25)
  const [timeLeft, setTimeLeft] = useState(duration * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [isMusicEnabled, setIsMusicEnabled] = useState(true)
  const [isMusicPlaying, setIsMusicPlaying] = useState(false)
  const [volume, setVolume] = useState(50)
  const [showMusicSettings, setShowMusicSettings] = useState(false)
  const playerRef = useRef<any>(null)
  const intervalRef = useRef<NodeJS.Timeout>()
  const { toast } = useToast()

  useEffect(() => {
    const tag = document.createElement("script")
    tag.src = "https://www.youtube.com/iframe_api"
    const firstScriptTag = document.getElementsByTagName("script")[0]
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

    window.onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT.Player("youtube-player", {
        height: "0",
        width: "0",
        videoId: DEFAULT_VIDEO_ID,
        playerVars: {
          autoplay: 0,
          controls: 0,
          loop: 1,
          playlist: DEFAULT_VIDEO_ID,
        },
        events: {
          onReady: (event: any) => {
            console.log("[v0] YouTube player ready")
            event.target.setVolume(volume)
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsMusicPlaying(true)
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsMusicPlaying(false)
            }
          },
        },
      })
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy()
      }
    }
  }, [])

  useEffect(() => {
    if (playerRef.current && playerRef.current.setVolume) {
      playerRef.current.setVolume(volume)
    }
  }, [volume])

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false)
            if (playerRef.current && playerRef.current.pauseVideo) {
              playerRef.current.pauseVideo()
              setIsMusicPlaying(false)
            }
            toast({
              title: "Session terminée !",
              description: "Prenez une pause bien méritée.",
            })
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timeLeft, toast])

  useEffect(() => {
    if (!playerRef.current || !playerRef.current.playVideo) return

    if (isRunning && isMusicEnabled) {
      try {
        playerRef.current.playVideo()
      } catch (error) {
        console.log("[v0] YouTube autoplay error:", error)
      }
    } else if (!isRunning && playerRef.current.pauseVideo) {
      playerRef.current.pauseVideo()
    }
  }, [isRunning, isMusicEnabled])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleStart = () => {
    setIsRunning(true)
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleReset = () => {
    setIsRunning(false)
    setTimeLeft(duration * 60)
    if (playerRef.current && playerRef.current.pauseVideo) {
      playerRef.current.pauseVideo()
      playerRef.current.seekTo(0)
      setIsMusicPlaying(false)
    }
  }

  const handleDurationChange = (value: string) => {
    const num = Number.parseInt(value)
    if (!isNaN(num) && num > 0 && num <= 120) {
      setDuration(num)
      if (!isRunning) {
        setTimeLeft(num * 60)
      }
    }
  }

  const toggleMusic = () => {
    if (!playerRef.current || !playerRef.current.playVideo) {
      toast({
        title: "Lecteur non prêt",
        description: "Le lecteur YouTube est en cours de chargement...",
        variant: "default",
      })
      return
    }

    if (isMusicEnabled && isRunning) {
      playerRef.current.pauseVideo()
      setIsMusicPlaying(false)
      setIsMusicEnabled(false)
    } else if (!isMusicEnabled && isRunning) {
      playerRef.current.playVideo()
      setIsMusicPlaying(true)
      setIsMusicEnabled(true)
    } else {
      setIsMusicEnabled(!isMusicEnabled)
    }
  }

  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 p-4">
      <div id="youtube-player" style={{ display: "none" }} />

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold mb-2">Mode Concentration</h2>
          <p className="text-muted-foreground">Restez concentré avec un timer Pomodoro</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowMusicSettings(!showMusicSettings)}
            title="Paramètres musique"
          >
            <Music className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleMusic}
            className={isMusicEnabled ? "bg-primary/10" : ""}
            title={isMusicEnabled ? "Désactiver la musique" : "Activer la musique"}
          >
            {isMusicEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {showMusicSettings && (
        <Card className="p-6 space-y-2 bg-muted/30">
          <Label htmlFor="volume" className="text-sm font-medium">
            Volume: {volume}%
          </Label>
          <div className="flex items-center gap-4">
            <VolumeX className="h-4 w-4 text-muted-foreground" />
            <Slider
              id="volume"
              min={0}
              max={100}
              step={1}
              value={[volume]}
              onValueChange={(value) => setVolume(value[0])}
              className="flex-1"
            />
            <Volume2 className="h-4 w-4 text-muted-foreground" />
          </div>
        </Card>
      )}

      <Card className="p-8">
        <div className="space-y-8">
          <div className="relative">
            <div className="w-full max-w-[280px] aspect-square mx-auto relative">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 90}`}
                  strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress / 100)}`}
                  className="text-primary transition-all duration-1000 ease-linear"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center px-4">
                  <div className="text-5xl sm:text-6xl font-bold">{formatTime(timeLeft)}</div>
                  {isMusicPlaying && (
                    <div className="flex items-center justify-center gap-2 mt-2 text-xs sm:text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Volume2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>Musique</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {!isRunning && timeLeft === duration * 60 && (
              <div className="flex items-center gap-4 flex-wrap">
                <Label htmlFor="duration" className="text-sm font-medium whitespace-nowrap">
                  Durée (minutes):
                </Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="120"
                  value={duration}
                  onChange={(e) => handleDurationChange(e.target.value)}
                  className="w-24"
                />
              </div>
            )}

            <div className="flex gap-4 justify-center flex-wrap">
              {!isRunning ? (
                <Button onClick={handleStart} size="lg" className="gap-2">
                  <Play className="h-5 w-5" />
                  Démarrer
                </Button>
              ) : (
                <Button onClick={handlePause} size="lg" variant="secondary" className="gap-2">
                  <Pause className="h-5 w-5" />
                  Pause
                </Button>
              )}
              <Button onClick={handleReset} size="lg" variant="outline" className="gap-2 bg-transparent">
                <RotateCcw className="h-5 w-5" />
                Réinitialiser
              </Button>
            </div>
          </div>

          {/* Info */}
          <Card className="bg-muted/50 border-0">
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Timer className="h-4 w-4 text-primary" />
                <span className="font-medium">Technique Pomodoro</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Travaillez par sessions de 25 minutes suivies de courtes pauses pour maximiser votre concentration et
                votre productivité.
              </p>
            </div>
          </Card>
        </div>
      </Card>
    </div>
  )
}
