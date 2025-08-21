"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createReply(threadId: string, formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }
  
  const body = formData.get("body") as string
  const isAnonymous = formData.get("is_anonymous") === "true"
  const attachmentsString = formData.get("attachments") as string
  let attachments = []
  
  if (attachmentsString) {
    try {
      attachments = JSON.parse(attachmentsString)
    } catch (error) {
      console.error("Failed to parse attachments:", error)
    }
  }
  
  if (!body?.trim()) {
    throw new Error("Reply body is required")
  }
  
  const { error } = await supabase
    .from("replies")
    .insert({
      thread_id: threadId,
      author_id: user.id,
      body: body.trim(),
      is_anonymous: isAnonymous,
      attachments: attachments
    })
  
  if (error) {
    throw new Error("Failed to create reply")
  }
  
  revalidatePath(`/threads/${threadId}`)
}
