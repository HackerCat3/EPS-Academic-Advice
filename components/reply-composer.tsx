"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"

interface ReplyComposerProps {
  onSubmit: (body: string, isAnonymous: boolean) => Promise<void>
  isLoading?: boolean
  disabled?: boolean
}

export function ReplyComposer({ onSubmit, isLoading, disabled }: ReplyComposerProps) {
  const [body, setBody] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim()) return

    await onSubmit(body.trim(), isAnonymous)
    setBody("")
    setIsAnonymous(false)
  }

  if (disabled) {
    return (
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="pt-6">
          <p className="text-sm text-yellow-800 text-center">This thread is locked. Further responses are disabled.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-serif">Provide a Response</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="Share your thoughts or provide assistance..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            className="resize-none"
            required
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox id="anonymous" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
              <label
                htmlFor="anonymous"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Post anonymously
              </label>
            </div>
            <Button type="submit" disabled={!body.trim() || isLoading} className="bg-[#10316B] hover:bg-[#10316B]/90">
              {isLoading ? "Posting..." : "Post Response"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
