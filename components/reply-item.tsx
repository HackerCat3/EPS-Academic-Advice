"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileAttachmentsDisplay } from "@/components/file-attachments-display"
import { ReactionButtons } from "@/components/reaction-buttons"
import { Trash2 } from 'lucide-react'
import { formatDistanceToNow } from "date-fns"

interface ReplyItemProps {
  reply: {
    id: string
    body: string
    is_anonymous: boolean
    created_at: string
    attachments?: Array<{name: string, url: string, type: string}>
    author?: {
      full_name: string
    }
  }
  currentUserRole?: string
  onDelete?: (replyId: string) => void
  reactions?: Array<{id: string, user_id: string, reaction_type: 'approve' | 'disagree' | 'concern'}>
  currentUserId?: string
  showReactions?: boolean
}

export function ReplyItem({ 
  reply, 
  currentUserRole, 
  onDelete, 
  reactions = [], 
  currentUserId, 
  showReactions = false 
}: ReplyItemProps) {
  const canModerate = currentUserRole === "teacher" || currentUserRole === "admin"
  const authorName = reply.is_anonymous ? "Anonymous" : reply.author?.full_name || "Unknown"

  return (
    <Card className="bg-white">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
              <span className="font-medium">{authorName}</span>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}</span>
            </div>
            <div className="prose prose-sm max-w-none">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{reply.body}</p>
            </div>
            {reply.attachments && reply.attachments.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <FileAttachmentsDisplay attachments={reply.attachments} />
              </div>
            )}
            {showReactions && (
              <div className="mt-3 pt-3 border-t">
                <ReactionButtons
                  targetType="reply"
                  targetId={reply.id}
                  reactions={reactions}
                  currentUserId={currentUserId}
                  userRole={currentUserRole}
                />
              </div>
            )}
          </div>
          {canModerate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete?.(reply.id)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
