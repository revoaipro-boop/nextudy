'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Crown, Zap } from 'lucide-react'
import Link from 'next/link'

interface UsageLimitModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  feature: string
  current: number
  limit: number
}

export function UsageLimitModal({
  open,
  onOpenChange,
  feature,
  current,
  limit,
}: UsageLimitModalProps) {
  const percentage = (current / limit) * 100

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-primary" />
            <DialogTitle>Limite atteinte</DialogTitle>
          </div>
          <DialogDescription>
            Vous avez utilisé toutes vos {feature} gratuites ce mois-ci.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Utilisation</span>
              <span className="font-medium">{current} / {limit}</span>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <Crown className="h-4 w-4 text-primary" />
              <span>Passez à Premium</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Débloquez des {feature} illimitées et toutes les fonctionnalités premium pour seulement 9,99€/mois.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              asChild
            >
              <Link href="/pricing">
                Voir les plans Premium
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              Peut-être plus tard
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
