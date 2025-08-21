"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  showRetry?: boolean
}

export function ErrorState({
  title = "Something went wrong",
  message = "We encountered an error while loading this content. Please try again.",
  onRetry,
  showRetry = true,
}: ErrorStateProps) {
  return (
    <Card className="bg-white">
      <CardContent className="pt-6">
        <div className="text-center py-8 space-y-4">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
          <div>
            <h3 className="text-lg font-serif font-semibold text-destructive">{title}</h3>
            <p className="text-sm text-muted-foreground mt-2">{message}</p>
          </div>
          {showRetry && onRetry && (
            <Button onClick={onRetry} variant="outline" className="mt-4 bg-transparent">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
