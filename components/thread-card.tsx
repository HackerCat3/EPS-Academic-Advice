"use client"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Lock, Unlock, Eye, MessageSquare } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

interface ThreadCardProps {
  thread: {
    id: string
    title: string
    body: string
    is_anonymous: boolean
    visibility: "public" | "teachers_only"
    status: "open" | "locked"
    created_at: string
    author?: {
      full_name: string
    }
    reply_count?: number
  }
  currentUserRole?: string
  onLock?: (threadId: string) => void
  onUnlock?: (threadId: string) => void
}

export function ThreadCard({ thread, currentUserRole, onLock, onUnlock }: ThreadCardProps) {
  const canModerate = currentUserRole === "teacher" || currentUserRole === "admin"
  const authorName = thread.is_anonymous ? "Anonymous" : thread.author?.full_name || "Unknown"

  const excerpt = thread.body.length > 150 ? `${thread.body.substring(0, 150)}...` : thread.body

  return (
    <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <Link href={`/threads/${thread.id}`} className="block group">
              <h3 className="text-lg font-serif font-semibold text-[#10316B] group-hover:underline line-clamp-2">
                {thread.title}
              </h3>
            </Link>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <span>by {authorName}</span>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {thread.visibility === "teachers_only" && (
              <Badge variant="secondary" className="text-xs">
                Teachers Only
              </Badge>
            )}
            {thread.status === "locked" && (
              <Badge variant="destructive" className="text-xs">
                Locked
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{excerpt}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>{thread.reply_count || 0} replies</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/threads/${thread.id}`}>
                <Eye className="h-4 w-4 mr-1" />
                View
              </Link>
            </Button>
            {canModerate && (
              <>
                {thread.status === "open" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onLock?.(thread.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Lock className="h-4 w-4 mr-1" />
                    Lock
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUnlock?.(thread.id)}
                    className="text-green-600 hover:text-green-600"
                  >
                    <Unlock className="h-4 w-4 mr-1" />
                    Unlock
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
