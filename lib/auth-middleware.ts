import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function requireTeacherRole() {
  const supabase = await createClient()

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

  if (!["teacher", "admin"].includes(profile.role)) {
    redirect("/")
  }

  return { user, profile }
}

export async function requireAdminRole() {
  const supabase = await createClient()

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

  if (profile.role !== "admin") {
    redirect("/")
  }

  return { user, profile }
}
