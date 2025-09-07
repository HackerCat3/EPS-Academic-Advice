import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
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

export default async function ModerationPage() {
  const supabase = await createClient()

  // Get user and profile
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile) {
    redirect("/auth/login")
  }

  // Check if user is teacher or admin
  if (!["teacher", "admin"].includes(profile.role)) {
    redirect("/")
  }

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

  // Combine and format pending items
  const pendingItems = [
    ...(pendingThreads?.map((thread) => ({
      id: thread.id,
      type: "thread" as const,
      title: thread.title,
      body: thread.body,
      author: thread.author,
      created_at: thread.created_at,
      flag_reason: thread.flags?.[0]?.reason,
    })) || []),
    ...(pendingReplies?.map((reply) => ({
      id: reply.id,
      type: "reply" as const,
      body: reply.body,
      author: reply.author,
      created_at: reply.created_at,
      flag_reason: reply.flags?.[0]?.reason,
      thread_title: reply.thread?.title,
    })) || []),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <AppShell user={profile}>
      <ModerationDashboardClient
        pendingItems={pendingItems}
        moderationEvents={moderationEvents || []}
      />
    </AppShell>
  )
}

// Client component to handle moderation actions
function ModerationDashboardClient({
  pendingItems,
  moderationEvents,
}: {
  pendingItems: PendingItem[]
  moderationEvents: ModerationEvent[]
}) {
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
      onApprove={handleApprove}
      onReject={handleReject}
    />
  )
}
