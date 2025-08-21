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
    const { target_type, target_id, vote, reason } = body

    if (!target_type || !target_id || !vote) {
      return NextResponse.json({ error: "The submitted data is incomplete or invalid." }, { status: 400 })
    }

    // Check if user already voted on this item
    const { data: existingVote } = await supabase
      .from("moderation_votes")
      .select("*")
      .eq("voter_id", user.id)
      .eq("target_type", target_type)
      .eq("target_id", target_id)
      .single()

    if (existingVote) {
      // Update existing vote
      await supabase
        .from("moderation_votes")
        .update({ vote, reason })
        .eq("id", existingVote.id)
    } else {
      // Create new vote
      await supabase
        .from("moderation_votes")
        .insert({
          voter_id: user.id,
          target_type,
          target_id,
          vote,
          reason,
        })
    }

    // Get all votes for this item to check if decision can be made
    const { data: allVotes } = await supabase
      .from("moderation_votes")
      .select(`
        *,
        voter:profiles(full_name, role)
      `)
      .eq("target_type", target_type)
      .eq("target_id", target_id)

    const adminVotes = allVotes?.filter(v => v.voter.role === 'admin') || []
    const teacherVotes = allVotes?.filter(v => v.voter.role === 'teacher') || []

    // Check if decision threshold is met
    const canDecide = adminVotes.length > 0 || teacherVotes.length >= 2

    if (canDecide) {
      // Determine majority decision
      const voteCounts = {
        keep: allVotes?.filter(v => v.vote === 'keep').length || 0,
        edit: allVotes?.filter(v => v.vote === 'edit').length || 0,
        delete: allVotes?.filter(v => v.vote === 'delete').length || 0,
      }

      const majorityVote = adminVotes[0]?.vote || 
        Object.entries(voteCounts).reduce((a, b) => voteCounts[a[0]] > voteCounts[b[0]] ? a : b)[0]

      // Auto-execute decision if clear majority or admin vote
      if (majorityVote === 'keep') {
        // Approve the item
        const tableName = target_type === "thread" ? "threads" : "replies"
        await supabase.from(tableName).update({ is_pending: false }).eq("id", target_id)

        // Log moderation action
        await supabase.from("moderation_events").insert({
          actor_id: user.id,
          action: "approve",
          target_type,
          target_id,
          reason: "Approved by voting consensus",
        })
      } else if (majorityVote === 'delete') {
        // Delete the item
        const tableName = target_type === "thread" ? "threads" : "replies"
        await supabase.from(tableName).delete().eq("id", target_id)

        // Log moderation action
        await supabase.from("moderation_events").insert({
          actor_id: user.id,
          action: "delete",
          target_type,
          target_id,
          reason: "Deleted by voting consensus",
        })
      }
    }

    return NextResponse.json({ success: true, votes: allVotes })
  } catch (error) {
    console.error("Voting API error:", error)
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 })
  }
}
