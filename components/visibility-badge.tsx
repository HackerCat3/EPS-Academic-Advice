import { Badge } from "@/components/ui/badge"
import { Users, GraduationCap } from "lucide-react"

interface VisibilityBadgeProps {
  visibility: "public" | "teachers_only"
  className?: string
}

export function VisibilityBadge({ visibility, className }: VisibilityBadgeProps) {
  if (visibility === "teachers_only") {
    return (
      <Badge variant="secondary" className={className}>
        <GraduationCap className="h-3 w-3 mr-1" />
        Teachers Only
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className={className}>
      <Users className="h-3 w-3 mr-1" />
      Public
    </Badge>
  )
}
