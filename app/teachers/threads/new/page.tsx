"use client"

import { Button } from "@/components/ui/button"

import type React from "react"

import { AppShell } from "@/components/app-shell"
import { Banner } from "@/components/banner"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function NewTeachersThreadPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (!profile) {
        router.push("/auth/login")
        return
      }

      // Check if user is teacher or admin
      if (!["teacher", "admin"].includes(profile.role)) {
        router.push("/")
        return
      }

      setUser(user)
      setProfile(profile)
    }

    getUser()
  }, [router])

  const handleSubmit = async (data: {
    title: string
    body: string
    isAnonymous: boolean
    visibility: "public" | "teachers_only"
  }) => {
    setIsLoading(true)

    try {
      // Force teachers_only visibility for this route
      const response = await fetch("/api/threads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          visibility: "teachers_only",
        }),
      })

      const result = await response.json()

      if (response.ok) {
        if (result.pending) {
          return { success: true, pending: true }
        } else {
          router.push(`/threads/${result.id}`)
          return { success: true }
        }
      } else {
        return { success: false, error: result.error || "Failed to create thread" }
      }
    } catch (error) {
      return { success: false, error: "An unexpected error occurred" }
    } finally {
      setIsLoading(false)
    }
  }

  if (!profile) {
    return <div>Loading...</div>
  }

  return (
    <AppShell user={profile}>
      <div className="space-y-6">
        {/* Teachers' Lounge Banner */}
        <Banner variant="teachers">
          <div className="flex items-center justify-center">
            <span className="font-serif text-xl">Teachers' Lounge</span>
          </div>
        </Banner>

        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-serif font-bold text-[#10316B] mb-2">Create Faculty Discussion</h1>
            <p className="text-muted-foreground">
              Share professional insights, seek pedagogical advice, or discuss academic matters with fellow educators.
            </p>
          </div>

          {/* Custom Thread Composer for Teachers */}
          <TeachersThreadComposer onSubmit={handleSubmit} isLoading={isLoading} userRole={profile.role} />
        </div>
      </div>
    </AppShell>
  )
}

// Custom component that forces teachers_only visibility
function TeachersThreadComposer({
  onSubmit,
  isLoading,
  userRole,
}: {
  onSubmit: (data: {
    title: string
    body: string
    isAnonymous: boolean
    visibility: "public" | "teachers_only"
  }) => Promise<{ success: boolean; pending?: boolean; error?: string }>
  isLoading?: boolean
  userRole?: string
}) {
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return

    setError(null)
    setIsPending(false)

    const result = await onSubmit({
      title: title.trim(),
      body: body.trim(),
      isAnonymous,
      visibility: "teachers_only",
    })

    if (result.success) {
      if (result.pending) {
        setIsPending(true)
      } else {
        // Reset form on successful submission
        setTitle("")
        setBody("")
        setIsAnonymous(false)
      }
    } else if (result.error) {
      setError(result.error)
    }
  }

  if (isPending) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 text-yellow-600 mx-auto">⚠️</div>
          <div>
            <h3 className="text-lg font-serif font-semibold text-yellow-800">Pending Review</h3>
            <p className="text-sm text-yellow-700 mt-2">
              Your submission has been flagged for review and will be visible once approved.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setIsPending(false)
              setTitle("")
              setBody("")
              setIsAnonymous(false)
            }}
            className="bg-white"
          >
            Submit Another Inquiry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium">
            Title <span className="text-destructive">*</span>
          </label>
          <input
            id="title"
            type="text"
            placeholder="Enter a clear, descriptive title for your faculty inquiry"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Body */}
        <div className="space-y-2">
          <label htmlFor="body" className="text-sm font-medium">
            Description <span className="text-destructive">*</span>
          </label>
          <textarea
            id="body"
            placeholder="Share your professional insights, pedagogical questions, or academic concerns with fellow educators..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            required
          />
        </div>

        {/* Anonymous Option */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="anonymous"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="rounded border-input"
          />
          <label htmlFor="anonymous" className="text-sm leading-none">
            Post anonymously (identity hidden from other teachers but logged internally)
          </label>
        </div>

        {/* Visibility Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm text-blue-800">
            <strong>Faculty Only:</strong> This discussion will only be visible to teachers and administrators.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!title.trim() || !body.trim() || isLoading}
            className="bg-[#10316B] hover:bg-[#10316B]/90"
          >
            {isLoading ? "Submitting..." : "Submit Faculty Inquiry"}
          </Button>
        </div>
      </form>
    </div>
  )
}
