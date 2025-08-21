"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X, AlertTriangle } from 'lucide-react'
import { useState, useEffect } from "react"

interface Reaction {
  id: string
  user_id: string
  reaction_type: 'approve' | 'disagree' | 'concern'
}

interface ReactionButtonsProps {
  targetType: 'thread' | 'reply'
  targetId: string
  reactions: Reaction[]
  currentUserId?: string
  userRole?: string
  disabled?: boolean
}

export function ReactionButtons({ 
  targetType, 
  targetId, 
  reactions = [], 
  currentUserId, 
  userRole,
  disabled = false 
}: ReactionButtonsProps) {
  const [currentReactions, setCurrentReactions] = useState<Reaction[]>(reactions)
  const [isLoading, setIsLoading] = useState(false)

  // Only show reactions for teachers and admins
  const canReact = userRole === 'teacher' || userRole === 'admin'

  if (!canReact) {
    return null
  }

  const reactionCounts = {
    approve: currentReactions.filter(r => r.reaction_type === 'approve').length,
    disagree: currentReactions.filter(r => r.reaction_type === 'disagree').length,
    concern: currentReactions.filter(r => r.reaction_type === 'concern').length,
  }

  const userReaction = currentReactions.find(r => r.user_id === currentUserId)

  const handleReaction = async (reactionType: 'approve' | 'disagree' | 'concern') => {
    if (disabled || isLoading || !currentUserId) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/reactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target_type: targetType,
          target_id: targetId,
          reaction_type: reactionType,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setCurrentReactions(result.reactions)
      }
    } catch (error) {
      console.error('Reaction error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const reactionButtons = [
    {
      type: 'approve' as const,
      icon: Check,
      label: 'Approve',
      color: 'text-green-600 hover:text-green-700 hover:bg-green-50',
      activeColor: 'text-green-700 bg-green-50',
      count: reactionCounts.approve,
    },
    {
      type: 'disagree' as const,
      icon: X,
      label: 'Disagree',
      color: 'text-red-600 hover:text-red-700 hover:bg-red-50',
      activeColor: 'text-red-700 bg-red-50',
      count: reactionCounts.disagree,
    },
    {
      type: 'concern' as const,
      icon: AlertTriangle,
      label: 'Concern',
      color: 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50',
      activeColor: 'text-yellow-700 bg-yellow-50',
      count: reactionCounts.concern,
    },
  ]

  return (
    <div className="flex items-center gap-2">
      {reactionButtons.map(({ type, icon: Icon, label, color, activeColor, count }) => {
        const isActive = userReaction?.reaction_type === type
        
        return (
          <Button
            key={type}
            variant="ghost"
            size="sm"
            onClick={() => handleReaction(type)}
            disabled={disabled || isLoading}
            className={`h-8 px-2 ${isActive ? activeColor : color}`}
            title={label}
          >
            <Icon className="h-4 w-4" />
            {count > 0 && (
              <Badge 
                variant="secondary" 
                className="ml-1 h-5 px-1.5 text-xs"
              >
                {count}
              </Badge>
            )}
          </Button>
        )
      })}
    </div>
  )
}
