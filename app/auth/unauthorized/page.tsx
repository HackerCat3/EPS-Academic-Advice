import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-serif text-primary">Access Restricted</CardTitle>
            <CardDescription className="text-muted-foreground">
              This platform is for Eastside Prep community members only
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Access to EPS Academic Advice is restricted to users with @eastsideprep.org email addresses. Please
              contact your administrator if you believe this is an error.
            </p>
            <div className="pt-4">
              <Button asChild className="w-full bg-primary hover:bg-primary/90">
                <Link href="/auth/login">Try Again</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
