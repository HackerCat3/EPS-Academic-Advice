import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppShell } from "@/components/app-shell"
import { ThreadList } from "@/components/thread-list"
import { Banner } from "@/components/banner"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

interface PageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function TeachersLoungePage({ searchParams }: PageProps) {
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

  // Check if user is teacher or admin
  if (!["teacher", "admin"].includes(profile.role)) {
    redirect("/")
  }

  // Build query for teachers-only threads
  let threadsQuery = supabase
    .from("threads")
    .select(
      `
      *,
      author:profiles(full_name),
      replies(count)
    `,
    )
    .eq("visibility", "teachers_only")
    .eq("is_pending", false)
    .order("created_at", { ascending: false })
    .limit(20)

  // Apply search filter if query exists
  if (searchQuery?.trim()) {
    threadsQuery = threadsQuery.textSearch("title,body", searchQuery.trim())
  }

  const { data: threads } = await threadsQuery

  const threadsWithCounts = threads?.map((thread) => ({
    ...thread,
    reply_count: thread.replies?.[0]?.count || 0,
  }))

  const isSearching = Boolean(searchQuery?.trim())

  return (
    <AppShell user={profile}>
      <div className="space-y-6">
        {/* Teachers' Lounge Banner */}
        <Banner variant="teachers">
          <div className="flex items-center justify-center">
            <span className="font-serif text-xl">Teachers' Lounge</span>
          </div>
        </Banner>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-[#10316B]">
              {isSearching ? "Faculty Search Results" : "Private Faculty Discussions"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isSearching
                ? `Found ${threadsWithCounts?.length || 0} results for "${searchQuery}"`
                : "A confidential space for academic collaboration and professional discourse"}
            </p>
          </div>
          <Button asChild className="bg-[#10316B] hover:bg-[#10316B]/90">
            <Link href="/teachers/threads/new">
              <Plus className="h-4 w-4 mr-2" />
              Submit an Academic Inquiry
            </Link>
          </Button>
        </div>

        {/* Results */}
        {!threadsWithCounts || threadsWithCounts.length === 0 ? (
          <EmptyState
            title={isSearching ? "No results found" : "No faculty discussions yet"}
            message={
              isSearching
                ? `No faculty discussions match your search for "${searchQuery}". Try different keywords or browse all discussions.`
                : "No threads have been initiated in the Teachers' Lounge."
            }
            actionLabel={isSearching ? undefined : "Submit an Academic Inquiry"}
            actionHref={isSearching ? undefined : "/teachers/threads/new"}
            showSearch={isSearching}
          />
        ) : (
          <ThreadList threads={threadsWithCounts} currentUserRole={profile.role} />
        )}
      </div>
    </AppShell>
  )
}
