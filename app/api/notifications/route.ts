import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
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

    // Get user profile to check role
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (!profile || !["teacher", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "You lack the authorization to perform this action." }, { status: 403 })
    }

    // Fetch notifications for the user
    const { data: notifications, error: notificationsError } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)

    if (notificationsError) {
      console.error("Notifications fetch error:", notificationsError)
      return NextResponse.json({ error: "Failed to fetch notifications." }, { status: 500 })
    }

    // Count unread notifications
    const unreadCount = notifications?.filter((n) => !n.is_read).length || 0

    return NextResponse.json({
      notifications: notifications || [],
      unreadCount,
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 })
  }
}
