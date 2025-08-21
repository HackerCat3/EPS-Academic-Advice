"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { useState } from "react"

interface ThreadComposerProps {
  onSubmit: (data: {
    title: string
    body: string
    isAnonymous: boolean
    visibility: "public" | "teachers_only"
  }) => Promise<{ success: boolean; pending?: boolean; error?: string }>
  isLoading?: boolean
  userRole?: string
}

export function ThreadComposer({ onSubmit, isLoading, userRole }: ThreadComposerProps) {
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [visibility, setVisibility] = useState<"public" | "teachers_only">("public")
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const canCreateTeachersOnly = userRole === "teacher" || userRole === "admin"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return

    setError(null)
    setIsPending(false)

    const result = await onSubmit({
      title: title.trim(),
      body: body.trim(),
      isAnonymous,
      visibility,
    })

    if (result.success) {
      if (result.pending) {
        setIsPending(true)
      } else {
        // Reset form on successful submission
        setTitle("")
        setBody("")
        setIsAnonymous(false)
        setVisibility("public")
      }
    } else if (result.error) {
      setError(result.error)
    }
  }

  if (isPending) {
    return (
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-yellow-600 mx-auto" />
            <div>
              <h3 className="text-lg font-serif font-semibold text-yellow-800">Pending Review</h3>
              <p className="text-sm text-yellow-700 mt-2">
                Your submission has been flagged for review and will be visible once approved by a teacher.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setIsPending(false)
                setTitle("")
                setBody("")
                setIsAnonymous(false)
                setVisibility("public")
              }}
              className="bg-white"
            >
              Submit Another Inquiry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="text-xl font-serif">Submit an Academic Inquiry</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title <span className="text-destructive">*</span>
            </label>
            <Input
              id="title"
              type="text"
              placeholder="Enter a clear, descriptive title for your inquiry"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <label htmlFor="body" className="text-sm font-medium">
              Description <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="body"
              placeholder="Provide detailed information about your academic question or topic for discussion..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              className="resize-none"
              required
            />
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Visibility */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Visibility</label>
              <Select value={visibility} onValueChange={(value: "public" | "teachers_only") => setVisibility(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public - Visible to all users</SelectItem>
                  {canCreateTeachersOnly && (
                    <SelectItem value="teachers_only">Teachers Only - Visible to teachers and admins</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Anonymous */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Privacy</label>
              <div className="flex items-center space-x-2 h-10">
                <Checkbox id="anonymous" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
                <label
                  htmlFor="anonymous"
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Post anonymously
                </label>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!title.trim() || !body.trim() || isLoading}
              className="bg-[#10316B] hover:bg-[#10316B]/90"
            >
              {isLoading ? "Submitting..." : "Submit Inquiry"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
