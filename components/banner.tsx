import type React from "react"
import { cn } from "@/lib/utils"

interface BannerProps {
  children: React.ReactNode
  variant?: "default" | "teachers" | "locked"
  className?: string
}

export function Banner({ children, variant = "default", className }: BannerProps) {
  const baseClasses = "px-4 py-3 text-sm font-medium"

  const variantClasses = {
    default: "bg-blue-50 text-blue-800 border-blue-200",
    teachers: "bg-[#10316B] text-white border-b-4 border-[#FFE867]",
    locked: "bg-yellow-50 text-yellow-800 border-yellow-200",
  }

  return <div className={cn(baseClasses, variantClasses[variant], className)}>{children}</div>
}
