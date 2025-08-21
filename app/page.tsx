"use client"

import { createClient } from "@/lib/supabase/server"
import { AppShell } from "@/components/app-shell"
import { ThreadList } from "@/components/thread-list"
import { SearchBar } from "@/components/search-bar"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

interface PageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function HomePage({ searchParams }: PageProps) {
  const { q: searchQuery } = await searchParams

  let supabase
  let user = null
  let authError = false

  try {
    supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()
    if (error) {
      console.error("[v0] Auth error:", error)
      authError = true
    } else {
      user = data.user
    }
  } catch (error) {
    console.error("[v0] Supabase client error:", error)
    authError = true
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-[#F2F7FF] flex items-center justify-center p-6">
        <div className="text-center space-y-6 max-w-md">
          <div className="space-y-2">
            <h1 className="text-3xl font-serif font-bold text-[#10316B]">EPS Academic Advice</h1>
            <p className="text-muted-foreground">
              Unable to connect to the authentication service. Please check your connection and try again.
            </p>
          </div>
          <Button onClick={() => window.location.reload()} className="w-full bg-[#10316B] hover:bg-[#10316B]/90">
            Retry Connection
          </Button>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F2F7FF] flex items-center justify-center p-6">
        <div className="text-center space-y-6 max-w-md">
          <div className="space-y-2">
            <h1 className="text-3xl font-serif font-bold text-[#10316B]">EPS Academic Advice</h1>
            <p className="text-muted-foreground">Please sign in to access the academic discussion platform</p>
          </div>
          <div className="space-y-3">
            <Button asChild className="w-full bg-[#10316B] hover:bg-[#10316B]/90">
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/auth/sign-up">Create Account</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  let profile = null
  try {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single()
    profile = data
  } catch (error) {
    console.error("[v0] Profile fetch error:", error)
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#F2F7FF] flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-xl font-serif font-bold text-[#10316B]">Profile Not Found</h2>
          <p className="text-muted-foreground">There was an issue loading your profile. Please try signing in again.</p>
          <Button asChild className="bg-[#10316B] hover:bg-[#10316B]/90">
            <Link href="/auth/login">Sign In Again</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Build query for threads
  let threadsQuery = supabase
    .from("threads")
    .select(
      `
      *,
      author:profiles(full_name),
      replies(count)
    `,
    )
    .eq("visibility", "public")
    .eq("is_pending", false)
    .order("created_at", { ascending: false })
    .limit(20)

  // Apply search filter if query exists
  if (searchQuery?.trim()) {
    threadsQuery = threadsQuery.textSearch("title,body", searchQuery.trim())
  }

  const { data: threads, error: threadsError } = await threadsQuery

  if (threadsError) {
    console.error("Error fetching threads:", threadsError)
  }

  const threadsWithCounts = threads?.map((thread) => ({
    ...thread,
    reply_count: thread.replies?.[0]?.count || 0,
  }))

  const isSearching = Boolean(searchQuery?.trim())

  return (
    <AppShell user={profile}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-[#10316B]">
              {isSearching ? "Search Results" : "Academic Discussions"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isSearching
                ? `Found ${threadsWithCounts?.length || 0} results for "${searchQuery}"`
                : "Engage in scholarly discourse with the EPS community"}
            </p>
          </div>
          <Button asChild className="bg-[#10316B] hover:bg-[#10316B]/90">
            <Link href="/threads/new">
              <Plus className="h-4 w-4 mr-2" />
              Submit an Academic Inquiry
            </Link>
          </Button>
        </div>

        {/* Search Bar */}
        <div className="max-w-md">
          <SearchBar placeholder="Search discussions by title or content..." />
        </div>

        {/* Results */}
        {threadsError ? (
          <div className="text-center py-8">
            <p className="text-destructive">Failed to load discussions. Please try again later.</p>
          </div>
        ) : !threadsWithCounts || threadsWithCounts.length === 0 ? (
          <EmptyState
            title={isSearching ? "No results found" : "No discussions yet"}
            message={
              isSearching
                ? `No discussions match your search for "${searchQuery}". Try different keywords or browse all discussions.`
                : "Be the first to start an academic discussion in the EPS community."
            }
            actionLabel={isSearching ? undefined : "Submit an Academic Inquiry"}
            actionHref={isSearching ? undefined : "/threads/new"}
            showSearch={isSearching}
          />
        ) : (
          <ThreadList threads={threadsWithCounts} currentUserRole={profile.role} />
        )}
      </div>
    </AppShell>
  )
}
