"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Download, FileText, User, Calendar, BarChart3, Brain, Shield, Zap, Wrench } from "lucide-react"
import Link from "next/link"
import { useDesignReview, useCandidates, useEvaluationPolling } from "@/lib/api-hooks"
import { useParams } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import { useState, useEffect } from "react"
import type { Candidate } from "@/lib/types"

export default function ReviewPage() {
  const routeParams = useParams<{ id: string }>()
  const reviewId = Number.parseInt(routeParams.id)
  const { review, loading, error } = useDesignReview(reviewId)
  const { candidates } = useCandidates()
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  
  // Use evaluation polling hook for real-time updates
  const { evaluationData, loading: evaluationLoading, error: evaluationError } = useEvaluationPolling(
    reviewId,
    review?.status === "Questions Generated" || review?.status === "In Progress"
  )

  useEffect(() => {
    if (review && candidates.length > 0) {
      const foundCandidate = candidates.find((c) => c.id === review.candidate)
      setCandidate(foundCandidate || null)
    }
  }, [review, candidates])

  // Show evaluation loading indicator
  if (evaluationLoading && !evaluationData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading evaluation results...</p>
        </div>
      </div>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 4) return "text-green-400"
    if (score >= 3) return "text-yellow-400"
    return "text-red-400"
  }

  const getScoreDescription = (score: number) => {
    if (score >= 4) return "Excellent"
    if (score >= 3) return "Good"
    if (score >= 2) return "Average"
    return "Needs Improvement"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
      case "Finalized":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "In Progress":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "Reviewed":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30"
      case "Questions Generated":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const handleTriggerEvaluation = async () => {
    try {
      const response = await apiClient.triggerEvaluation(reviewId)
      if (response.error) {
        console.error("Failed to trigger evaluation:", response.error)
        alert("Failed to trigger evaluation. Please try again.")
      } else {
        // The polling hook will automatically detect the status change
        console.log("Evaluation triggered successfully")
      }
    } catch (error) {
      console.error("Error triggering evaluation:", error)
      alert("An error occurred. Please try again.")
    }
  }

  const handleExportReport = () => {
    try {
      const originalTitle = document.title
      const candidateLabel = candidate?.name || `Candidate-${review.candidate}`
      document.title = `Design-Review-${candidateLabel}-${reviewId}`
      window.print()
      // Restore title shortly after print dialog opens
      setTimeout(() => {
        document.title = originalTitle
      }, 1000)
    } catch (err) {
      console.error('Failed to export report:', err)
      alert('Failed to export report. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !review) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-red-500">Error loading review: {error || "Review not found"}</div>
      </div>
    )
  }

  const scores = review.scores?.[0] ||
    evaluationData || {
      overallscore: review.overallScore || 0,
      technicalDepth: 4,
      systemDesign: 4,
      tradeoff: 4,
      ownership: 4,
      feedbackSummary: "Evaluation in progress. Detailed feedback will be available once the review is completed.",
    }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Review Scorecard</h1>
            <p className="text-muted-foreground">Detailed evaluation and performance analysis</p>
          </div>
          <div className="flex gap-2 print:hidden">
            {review.status === "Questions Generated" && !evaluationData && (
              <Button onClick={handleTriggerEvaluation} variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                Start Evaluation
              </Button>
            )}
            <Button variant="outline" onClick={handleExportReport}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overall Performance */}
            <Card className="print:card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 print:title">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Overall Performance
                  {evaluationLoading && (
                    <div className="flex items-center gap-2 ml-auto">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span className="text-sm text-muted-foreground">Evaluating...</span>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <div className={`text-6xl font-bold mb-2 ${getScoreColor(scores.overallscore || 0)}`}>
                    {scores.overallscore || "N/A"}
                  </div>
                  <div className="text-2xl text-muted-foreground mb-1">out of 5</div>
                  <Badge className={getStatusColor(review.status || "Pending")}>
                    {scores.overallscore ? getScoreDescription(scores.overallscore) : review.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Brain className="h-6 w-6 text-primary mx-auto mb-2" />
                    <div className={`text-xl font-bold ${getScoreColor(scores.technicalDepth || 0)}`}>
                      {scores.technicalDepth || "N/A"}
                    </div>
                    <div className="text-xs text-muted-foreground">Technical Depth</div>
                  </div>

                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Zap className="h-6 w-6 text-primary mx-auto mb-2" />
                    <div className={`text-xl font-bold ${getScoreColor(scores.systemDesign || 0)}`}>
                      {scores.systemDesign || "N/A"}
                    </div>
                    <div className="text-xs text-muted-foreground">System Design</div>
                  </div>

                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Shield className="h-6 w-6 text-primary mx-auto mb-2" />
                    <div className={`text-xl font-bold ${getScoreColor(scores.tradeoff || 0)}`}>
                      {scores.tradeoff || "N/A"}
                    </div>
                    <div className="text-xs text-muted-foreground">Tradeoff Reasoning</div>
                  </div>

                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Wrench className="h-6 w-6 text-primary mx-auto mb-2" />
                    <div className={`text-xl font-bold ${getScoreColor(scores.ownership || 0)}`}>
                      {scores.ownership || "N/A"}
                    </div>
                    <div className="text-xs text-muted-foreground">Ownership</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feedback Summary */}
            <Card className="print:card">
              <CardHeader>
                <CardTitle className="print:title">AI Feedback Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const summary =
                    scores.feedbackSummary ||
                    "Evaluation feedback will be available once the review is completed."
                  const techDepthRegex = /Technical\s*Depth:\s*/i
                  if (techDepthRegex.test(summary)) {
                    const [before, after] = summary.split(techDepthRegex)
                    return (
                      <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap print:muted">
                        {before.trim() && <p>{before.trim()}</p>}
                        <div className="mt-3">
                          <div className="font-semibold">Technical Depth:</div>
                          <div className="mt-1">{after.trim()}</div>
                        </div>
                      </div>
                    )
                  }
                  return <p className="text-muted-foreground leading-relaxed print:muted">{summary}</p>
                })()}
              </CardContent>
            </Card>

            {/* Design Submission Details */}
            <Card className="print:card">
              <CardHeader>
                <CardTitle className="print:title">Submitted Design Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-2">Problem Description</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{review.problemDescription}</p>
                </div>

                <Separator className="print:divider" />

                <div>
                  <h4 className="font-semibold mb-2">Proposed Architecture</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{review.proposedArchitecture}</p>
                </div>

                <Separator className="print:divider" />

                <div>
                  <h4 className="font-semibold mb-2">Design Tradeoffs</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{review.designTradeoffs}</p>
                </div>

                <div className="grid md:grid-cols-3 gap-4 print:grid-2">
                  <div>
                    <h4 className="font-semibold mb-2">Scalability</h4>
                    <p className="text-sm text-muted-foreground">{review.scalibilty}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Security Measures</h4>
                    <p className="text-sm text-muted-foreground">{review.securityMeasures}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Maintainability</h4>
                    <p className="text-sm text-muted-foreground">{review.maintainability}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Q&A Section */}
            <Card className="print:card">
              <CardHeader>
                <CardTitle className="print:title">AI-Generated Questions & Answers</CardTitle>
                <CardDescription className="print:subtitle">Probing questions and candidate responses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {review.probing_questions && review.probing_questions.length > 0 ? (
                  review.probing_questions.map((qa, index) => (
                    <div key={qa.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold">Question {index + 1}</h4>
                        <Badge variant="outline" className="print:badge">Difficulty: {qa.difficulty}/10</Badge>
                      </div>
                      <p className="text-sm mb-4 text-muted-foreground">{qa.question}</p>
                      {qa.answer ? (
                        <div className="bg-muted/50 rounded p-3">
                          <h5 className="font-medium mb-2">Answer:</h5>
                          <p className="text-sm text-muted-foreground">{qa.answer}</p>
                        </div>
                      ) : (
                        <div className="bg-muted/50 rounded p-3">
                          <p className="text-sm text-muted-foreground italic">Answer pending</p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No questions generated yet. Questions will appear once the review is processed.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Candidate Info */}
            <Card className="print:card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 print:title">
                  <User className="h-5 w-5 text-primary" />
                  Candidate Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="font-semibold">{candidate?.name || `Candidate ${review.candidate}`}</div>
                  <div className="text-sm text-muted-foreground">{candidate?.designation || "Unknown"}</div>
                  <div className="text-sm text-muted-foreground">ID: {review.candidate}</div>
                </div>

                <Separator />

                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Submitted: {review.submissionDate ? new Date(review.submissionDate).toLocaleDateString() : "N/A"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm">Status:</span>
                  <Badge className={`${getStatusColor(review.status || "Pending")} print:badge`}>{review.status || "Pending"}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Supporting Documents */}
            <Card className="print:card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 print:title">
                  <FileText className="h-5 w-5 text-primary" />
                  Supporting Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {review.documents && review.documents.length > 0 ? (
                  review.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">Document {doc.id}</div>
                          <div className="text-xs text-muted-foreground">
                            {(doc.size / 1024 / 1024).toFixed(1)} MB • {doc.type}
                          </div>
                        </div>
                      </div>
                      {doc.url ? (
                        <a
                          href={doc.url.startsWith("http") ? doc.url : `http://localhost:8000${doc.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                        >
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </a>
                      ) : (
                        <Button variant="ghost" size="sm" disabled>
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No documents uploaded</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Score Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Score Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Technical Depth</span>
                    <span className={getScoreColor(scores.technicalDepth || 0)}>
                      {scores.technicalDepth || "N/A"}/5
                    </span>
                  </div>
                  <Progress value={(scores.technicalDepth || 0) * 20} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>System Design</span>
                    <span className={getScoreColor(scores.systemDesign || 0)}>{scores.systemDesign || "N/A"}/5</span>
                  </div>
                  <Progress value={(scores.systemDesign || 0) * 20} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Tradeoff Reasoning</span>
                    <span className={getScoreColor(scores.tradeoff || 0)}>{scores.tradeoff || "N/A"}/5</span>
                  </div>
                  <Progress value={(scores.tradeoff || 0) * 20} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Ownership</span>
                    <span className={getScoreColor(scores.ownership || 0)}>{scores.ownership || "N/A"}/5</span>
                  </div>
                  <Progress value={(scores.ownership || 0) * 20} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
