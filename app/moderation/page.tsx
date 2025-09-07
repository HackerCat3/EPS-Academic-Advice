"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { AppShell } from "@/components/app-shell"
import { ModerationDashboard } from "@/components/moderation-dashboard"

interface PendingItem {
  id: string
  type: 'thread' | 'reply'
  title?: string
  body: string
  author: { full_name: string; email: string } | null
  created_at: string
  flag_reason?: string
  thread_title?: string
}

interface ModerationEvent {
  id: string
  action: string
  target_type: string
  target_id: string
  reason?: string
  created_at: string
  actor: { full_name: string } | null
}

export default function ModerationPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([])
  const [moderationEvents, setModerationEvents] = useState<ModerationEvent[]>([])
  const [moderationVotes, setModerationVotes] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get user and profile
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
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

        // Get pending threads with author info
        const { data: pendingThreads } = await supabase
          .from("threads")
          .select(
            `
            id,
            title,
            body,
            created_at,
            author:profiles(full_name, email),
            flags(reason)
          `,
          )
          .eq("is_pending", true)
          .order("created_at", { ascending: false })

        // Get pending replies with author and thread info
        const { data: pendingReplies } = await supabase
          .from("replies")
          .select(
            `
            id,
            body,
            created_at,
            author:profiles(full_name, email),
            thread:threads(title),
            flags(reason)
          `,
          )
          .eq("is_pending", true)
          .order("created_at", { ascending: false })

        // Get recent moderation events
        const { data: moderationEvents } = await supabase
          .from("moderation_events")
          .select(
            `
            id,
            action,
            target_type,
            target_id,
            reason,
            created_at,
            actor:profiles(full_name)
          `,
          )
          .order("created_at", { ascending: false })
          .limit(50)

        // Get moderation votes for all pending items
        const pendingItemIds = [
          ...(pendingThreads?.map(t => t.id) || []),
          ...(pendingReplies?.map(r => r.id) || [])
        ]
        
        const { data: moderationVotesData } = await supabase
          .from("moderation_votes")
          .select(`
            id,
            target_id,
            target_type,
            voter_id,
            vote,
            reason,
            created_at,
            voter:profiles(full_name, role)
          `)
          .in("target_id", pendingItemIds)
          .order("created_at", { ascending: false })

        // Group votes by target_id
        const votesByTarget: Record<string, any[]> = {}
        moderationVotesData?.forEach(vote => {
          if (!votesByTarget[vote.target_id]) {
            votesByTarget[vote.target_id] = []
          }
          votesByTarget[vote.target_id].push(vote)
        })

        // Combine and format pending items
        const formattedPendingItems = [
          ...(pendingThreads?.map((thread) => ({
            id: thread.id,
            type: "thread" as const,
            title: thread.title,
            body: thread.body,
            author: thread.author || { full_name: "Unknown", email: "" },
            created_at: thread.created_at,
            flag_reason: thread.flags?.[0]?.reason,
          })) || []),
          ...(pendingReplies?.map((reply) => ({
            id: reply.id,
            type: "reply" as const,
            body: reply.body,
            author: reply.author || { full_name: "Unknown", email: "" },
            created_at: reply.created_at,
            flag_reason: reply.flags?.[0]?.reason,
            thread_title: reply.thread?.title,
          })) || []),
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        setPendingItems(formattedPendingItems)
        setModerationEvents(moderationEvents?.map(event => ({
          ...event,
          actor: event.actor || { full_name: "Unknown" }
        })) || [])
        setModerationVotes(votesByTarget)
      } catch (error) {
        console.error("Error loading moderation data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!profile) {
    return null
  }

  return (
    <AppShell user={profile}>
      <ModerationDashboardClient
        pendingItems={pendingItems}
        moderationEvents={moderationEvents}
        moderationVotes={moderationVotes}
        currentUserId={user.id}
        currentUserRole={profile.role}
      />
    </AppShell>
  )
}

// Client component to handle moderation actions
function ModerationDashboardClient({
  pendingItems,
  moderationEvents,
  moderationVotes,
  currentUserId,
  currentUserRole,
}: {
  pendingItems: PendingItem[]
  moderationEvents: ModerationEvent[]
  moderationVotes: Record<string, any[]>
  currentUserId: string
  currentUserRole: string
}) {
  const handleVote = async (targetType: string, targetId: string, vote: 'keep' | 'edit' | 'delete', reason?: string) => {
    const response = await fetch("/api/moderation/vote", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ target_type: targetType, target_id: targetId, vote, reason }),
    })

    if (!response.ok) {
      throw new Error("Failed to vote")
    }

    // Refresh the page to show updated data
    window.location.reload()
  }

  const handleApprove = async (targetType: string, targetId: string) => {
    const response = await fetch("/api/moderation/approve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ target_type: targetType, target_id: targetId }),
    })

    if (!response.ok) {
      throw new Error("Failed to approve item")
    }

    // Refresh the page to show updated data
    window.location.reload()
  }

  const handleReject = async (targetType: string, targetId: string, reason: string) => {
    const response = await fetch("/api/moderation/reject", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ target_type: targetType, target_id: targetId, reason }),
    })

    if (!response.ok) {
      throw new Error("Failed to reject item")
    }

    // Refresh the page to show updated data
    window.location.reload()
  }

  return (
    <ModerationDashboard
      pendingItems={pendingItems}
      moderationEvents={moderationEvents}
      moderationVotes={moderationVotes}
      currentUserId={currentUserId}
      currentUserRole={currentUserRole}
      onVote={handleVote}
      onApprove={handleApprove}
      onReject={handleReject}
    />
  )
}
