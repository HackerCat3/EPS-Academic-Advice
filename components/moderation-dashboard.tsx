"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Check, X, Eye, AlertTriangle, Clock, FileText } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useState } from "react"

interface PendingItem {
  id: string
  type: "thread" | "reply"
  title?: string
  body: string
  author: {
    full_name: string
    email: string
  }
  created_at: string
  flag_reason?: string
  thread_title?: string
}

interface ModerationEvent {
  id: string
  action: string
  target_type: string
  target_id: string
  reason?: string
  created_at: string
  actor: {
    full_name: string
  }
}

interface ModerationDashboardProps {
  pendingItems: PendingItem[]
  moderationEvents: ModerationEvent[]
  onApprove: (targetType: string, targetId: string) => Promise<void>
  onReject: (targetType: string, targetId: string, reason: string) => Promise<void>
}

export function ModerationDashboard({ pendingItems, moderationEvents, onApprove, onReject }: ModerationDashboardProps) {
  const [rejectReason, setRejectReason] = useState("")
  const [rejectingItem, setRejectingItem] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleApprove = async (item: PendingItem) => {
    setIsLoading(true)
    try {
      await onApprove(item.type, item.id)
    } catch (error) {
      console.error("Failed to approve item:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = async (item: PendingItem) => {
    if (!rejectReason.trim()) return

    setIsLoading(true)
    try {
      await onReject(item.type, item.id, rejectReason.trim())
      setRejectReason("")
      setRejectingItem(null)
    } catch (error) {
      console.error("Failed to reject item:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-[#10316B]">Moderation Dashboard</h1>
        <p className="text-muted-foreground mt-1">Review flagged content and manage community standards</p>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingItems.length})
          </TabsTrigger>
          <TabsTrigger value="flagged" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Flagged
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Audit Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingItems.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No items pending review at this time.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            pendingItems.map((item) => (
              <Card key={item.id} className="bg-white">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="capitalize">
                          {item.type}
                        </Badge>
                        {item.flag_reason && (
                          <Badge variant="destructive" className="text-xs">
                            {item.flag_reason.replace("off_topic:", "").replace("_", " ")}
                          </Badge>
                        )}
                      </div>
                      {item.title && (
                        <CardTitle className="text-lg font-serif text-[#10316B] mb-1">{item.title}</CardTitle>
                      )}
                      {item.thread_title && (
                        <p className="text-sm text-muted-foreground mb-1">Reply to: {item.thread_title}</p>
                      )}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>by {item.author.full_name}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="prose prose-sm max-w-none">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap bg-gray-50 p-3 rounded-md">
                        {item.body}
                      </p>
                    </div>

                    {rejectingItem === item.id ? (
                      <div className="space-y-3 border-t pt-4">
                        <Textarea
                          placeholder="Provide a reason for rejection..."
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          rows={3}
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleReject(item)}
                            disabled={!rejectReason.trim() || isLoading}
                            variant="destructive"
                            size="sm"
                          >
                            Confirm Rejection
                          </Button>
                          <Button
                            onClick={() => {
                              setRejectingItem(null)
                              setRejectReason("")
                            }}
                            variant="outline"
                            size="sm"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 pt-4 border-t">
                        <Button
                          onClick={() => handleApprove(item)}
                          disabled={isLoading}
                          className="bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => setRejectingItem(item.id)}
                          disabled={isLoading}
                          variant="destructive"
                          size="sm"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        {item.type === "thread" && (
                          <Button asChild variant="outline" size="sm">
                            <a href={`/threads/${item.id}`} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-4 w-4 mr-1" />
                              Preview
                            </a>
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="flagged" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Flagged items functionality coming soon.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Currently, flagged items are automatically moved to the pending queue.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          {moderationEvents.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No moderation actions recorded yet.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-serif">Recent Moderation Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {moderationEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={
                            event.action === "approve"
                              ? "default"
                              : event.action === "reject" || event.action === "delete"
                                ? "destructive"
                                : "secondary"
                          }
                          className="capitalize"
                        >
                          {event.action}
                        </Badge>
                        <span className="text-sm">
                          <span className="font-medium">{event.actor.full_name}</span> {event.action}d a{" "}
                          {event.target_type}
                        </span>
                        {event.reason && <span className="text-xs text-muted-foreground">({event.reason})</span>}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
