import { ThreadCard } from "./thread-card"

interface Thread {
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

interface ThreadListProps {
  threads: Thread[]
  currentUserRole?: string
  onLock?: (threadId: string) => void
  onUnlock?: (threadId: string) => void
  emptyMessage?: string
}

export function ThreadList({ threads, currentUserRole, onLock, onUnlock, emptyMessage }: ThreadListProps) {
  if (threads.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{emptyMessage || "There are no inquiries at present."}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {threads.map((thread) => (
        <ThreadCard
          key={thread.id}
          thread={thread}
          currentUserRole={currentUserRole}
          onLock={onLock}
          onUnlock={onUnlock}
        />
      ))}
    </div>
  )
}
