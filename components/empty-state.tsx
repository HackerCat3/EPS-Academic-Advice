import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Search } from "lucide-react"
import Link from "next/link"

interface EmptyStateProps {
  title: string
  message: string
  actionLabel?: string
  actionHref?: string
  showSearch?: boolean
}

export function EmptyState({ title, message, actionLabel, actionHref, showSearch }: EmptyStateProps) {
  const Icon = showSearch ? Search : Plus

  return (
    <Card className="bg-white">
      <CardContent className="pt-6">
        <div className="text-center py-12 space-y-4">
          <Icon className="h-12 w-12 text-muted-foreground mx-auto" />
          <div>
            <h3 className="text-lg font-serif font-semibold text-muted-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground mt-2">{message}</p>
          </div>
          {actionLabel && actionHref && (
            <Button asChild className="bg-[#10316B] hover:bg-[#10316B]/90 mt-4">
              <Link href={actionHref}>
                <Plus className="h-4 w-4 mr-2" />
                {actionLabel}
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
