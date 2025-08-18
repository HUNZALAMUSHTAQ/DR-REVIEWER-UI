"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Clock, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { apiClient } from "@/lib/api-client"

export default function QuestionsCompletePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const designReviewId = searchParams.get("reviewId")

  useEffect(() => {
    const triggerEvaluation = async () => {
      if (designReviewId) {
        try {
          await apiClient.triggerEvaluation(Number.parseInt(designReviewId))
        } catch (error) {
          console.error("Failed to trigger evaluation:", error)
        }
      }
    }

    triggerEvaluation()
  }, [designReviewId])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="container mx-auto px-4">
        <Card className="max-w-2xl mx-auto text-center">
          <CardHeader className="pb-8">
            <div className="mx-auto mb-6">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl mb-2">Questions Completed!</CardTitle>
            <CardDescription className="text-lg">
              Thank you for completing all the probing questions. Your responses have been submitted for AI evaluation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-primary" />
                <span className="font-semibold">What happens next?</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Our AI system will analyze your design submission and responses to generate a comprehensive evaluation.
                You'll receive detailed feedback on technical depth, system design, tradeoffs, and overall performance.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-primary/10 rounded-lg p-4">
                <div className="font-semibold text-primary mb-1">Evaluation Time</div>
                <div className="text-muted-foreground">5-10 minutes</div>
              </div>
              <div className="bg-primary/10 rounded-lg p-4">
                <div className="font-semibold text-primary mb-1">Detailed Scoring</div>
                <div className="text-muted-foreground">4 key metrics</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/dashboard">
                <Button variant="outline">View All Submissions</Button>
              </Link>
              <Link href="/">
                <Button>
                  Return to Home
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
