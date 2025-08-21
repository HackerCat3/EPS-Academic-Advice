"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MessageSquare, Users, FileText, Megaphone, Shield, Clock, Plus } from "lucide-react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

interface CategoryCount {
  category: string
  count: number
}

interface TeachersSidebarProps {
  categoryCounts: CategoryCount[]
  pendingCount: number
  userRole: string
}

export function TeachersSidebar({ categoryCounts, pendingCount, userRole }: TeachersSidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentCategory = searchParams.get("category")

  const categories = [
    {
      id: "all",
      name: "All Discussions",
      icon: MessageSquare,
      description: "View all faculty discussions",
      count: categoryCounts.reduce((sum, cat) => sum + cat.count, 0),
    },
    {
      id: "collaboration",
      name: "Academic Collaboration",
      icon: Users,
      description: "Teaching methods and resources",
      count: categoryCounts.find((c) => c.category === "collaboration")?.count || 0,
    },
    {
      id: "review",
      name: "Student Questions Review",
      icon: MessageSquare,
      description: "Flagged and removed posts",
      count: categoryCounts.find((c) => c.category === "review")?.count || 0,
    },
    {
      id: "policy",
      name: "Policy Discussions",
      icon: FileText,
      description: "School policies and moderation rules",
      count: categoryCounts.find((c) => c.category === "policy")?.count || 0,
    },
    {
      id: "announcements",
      name: "Announcements",
      icon: Megaphone,
      description: "Important notes from administration",
      count: categoryCounts.find((c) => c.category === "announcements")?.count || 0,
    },
  ]

  return (
    <div className="w-80 space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-serif font-semibold text-[#10316B]">Quick Actions</h3>
          <div className="space-y-2">
            <Button asChild className="w-full bg-[#10316B] hover:bg-[#10316B]/90">
              <Link href="/teachers/threads/new">
                <Plus className="h-4 w-4 mr-2" />
                New Discussion
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/moderation">
                <Shield className="h-4 w-4 mr-2" />
                Moderation Queue
                {pendingCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {pendingCount}
                  </Badge>
                )}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-serif font-semibold text-[#10316B]">Categories</h3>
          <div className="space-y-1">
            {categories.map((category) => {
              const isActive = currentCategory === category.id || (!currentCategory && category.id === "all")
              const Icon = category.icon

              return (
                <Link
                  key={category.id}
                  href={category.id === "all" ? "/teachers" : `/teachers?category=${category.id}`}
                  className={`flex items-center justify-between p-3 rounded-md transition-colors ${
                    isActive ? "bg-[#10316B] text-white" : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <div>
                      <div className="font-medium text-sm">{category.name}</div>
                      <div className={`text-xs ${isActive ? "text-white/80" : "text-gray-500"}`}>
                        {category.description}
                      </div>
                    </div>
                  </div>
                  {category.count > 0 && (
                    <Badge
                      variant={isActive ? "secondary" : "outline"}
                      className={isActive ? "bg-white/20 text-white" : ""}
                    >
                      {category.count}
                    </Badge>
                  )}
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Pending Items Alert */}
      {pendingCount > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="font-medium text-yellow-800">Items Pending Review</div>
                <div className="text-sm text-yellow-700">
                  {pendingCount} item{pendingCount !== 1 ? "s" : ""} awaiting moderation
                </div>
              </div>
            </div>
            <Button asChild size="sm" className="w-full mt-3 bg-transparent" variant="outline">
              <Link href="/moderation">Review Now</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
