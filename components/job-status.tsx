"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, Clock, Loader2, Brain, FileText } from "lucide-react"
import { useRouter } from "next/navigation"

interface JobStatusProps {
  status: string
  progress: number
  message: string
  loading: boolean
  error: string | null
  designReviewId?: number
  questionsCount?: number
  onComplete?: () => void
}

export function JobStatus({
  status,
  progress,
  message,
  loading,
  error,
  designReviewId,
  questionsCount,
  onComplete
}: JobStatusProps) {
  const router = useRouter()

  const getStatusIcon = () => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case "failed":
        return <AlertCircle className="h-6 w-6 text-red-500" />
      case "processing":
        return <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
      default:
        return <Clock className="h-6 w-6 text-yellow-500" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "failed":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "processing":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      default:
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    }
  }

  const getStatusMessage = () => {
    switch (status) {
      case "completed":
        return "Questions generated successfully!"
      case "failed":
        return "Failed to generate questions"
      case "processing":
        return "Generating AI questions..."
      case "pending":
        return "Submission received, waiting for processing..."
      default:
        return "Waiting to start..."
    }
  }

  const handleViewQuestions = () => {
    if (designReviewId) {
      router.push(`/questions/${designReviewId}`)
    }
  }

  const handleRetry = () => {
    if (onComplete) {
      onComplete()
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Brain className="h-6 w-6 text-primary" />
          AI Question Generation
        </CardTitle>
        <CardDescription>
          Our AI is analyzing your design and generating probing questions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <div className="font-semibold">{getStatusMessage()}</div>
              {message && <div className="text-sm text-muted-foreground">{message}</div>}
            </div>
          </div>
          <Badge className={getStatusColor()}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>

        {/* Progress Bar */}
        {status === "processing" && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Questions Count */}
        {questionsCount && questionsCount > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>{questionsCount} questions generated</span>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {status === "completed" && designReviewId && (
            <Button onClick={handleViewQuestions} className="flex-1">
              <Brain className="h-4 w-4 mr-2" />
              View Questions
            </Button>
          )}
          
          {status === "failed" && (
            <Button onClick={handleRetry} variant="outline" className="flex-1">
              <Loader2 className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
            className="flex-1"
          >
            Back to Dashboard
          </Button>
        </div>

        {/* Loading State */}
        {loading && status !== "completed" && (
          <div className="text-center py-4">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Checking status...</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 