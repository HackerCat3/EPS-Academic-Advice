import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Get user profile
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (!profile || !["teacher", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "You lack the authorization to perform this action." }, { status: 403 })
    }

    // Delete the thread (cascades to replies)
    const { error: deleteError } = await supabase.from("threads").delete().eq("id", id)

    if (deleteError) {
      console.error("Thread deletion error:", deleteError)
      return NextResponse.json({ error: "Failed to delete thread." }, { status: 500 })
    }

    // Log moderation action
    await supabase.from("moderation_events").insert({
      actor_id: user.id,
      action: "delete",
      target_type: "thread",
      target_id: id,
      reason: "Deleted by moderator",
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 })
  }
}
