import { Badge } from "@/components/ui/badge"
import { UserRole } from "@/lib/auth"
import { Crown, Zap } from 'lucide-react'

interface UserRoleBadgeProps {
  role: UserRole
}

export function UserRoleBadge({ role }: UserRoleBadgeProps) {
  if (role === "admin") {
    return (
      <Badge variant="destructive" className="gap-1">
        <Crown className="h-3 w-3" />
        Admin
      </Badge>
    )
  }

  if (role === "premium") {
    return (
      <Badge className="gap-1 bg-gradient-to-r from-purple-500 to-pink-500">
        <Zap className="h-3 w-3" />
        Premium
      </Badge>
    )
  }

  return (
    <Badge variant="secondary">
      Gratuit
    </Badge>
  )
}
