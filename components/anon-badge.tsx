import { Badge } from "@/components/ui/badge"
import { UserX } from "lucide-react"

interface AnonBadgeProps {
  className?: string
}

export function AnonBadge({ className }: AnonBadgeProps) {
  return (
    <Badge variant="outline" className={className}>
      <UserX className="h-3 w-3 mr-1" />
      Anonymous
    </Badge>
  )
}
