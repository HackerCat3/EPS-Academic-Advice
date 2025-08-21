"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { SearchBar } from "@/components/search-bar"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, GraduationCap, Home, Shield } from "lucide-react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"

interface AppShellProps {
  children: React.ReactNode
  user?: {
    email: string
    full_name: string
    role: string
    id: string
  }
  onSearch?: (query: string) => void
}

export function AppShell({ children, user, onSearch }: AppShellProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const isTeachersArea = pathname?.startsWith("/teachers")
  const isModerationArea = pathname?.startsWith("/moderation")

  return (
    <div className="min-h-screen bg-[#F2F7FF]">
      {/* Navigation Header */}
      <header className="bg-[#10316B] text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* App Name and Navigation */}
            <div className="flex items-center gap-6">
              <Link href="/" className="text-xl font-serif font-bold hover:opacity-90">
                EPS Academic Advice
              </Link>

              {/* Navigation Links */}
              {user && (
                <nav className="hidden md:flex items-center gap-4">
                  <Link
                    href="/"
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      !isTeachersArea && !isModerationArea
                        ? "bg-white/20 text-white"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <Home className="h-4 w-4" />
                    Public Discussions
                  </Link>
                  {(user.role === "teacher" || user.role === "admin") && (
                    <>
                      <Link
                        href="/teachers"
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          isTeachersArea ? "bg-white/20 text-white" : "text-white/80 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        <GraduationCap className="h-4 w-4" />
                        Teachers' Lounge
                      </Link>
                      <Link
                        href="/moderation"
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          isModerationArea
                            ? "bg-white/20 text-white"
                            : "text-white/80 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        <Shield className="h-4 w-4" />
                        Moderation
                      </Link>
                    </>
                  )}
                </nav>
              )}
            </div>

            {/* Search and User Menu */}
            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <div className="hidden sm:block">
                <SearchBar placeholder="Search discussions..." className="w-64" onSearch={onSearch} />
              </div>

              {/* Notifications Dropdown */}
              {user && (user.role === "teacher" || user.role === "admin") && <NotificationsDropdown userId={user.id} />}

              {/* User Menu */}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-white hover:bg-white/10 gap-2">
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline">{user.full_name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5 text-sm">
                      <div className="font-medium">{user.full_name}</div>
                      <div className="text-muted-foreground">{user.email}</div>
                      <div className="text-xs text-muted-foreground capitalize">{user.role}</div>
                    </div>
                    <DropdownMenuSeparator />
                    {(user.role === "teacher" || user.role === "admin") && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/teachers">Teachers' Lounge</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/moderation">Moderation</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  )
}
