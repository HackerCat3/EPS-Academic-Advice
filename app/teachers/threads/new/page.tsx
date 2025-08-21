"use client"

import { Button } from "@/components/ui/button"
import type React from "react"
import { AppShell } from "@/components/app-shell"
import { Banner } from "@/components/banner"
import { FileUpload } from "@/components/file-upload"
import { RichTextEditor } from "@/components/rich-text-editor"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export default function NewTeachersThreadPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultCategory = searchParams.get('category') || 'collaboration'

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
    category: string
    attachments: any[]
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

          <TeachersThreadComposer 
            onSubmit={handleSubmit} 
            isLoading={isLoading} 
            userRole={profile.role}
            defaultCategory={defaultCategory}
          />
        </div>
      </div>
    </AppShell>
  )
}

function TeachersThreadComposer({
  onSubmit,
  isLoading,
  userRole,
  defaultCategory = 'collaboration'
}: {
  onSubmit: (data: {
    title: string
    body: string
    isAnonymous: boolean
    visibility: "public" | "teachers_only"
    category: string
    attachments: any[]
  }) => Promise<{ success: boolean; pending?: boolean; error?: string }>
  isLoading?: boolean
  userRole?: string
  defaultCategory?: string
}) {
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [category, setCategory] = useState(defaultCategory)
  const [attachments, setAttachments] = useState<any[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const categories = [
    { value: 'collaboration', label: 'Academic Collaboration', description: 'Teaching methods and resources' },
    { value: 'review', label: 'Student Questions Review', description: 'Flagged and removed posts' },
    { value: 'policy', label: 'Policy Discussions', description: 'School policies and moderation rules' },
    ...(userRole === 'admin' ? [{ value: 'announcements', label: 'Announcements', description: 'Important administrative notes' }] : [])
  ]

  const handleFilesChange = (newFiles: File[]) => {
    setFiles(newFiles)
  }

  const uploadFiles = async () => {
    if (files.length === 0) return []

    setIsUploading(true)
    try {
      const formData = new FormData()
      files.forEach(file => {
        formData.append('files', file)
      })

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const result = await response.json()
      return result.files
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return

    setError(null)
    setIsPending(false)

    try {
      // Upload files first if any
      const uploadedFiles = await uploadFiles()

      const result = await onSubmit({
        title: title.trim(),
        body: body.trim(),
        isAnonymous,
        visibility: "teachers_only",
        category,
        attachments: uploadedFiles
      })

      if (result.success) {
        if (result.pending) {
          setIsPending(true)
        } else {
          // Reset form on successful submission
          setTitle("")
          setBody("")
          setIsAnonymous(false)
          setCategory('collaboration')
          setFiles([])
          setAttachments([])
        }
      } else if (result.error) {
        setError(result.error)
      }
    } catch (uploadError: any) {
      setError(uploadError.message || 'Failed to upload files')
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
              setCategory('collaboration')
              setFiles([])
              setAttachments([])
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
        {/* Category Selection */}
        <div className="space-y-2">
          <label htmlFor="category" className="text-sm font-medium">
            Category <span className="text-destructive">*</span>
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            required
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label} - {cat.description}
              </option>
            ))}
          </select>
        </div>

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
          <label className="text-sm font-medium">
            Description <span className="text-destructive">*</span>
          </label>
          <RichTextEditor
            value={body}
            onChange={setBody}
            placeholder="Share your professional insights, pedagogical questions, or academic concerns with fellow educators..."
            disabled={isLoading || isUploading}
            rows={8}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">File Attachments</label>
          <FileUpload 
            onFilesChange={handleFilesChange}
            disabled={isLoading || isUploading}
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
            disabled={!title.trim() || !body.trim() || isLoading || isUploading}
            className="bg-[#10316B] hover:bg-[#10316B]/90"
          >
            {isUploading ? "Uploading files..." : isLoading ? "Submitting..." : "Submit Faculty Inquiry"}
          </Button>
        </div>
      </form>
    </div>
  )
}
