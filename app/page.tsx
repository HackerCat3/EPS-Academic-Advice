import { redirect } from "next/navigation"
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
  const supabase = await createClient()

  // Get user and profile
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile) {
    redirect("/auth/login")
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
