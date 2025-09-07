import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Authentication is required.", userError }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ 
        error: "User profile not found.", 
        profileError,
        userId: user.id 
      }, { status: 404 })
    }

    // Test basic insert without problematic fields
    const testThread = {
      author_id: user.id,
      title: "Test Thread",
      body: "Test body content",
      is_anonymous: false,
      visibility: "teachers_only",
      is_pending: false,
    }

    console.log("Debug info:", {
      userId: user.id,
      profile: profile,
      testThread: testThread
    })

    const { data: thread, error: threadError } = await supabase
      .from("threads")
      .insert(testThread)
      .select()
      .single()

    if (threadError) {
      console.error("Thread creation error:", threadError)
      return NextResponse.json({ 
        error: "Failed to create thread.",
        threadError,
        debugInfo: {
          userId: user.id,
          profile,
          testThread
        }
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      thread,
      debugInfo: {
        userId: user.id,
        profile
      }
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "An unexpected error occurred.", details: error }, { status: 500 })
  }
}