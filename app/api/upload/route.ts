import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Authentication is required." }, { status: 401 })
    }

    // Get user profile to check if they're a teacher
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (!profile || !["teacher", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "You lack the authorization to perform this action." }, { status: 403 })
    }

    const formData = await request.formData()
    const files = formData.getAll("files") as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided." }, { status: 400 })
    }

    const uploadedFiles = []

    for (const file of files) {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: `File ${file.name} is too large. Maximum size is 10MB.` }, { status: 400 })
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'image/jpeg', 'image/png', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ error: `File type ${file.type} is not supported.` }, { status: 400 })
      }

      // Generate unique filename
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const fileExtension = file.name.split('.').pop()
      const uniqueFileName = `${timestamp}-${randomString}.${fileExtension}`

      // Convert File to ArrayBuffer then to Uint8Array for Supabase
      const arrayBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('teacher-attachments')
        .upload(`${user.id}/${uniqueFileName}`, uint8Array, {
          contentType: file.type,
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        return NextResponse.json({ error: `Failed to upload ${file.name}.` }, { status: 500 })
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('teacher-attachments')
        .getPublicUrl(uploadData.path)

      uploadedFiles.push({
        name: file.name,
        url: urlData.publicUrl,
        size: file.size,
        type: file.type,
        path: uploadData.path
      })
    }

    return NextResponse.json({ files: uploadedFiles })
  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 })
  }
}
