"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileUpload } from "@/components/file-upload"
import { RichTextEditor } from "@/components/rich-text-editor"
import { useState } from "react"

interface ReplyFormProps {
  action: (formData: FormData) => Promise<void>
  disabled?: boolean
  allowAttachments?: boolean
}

export function ReplyForm({ action, disabled, allowAttachments = false }: ReplyFormProps) {
  const [body, setBody] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (disabled || isSubmitting || !body.trim()) return
    
    // Store form reference before async operations
    const form = event.currentTarget
    
    setIsSubmitting(true)
    try {
      const formData = new FormData(form)
      formData.set('body', body)
      
      if (allowAttachments && files.length > 0) {
        const uploadFormData = new FormData()
        files.forEach(file => {
          uploadFormData.append('files', file)
        })

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData
        })

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json()
          formData.append('attachments', JSON.stringify(uploadResult.files))
        }
      }

      await action(formData)
      setFiles([]) // Clear files after successful submission
      setBody("") // Clear rich text editor
      
      // Reset form with null check
      if (form) {
        form.reset()
      }
    } catch (error) {
      console.error('Reply submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-serif">Add a Response</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Your Response <span className="text-destructive">*</span>
            </label>
            <RichTextEditor
              value={body}
              onChange={setBody}
              placeholder="Share your thoughts, insights, or questions..."
              disabled={disabled || isSubmitting}
              rows={4}
            />
          </div>

          {allowAttachments && (
            <div className="space-y-2">
              <label className="text-sm font-medium">File Attachments</label>
              <FileUpload 
                onFilesChange={setFiles}
                disabled={disabled || isSubmitting}
                maxFiles={3}
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="is_anonymous" 
              name="is_anonymous" 
              value="true" 
              disabled={disabled || isSubmitting} 
            />
            <label
              htmlFor="is_anonymous"
              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Post anonymously
            </label>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={disabled || isSubmitting || !body.trim()}
              className="bg-[#10316B] hover:bg-[#10316B]/90"
            >
              {isSubmitting ? "Posting..." : disabled ? "Locked" : "Post Response"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
