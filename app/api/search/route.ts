import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

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
    const query = searchParams.get("q")
    const visibility = searchParams.get("visibility") || "public"
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    if (!query?.trim()) {
      return NextResponse.json({ threads: [] })
    }

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
      .textSearch("title,body", query.trim())
      .order("created_at", { ascending: false })
      .limit(limit)

    // Apply visibility filter
    if (visibility === "public") {
      supabaseQuery = supabaseQuery.eq("visibility", "public")
    } else if (visibility === "teachers_only" && profile && ["teacher", "admin"].includes(profile.role)) {
      supabaseQuery = supabaseQuery.eq("visibility", "teachers_only")
    }

    const { data: threads, error } = await supabaseQuery

    if (error) {
      console.error("Search error:", error)
      return NextResponse.json({ error: "Search failed." }, { status: 500 })
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
