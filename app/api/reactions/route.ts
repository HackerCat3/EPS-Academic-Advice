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
    const { target_type, target_id, reaction_type } = body

    if (!target_type || !target_id || !reaction_type) {
      return NextResponse.json({ error: "The submitted data is incomplete or invalid." }, { status: 400 })
    }

    // Check if user already has a reaction on this item
    const { data: existingReaction } = await supabase
      .from("reactions")
      .select("*")
      .eq("user_id", user.id)
      .eq("target_type", target_type)
      .eq("target_id", target_id)
      .single()

    if (existingReaction) {
      if (existingReaction.reaction_type === reaction_type) {
        // Remove reaction if clicking the same type
        await supabase
          .from("reactions")
          .delete()
          .eq("id", existingReaction.id)
      } else {
        // Update reaction type
        await supabase
          .from("reactions")
          .update({ reaction_type })
          .eq("id", existingReaction.id)
      }
    } else {
      // Create new reaction
      await supabase
        .from("reactions")
        .insert({
          user_id: user.id,
          target_type,
          target_id,
          reaction_type,
        })
    }

    // Get updated reactions for this item
    const { data: reactions } = await supabase
      .from("reactions")
      .select("*")
      .eq("target_type", target_type)
      .eq("target_id", target_id)

    return NextResponse.json({ reactions: reactions || [] })
  } catch (error) {
    console.error("Reactions API error:", error)
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

    if (!profile || !["teacher", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "You lack the authorization to perform this action." }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const targetType = searchParams.get("target_type")
    const targetId = searchParams.get("target_id")

    if (!targetType || !targetId) {
      return NextResponse.json({ error: "Missing target_type or target_id." }, { status: 400 })
    }

    const { data: reactions } = await supabase
      .from("reactions")
      .select("*")
      .eq("target_type", targetType)
      .eq("target_id", targetId)

    return NextResponse.json({ reactions: reactions || [] })
  } catch (error) {
    console.error("Reactions API error:", error)
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 })
  }
}
