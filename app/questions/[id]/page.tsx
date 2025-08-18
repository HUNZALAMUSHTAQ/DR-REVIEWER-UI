"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Mic, MicOff, Play, ArrowRight, ArrowLeft } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useDesignReviewQuestions } from "@/lib/api-hooks"
import { apiClient } from "@/lib/api-client"

export default function QuestionsPage() {
  const router = useRouter()
  const routeParams = useParams<{ id: string }>()
  const designReviewId = Number.parseInt(routeParams.id)
  const { questions, loading, error } = useDesignReviewQuestions(designReviewId)

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<{ [key: number]: string }>({})
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentQuestion = questions[currentQuestionIndex]

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRecording])

  const handleRecordToggle = () => {
    if (isRecording) {
      setIsRecording(false)
    } else {
      setIsRecording(true)
      setRecordingTime(0)
    }
  }

  const handleAnswerChange = (value: string) => {
    if (currentQuestion) {
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id!]: value,
      }))
    }
  }

  const handleNext = async () => {
    if (!currentQuestion) return

    setIsSubmitting(true)

    try {
      const currentAnswer = answers[currentQuestion.id!] || ""
      if (currentAnswer.trim()) {
        const response = await apiClient.answerQuestion(currentQuestion.id!, currentAnswer)
        if (response.error) {
          console.error("Failed to submit answer:", response.error)
          alert("Failed to submit answer. Please try again.")
          setIsSubmitting(false)
          return
        }
      }

      // Navigate to next question or completion
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1)
      } else {
        router.push("/questions/complete")
      }
    } catch (error) {
      console.error("Error submitting answer:", error)
      alert("An error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-red-500">Error loading questions: {error}</div>
      </div>
    )
  }

  if (!questions.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No questions available for this design review.</p>
            <Button className="mt-4" onClick={() => router.push("/dashboard")}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!currentQuestion) {
    return <div>Question not found</div>
  }

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100
  const currentAnswer = answers[currentQuestion.id!] || ""

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Progress Header */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">AI Probing Questions</h1>
            <span className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="max-w-3xl mx-auto mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Question {currentQuestionIndex + 1}</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full">
                  Difficulty: {currentQuestion.difficulty}/10
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-lg leading-relaxed mb-6">{currentQuestion.question}</p>

            {/* Recording Interface */}
            <div className="bg-muted/50 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Voice Response</h3>
                <div className="text-sm text-muted-foreground">
                  {isRecording ? `Recording: ${formatTime(recordingTime)}` : "Ready to record"}
                </div>
              </div>

              <div className="flex items-center justify-center gap-4">
                <Button
                  variant={isRecording ? "destructive" : "default"}
                  size="lg"
                  onClick={handleRecordToggle}
                  className="rounded-full h-16 w-16"
                >
                  {isRecording ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </Button>

                {recordingTime > 0 && !isRecording && (
                  <Button variant="outline" size="lg" className="rounded-full h-12 w-12 bg-transparent">
                    <Play className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {isRecording && (
                <div className="mt-4 flex justify-center">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-primary rounded-full animate-pulse"
                        style={{
                          height: `${Math.random() * 20 + 10}px`,
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Text Alternative */}
            <div>
              <h3 className="font-semibold mb-3">Or type your response:</h3>
              <Textarea
                placeholder="Type your detailed answer here..."
                value={currentAnswer}
                onChange={(e) => handleAnswerChange(e.target.value)}
                className="min-h-[150px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="max-w-3xl mx-auto flex justify-between">
          <Button variant="outline" onClick={handlePrevious} disabled={currentQuestionIndex === 0}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <Button onClick={handleNext} disabled={isSubmitting || (!currentAnswer.trim() && recordingTime === 0)}>
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : currentQuestionIndex === questions.length - 1 ? (
              "Complete Review"
            ) : (
              <>
                Next Question
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
