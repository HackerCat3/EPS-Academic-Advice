import { createClient } from "@/lib/supabase/server"
import { offTopicCheck } from "@/lib/off-topic-check"
import { type NextRequest, NextResponse } from "next/server"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Authentication is required." }, { status: 401 })
    }

    const body = await request.json()
    const { body: replyBody, is_anonymous, attachments } = body

    // Validate input
    if (!replyBody?.trim()) {
      return NextResponse.json({ error: "The submitted data is incomplete or invalid." }, { status: 400 })
    }

    // Check if thread exists and is open
    const { data: thread, error: threadError } = await supabase.from("threads").select("*").eq("id", id).single()

    if (threadError || !thread) {
      return NextResponse.json({ error: "The requested resource was not found." }, { status: 404 })
    }

    if (thread.status === "locked") {
      return NextResponse.json({ error: "This thread is locked and cannot accept new replies." }, { status: 403 })
    }

    // Run off-topic check
    const offTopicResult = offTopicCheck(replyBody)
    const isPending = offTopicResult.outcome === "block"

    // Create reply
    const { data: reply, error: replyError } = await supabase
      .from("replies")
      .insert({
        thread_id: id,
        author_id: user.id,
        body: replyBody.trim(),
        is_anonymous: is_anonymous || false,
        is_pending: isPending,
        attachments: attachments || [],
      })
      .select()
      .single()

    if (replyError) {
      console.error("Reply creation error:", replyError)
      return NextResponse.json({ error: "Failed to create reply." }, { status: 500 })
    }

    // If blocked, create a flag
    if (isPending) {
      await supabase.from("flags").insert({
        target_type: "reply",
        target_id: reply.id,
        reason: offTopicResult.reason || "off_topic",
      })

      return NextResponse.json({ pending: true, id: reply.id })
    }

    return NextResponse.json({ id: reply.id })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 })
  }
}
