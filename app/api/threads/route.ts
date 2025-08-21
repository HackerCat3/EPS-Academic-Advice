import { createClient } from "@/lib/supabase/server"
import { offTopicCheck } from "@/lib/off-topic-check"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Authentication is required." }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "User profile not found." }, { status: 404 })
    }

    const body = await request.json()
    const { title, body: threadBody, isAnonymous, visibility } = body

    // Validate input
    if (!title?.trim() || !threadBody?.trim()) {
      return NextResponse.json({ error: "The submitted data is incomplete or invalid." }, { status: 400 })
    }

    // Check if user can create teachers_only threads
    if (visibility === "teachers_only" && !["teacher", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "You lack the authorization to perform this action." }, { status: 403 })
    }

    // Run off-topic check
    const offTopicResult = offTopicCheck(title + " " + threadBody)
    const isPending = offTopicResult.outcome === "block"

    // Create thread
    const { data: thread, error: threadError } = await supabase
      .from("threads")
      .insert({
        author_id: user.id,
        title: title.trim(),
        body: threadBody.trim(),
        is_anonymous: isAnonymous || false,
        visibility: visibility || "public",
        is_pending: isPending,
      })
      .select()
      .single()

    if (threadError) {
      console.error("Thread creation error:", threadError)
      return NextResponse.json({ error: "Failed to create thread." }, { status: 500 })
    }

    // If blocked, create a flag
    if (isPending) {
      await supabase.from("flags").insert({
        target_type: "thread",
        target_id: thread.id,
        reason: offTopicResult.reason || "off_topic",
      })

      return NextResponse.json({ pending: true, id: thread.id })
    }

    return NextResponse.json({ id: thread.id })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Authentication is required." }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query")
    const visibility = searchParams.get("visibility") || "public"
    const status = searchParams.get("status") || "open"

    let supabaseQuery = supabase
      .from("threads")
      .select(
        `
        *,
        author:profiles(full_name),
        replies(count)
      `,
      )
      .eq("is_pending", false)
      .eq("status", status)
      .order("created_at", { ascending: false })
      .limit(20)

    // Apply visibility filter
    if (visibility === "public") {
      supabaseQuery = supabaseQuery.eq("visibility", "public")
    } else if (visibility === "teachers_only" && profile && ["teacher", "admin"].includes(profile.role)) {
      supabaseQuery = supabaseQuery.eq("visibility", "teachers_only")
    }

    // Apply search filter
    if (query) {
      supabaseQuery = supabaseQuery.textSearch("title,body", query)
    }

    const { data: threads, error } = await supabaseQuery

    if (error) {
      console.error("Threads fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch threads." }, { status: 500 })
    }

    // Transform reply counts
    const threadsWithCounts = threads?.map((thread) => ({
      ...thread,
      reply_count: thread.replies?.[0]?.count || 0,
    }))

    return NextResponse.json({ threads: threadsWithCounts })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 })
  }
}
