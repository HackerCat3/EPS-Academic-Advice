import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ReplyFormProps {
  action: (formData: FormData) => Promise<void>
  disabled?: boolean
}

export function ReplyForm({ action, disabled }: ReplyFormProps) {
  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-serif">Add a Response</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="body" className="text-sm font-medium">
              Your Response <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="body"
              name="body"
              placeholder="Share your thoughts, insights, or questions..."
              rows={4}
              className="resize-none"
              required
              disabled={disabled}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="is_anonymous" name="is_anonymous" value="true" disabled={disabled} />
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
              disabled={disabled}
              className="bg-[#10316B] hover:bg-[#10316B]/90"
            >
              {disabled ? "Locked" : "Post Response"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}