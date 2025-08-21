"use client"

import { AppShell } from "@/components/app-shell"
import { ThreadComposer } from "@/components/thread-composer"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function NewThreadPage() {
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
      const response = await fetch("/api/threads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
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
      <div className="max-w-4xl mx-auto">
        <ThreadComposer onSubmit={handleSubmit} isLoading={isLoading} userRole={profile.role} />
      </div>
    </AppShell>
  )
}
