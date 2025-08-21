import { createClient } from "@/lib/supabase/server"
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
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (!profile || !["teacher", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "You lack the authorization to perform this action." }, { status: 403 })
    }

    const body = await request.json()
    const { target_type, target_id, reason } = body

    if (!target_type || !target_id || !reason) {
      return NextResponse.json({ error: "The submitted data is incomplete or invalid." }, { status: 400 })
    }

    // For admins, allow direct rejection
    if (profile.role === "admin") {
      // Delete the rejected item
      const tableName = target_type === "thread" ? "threads" : "replies"
      const { error: deleteError } = await supabase.from(tableName).delete().eq("id", target_id)

      if (deleteError) {
        console.error("Rejection error:", deleteError)
        return NextResponse.json({ error: "Failed to reject item." }, { status: 500 })
      }

      // Resolve any associated flags
      await supabase
        .from("flags")
        .update({
          resolved_by: user.id,
          resolution: "rejected",
          resolved_at: new Date().toISOString(),
        })
        .eq("target_type", target_type)
        .eq("target_id", target_id)
        .is("resolution", null)

      // Log moderation action
      await supabase.from("moderation_events").insert({
        actor_id: user.id,
        action: "reject",
        target_type,
        target_id,
        reason,
      })

      return NextResponse.json({ success: true })
    }

    // For teachers, redirect to voting system
    return NextResponse.json(
      {
        error: "Teachers must use the voting system. Please cast your vote instead of direct rejection.",
      },
      { status: 400 },
    )
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 })
  }
}
