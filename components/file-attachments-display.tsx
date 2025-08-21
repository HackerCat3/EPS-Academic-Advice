"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, ImageIcon, File, Download } from 'lucide-react'

interface FileAttachment {
  name: string
  url: string
  size?: number
  type?: string
}

interface FileAttachmentsDisplayProps {
  attachments: FileAttachment[]
  className?: string
}

export function FileAttachmentsDisplay({ attachments, className }: FileAttachmentsDisplayProps) {
  if (!attachments || attachments.length === 0) {
    return null
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
      return <ImageIcon className="h-4 w-4" />
    } else if (['pdf', 'docx', 'pptx'].includes(extension || '')) {
      return <FileText className="h-4 w-4" />
    }
    return <File className="h-4 w-4" />
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleDownload = async (attachment: FileAttachment) => {
    try {
      const response = await fetch(attachment.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = attachment.name
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {attachments.length} attachment{attachments.length !== 1 ? 's' : ''}
        </Badge>
      </div>
      <div className="grid gap-2">
        {attachments.map((attachment, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
            <div className="flex items-center gap-3">
              {getFileIcon(attachment.name)}
              <div>
                <p className="text-sm font-medium">{attachment.name}</p>
                {attachment.size && (
                  <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDownload(attachment)}
              className="text-[#10316B] hover:text-[#10316B]/80"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
