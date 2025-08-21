"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Check, X, Eye, AlertTriangle, Clock, FileText, Edit, Users } from 'lucide-react'
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

interface ModerationVote {
  id: string
  voter_id: string
  vote: 'keep' | 'edit' | 'delete'
  reason?: string
  created_at: string
  voter: {
    full_name: string
    role: string
  }
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
  moderationVotes: Record<string, ModerationVote[]>
  currentUserId: string
  currentUserRole: string
  onVote: (targetType: string, targetId: string, vote: 'keep' | 'edit' | 'delete', reason?: string) => Promise<void>
  onApprove?: (targetType: string, targetId: string) => Promise<void>
  onReject?: (targetType: string, targetId: string, reason: string) => Promise<void>
}

export function ModerationDashboard({ 
  pendingItems, 
  moderationEvents, 
  moderationVotes,
  currentUserId,
  currentUserRole,
  onVote,
  onApprove,
  onReject
}: ModerationDashboardProps) {
  const [voteReason, setVoteReason] = useState("")
  const [votingItem, setVotingItem] = useState<{ id: string, vote: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleVote = async (item: PendingItem, vote: 'keep' | 'edit' | 'delete') => {
    if (vote === 'edit' || vote === 'delete') {
      setVotingItem({ id: item.id, vote })
      return
    }

    setIsLoading(true)
    try {
      await onVote(item.type, item.id, vote)
    } catch (error) {
      console.error("Failed to vote:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVoteWithReason = async (item: PendingItem, vote: 'edit' | 'delete') => {
    if (!voteReason.trim()) return

    setIsLoading(true)
    try {
      await onVote(item.type, item.id, vote, voteReason.trim())
      setVoteReason("")
      setVotingItem(null)
    } catch (error) {
      console.error("Failed to vote:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getVotingStatus = (itemId: string) => {
    const votes = moderationVotes[itemId] || []
    const voteCounts = {
      keep: votes.filter(v => v.vote === 'keep').length,
      edit: votes.filter(v => v.vote === 'edit').length,
      delete: votes.filter(v => v.vote === 'delete').length,
    }
    
    const userVote = votes.find(v => v.voter_id === currentUserId)
    const adminVotes = votes.filter(v => v.voter.role === 'admin')
    const teacherVotes = votes.filter(v => v.voter.role === 'teacher')
    
    // Check if decision can be made
    const canDecide = adminVotes.length > 0 || teacherVotes.length >= 2
    const majorityVote = adminVotes[0]?.vote || 
      (teacherVotes.length >= 2 ? 
        Object.entries(voteCounts).reduce((a, b) => voteCounts[a[0]] > voteCounts[b[0]] ? a : b)[0] : 
        null)

    return {
      votes,
      voteCounts,
      userVote,
      canDecide,
      majorityVote,
      totalVotes: votes.length
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-[#10316B]">Moderation Dashboard</h1>
        <p className="text-muted-foreground mt-1">Collaborative review system - 2 teacher votes or 1 admin vote required</p>
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
            pendingItems.map((item) => {
              const votingStatus = getVotingStatus(item.id)
              
              return (
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
                          {votingStatus.totalVotes > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              {votingStatus.totalVotes} vote{votingStatus.totalVotes !== 1 ? 's' : ''}
                            </Badge>
                          )}
                          {votingStatus.canDecide && (
                            <Badge variant="default" className="text-xs bg-green-600">
                              Ready for Decision
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

                      {votingStatus.votes.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                          <h4 className="text-sm font-medium text-blue-900 mb-2">Current Votes:</h4>
                          <div className="space-y-2">
                            {votingStatus.votes.map((vote) => (
                              <div key={vote.id} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{vote.voter.full_name}</span>
                                  <Badge 
                                    variant={vote.vote === 'keep' ? 'default' : vote.vote === 'delete' ? 'destructive' : 'secondary'}
                                    className="text-xs capitalize"
                                  >
                                    {vote.vote}
                                  </Badge>
                                  {vote.voter.role === 'admin' && (
                                    <Badge variant="outline" className="text-xs">Admin</Badge>
                                  )}
                                </div>
                                <span className="text-muted-foreground">
                                  {formatDistanceToNow(new Date(vote.created_at), { addSuffix: true })}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-2 pt-2 border-t border-blue-200">
                            <div className="flex gap-4 text-xs text-blue-700">
                              <span>Keep: {votingStatus.voteCounts.keep}</span>
                              <span>Edit: {votingStatus.voteCounts.edit}</span>
                              <span>Delete: {votingStatus.voteCounts.delete}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {votingItem?.id === item.id ? (
                        <div className="space-y-3 border-t pt-4">
                          <Textarea
                            placeholder={`Provide a reason for ${votingItem.vote}...`}
                            value={voteReason}
                            onChange={(e) => setVoteReason(e.target.value)}
                            rows={3}
                          />
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => handleVoteWithReason(item, votingItem.vote as 'edit' | 'delete')}
                              disabled={!voteReason.trim() || isLoading}
                              variant={votingItem.vote === 'delete' ? 'destructive' : 'default'}
                              size="sm"
                            >
                              Confirm {votingItem.vote === 'delete' ? 'Delete' : 'Edit'} Vote
                            </Button>
                            <Button
                              onClick={() => {
                                setVotingItem(null)
                                setVoteReason("")
                              }}
                              variant="outline"
                              size="sm"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 pt-4 border-t">
                          {!votingStatus.userVote ? (
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => handleVote(item, 'keep')}
                                disabled={isLoading}
                                className="bg-green-600 hover:bg-green-700"
                                size="sm"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Keep
                              </Button>
                              <Button
                                onClick={() => handleVote(item, 'edit')}
                                disabled={isLoading}
                                variant="outline"
                                size="sm"
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit/Warning
                              </Button>
                              <Button
                                onClick={() => handleVote(item, 'delete')}
                                disabled={isLoading}
                                variant="destructive"
                                size="sm"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Delete
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
                          ) : (
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">
                                You voted: {votingStatus.userVote.vote}
                              </Badge>
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

                          {votingStatus.canDecide && currentUserRole === 'admin' && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                              <p className="text-sm text-yellow-800 mb-2">
                                <strong>Admin Override:</strong> Execute final decision based on votes?
                              </p>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => onApprove?.(item.type, item.id)}
                                  disabled={isLoading}
                                  className="bg-green-600 hover:bg-green-700"
                                  size="sm"
                                >
                                  Execute: Keep
                                </Button>
                                <Button
                                  onClick={() => onReject?.(item.type, item.id, `Majority vote: ${votingStatus.majorityVote}`)}
                                  disabled={isLoading}
                                  variant="destructive"
                                  size="sm"
                                >
                                  Execute: Delete
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })
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
