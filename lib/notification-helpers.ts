import { createClient } from "@/lib/supabase/server"

export type NotificationType = "flagged_post" | "mention" | "announcement"

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message: string
  relatedId?: string
}

export async function createNotification({
  userId,
  type,
  title,
  message,
  relatedId,
}: CreateNotificationParams): Promise<boolean> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      type,
      title,
      message,
      related_id: relatedId,
      is_read: false,
    })

    if (error) {
      console.error("Failed to create notification:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Notification creation error:", error)
    return false
  }
}

export async function createFlaggedPostNotification(postId: string, postTitle: string): Promise<void> {
  try {
    const supabase = await createClient()

    // Get all teachers and admins to notify
    const { data: teachers } = await supabase.from("profiles").select("id").in("role", ["teacher", "admin"])

    if (teachers) {
      const notifications = teachers.map((teacher) => ({
        user_id: teacher.id,
        type: "flagged_post" as NotificationType,
        title: "Post Flagged for Review",
        message: `A post "${postTitle}" has been flagged and requires moderation review.`,
        related_id: postId,
        is_read: false,
      }))

      await supabase.from("notifications").insert(notifications)
    }
  } catch (error) {
    console.error("Failed to create flagged post notifications:", error)
  }
}

export async function createMentionNotification(
  mentionedUserId: string,
  mentionerName: string,
  postTitle: string,
  postId: string,
): Promise<void> {
  try {
    await createNotification({
      userId: mentionedUserId,
      type: "mention",
      title: "You were mentioned",
      message: `${mentionerName} mentioned you in "${postTitle}".`,
      relatedId: postId,
    })
  } catch (error) {
    console.error("Failed to create mention notification:", error)
  }
}

export async function createAnnouncementNotification(announcementTitle: string, announcementId: string): Promise<void> {
  try {
    const supabase = await createClient()

    // Get all teachers to notify about announcements
    const { data: teachers } = await supabase.from("profiles").select("id").in("role", ["teacher", "admin"])

    if (teachers) {
      const notifications = teachers.map((teacher) => ({
        user_id: teacher.id,
        type: "announcement" as NotificationType,
        title: "New Announcement",
        message: `A new announcement "${announcementTitle}" has been posted.`,
        related_id: announcementId,
        is_read: false,
      }))

      await supabase.from("notifications").insert(notifications)
    }
  } catch (error) {
    console.error("Failed to create announcement notifications:", error)
  }
}

export function extractMentions(text: string): string[] {
  const mentionRegex = /@(\w+)/g
  const mentions: string[] = []
  let match

  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1])
  }

  return mentions
}
