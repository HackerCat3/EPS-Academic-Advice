"use client"

import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Lock, Unlock, Trash2 } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface ThreadActionsProps {
  thread: {
    id: string
    status: "open" | "locked"
  }
  currentUserRole?: string
}

export function ThreadActions({ thread, currentUserRole }: ThreadActionsProps) {
  const [showLockDialog, setShowLockDialog] = useState(false)
  const [showUnlockDialog, setShowUnlockDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const canModerate = currentUserRole === "teacher" || currentUserRole === "admin"

  if (!canModerate) {
    return null
  }

  const handleLock = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/threads/${thread.id}/lock`, {
        method: "POST",
      })
      if (response.ok) {
        window.location.reload()
      }
    } catch (error) {
      console.error("Failed to lock thread:", error)
    } finally {
      setIsLoading(false)
      setShowLockDialog(false)
    }
  }

  const handleUnlock = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/threads/${thread.id}/unlock`, {
        method: "POST",
      })
      if (response.ok) {
        window.location.reload()
      }
    } catch (error) {
      console.error("Failed to unlock thread:", error)
    } finally {
      setIsLoading(false)
      setShowUnlockDialog(false)
    }
  }

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/threads/${thread.id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        router.push("/")
      }
    } catch (error) {
      console.error("Failed to delete thread:", error)
    } finally {
      setIsLoading(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 pt-4 border-t">
        {thread.status === "open" ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLockDialog(true)}
            className="text-destructive hover:text-destructive"
          >
            <Lock className="h-4 w-4 mr-1" />
            Lock Thread
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUnlockDialog(true)}
            className="text-green-600 hover:text-green-600"
          >
            <Unlock className="h-4 w-4 mr-1" />
            Unlock Thread
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDeleteDialog(true)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete Thread
        </Button>
      </div>

      <ConfirmDialog
        open={showLockDialog}
        onOpenChange={setShowLockDialog}
        title="Lock Thread"
        description="Are you sure you want to lock this thread? Users will no longer be able to post replies."
        confirmText="Lock Thread"
        onConfirm={handleLock}
        variant="destructive"
      />

      <ConfirmDialog
        open={showUnlockDialog}
        onOpenChange={setShowUnlockDialog}
        title="Unlock Thread"
        description="Are you sure you want to unlock this thread? Users will be able to post replies again."
        confirmText="Unlock Thread"
        onConfirm={handleUnlock}
      />

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Thread"
        description="Are you sure you want to delete this thread? This action cannot be undone and will remove all replies."
        confirmText="Delete Thread"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  )
}
