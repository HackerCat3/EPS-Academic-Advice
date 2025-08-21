"use client"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppShell } from "@/components/app-shell"
import { ReplyItem } from "@/components/reply-item"
import { ReplyComposer } from "@/components/reply-composer"
import { Banner } from "@/components/banner"
import { VisibilityBadge } from "@/components/visibility-badge"
import { AnonBadge } from "@/components/anon-badge"
import { formatDistanceToNow } from "date-fns"
import { ThreadActions } from "@/components/thread-actions"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ThreadDetailPage({ params }: PageProps) {
  const { id } = await params
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

  // Get thread with author info
  const { data: thread, error: threadError } = await supabase
    .from("threads")
    .select(
      `
      *,
      author:profiles(full_name)
    `,
    )
    .eq("id", id)
    .single()

  if (threadError || !thread) {
    redirect("/")
  }

  // Check if user can view this thread
  if (thread.visibility === "teachers_only" && !["teacher", "admin"].includes(profile.role)) {
    redirect("/")
  }

  // Get replies with author info
  const { data: replies } = await supabase
    .from("replies")
    .select(
      `
      *,
      author:profiles(full_name)
    `,
    )
    .eq("thread_id", id)
    .eq("is_pending", false)
    .order("created_at", { ascending: true })

  const authorName = thread.is_anonymous ? "Anonymous" : thread.author?.full_name || "Unknown"

  return (
    <AppShell user={profile}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Teachers' Lounge Banner */}
        {thread.visibility === "teachers_only" && (
          <Banner variant="teachers">
            <div className="flex items-center justify-center">
              <span className="font-serif text-lg">Teachers' Lounge</span>
            </div>
          </Banner>
        )}

        {/* Locked Banner */}
        {thread.status === "locked" && (
          <Banner variant="locked">This thread is locked. Further responses are disabled.</Banner>
        )}

        {/* Thread Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-serif font-bold text-[#10316B] mb-2">{thread.title}</h1>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>by {authorName}</span>
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <VisibilityBadge visibility={thread.visibility} />
                {thread.is_anonymous && <AnonBadge />}
              </div>
            </div>

            {/* Body */}
            <div className="prose prose-sm max-w-none">
              <p className="text-base leading-relaxed whitespace-pre-wrap">{thread.body}</p>
            </div>

            {/* Actions */}
            <ThreadActions thread={thread} currentUserRole={profile.role} />
          </div>
        </div>

        {/* Replies Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-serif font-semibold text-[#10316B]">Responses ({replies?.length || 0})</h2>

          {replies && replies.length > 0 ? (
            <div className="space-y-4">
              {replies.map((reply) => (
                <ReplyItem key={reply.id} reply={reply} currentUserRole={profile.role} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No responses yet. Be the first to contribute to this discussion.</p>
            </div>
          )}
        </div>

        {/* Reply Composer */}
        <ReplyComposer
          onSubmit={async (body: string, isAnonymous: boolean) => {
            const response = await fetch(`/api/threads/${id}/replies`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ body, is_anonymous: isAnonymous }),
            })

            if (!response.ok) {
              throw new Error("Failed to post reply")
            }

            // Refresh the page to show the new reply
            window.location.reload()
          }}
          disabled={thread.status === "locked"}
        />
      </div>
    </AppShell>
  )
}
