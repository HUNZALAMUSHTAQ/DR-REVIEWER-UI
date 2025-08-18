"use client"

import { useState, useEffect } from "react"
import { apiClient } from "./api-client"
import type { Candidate, DesignReview, ProbingQuestions } from "./types"

export function useCandidates() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCandidates = async () => {
      setLoading(true)
      const response = await apiClient.getCandidates()

      if (response.error) {
        setError(response.error)
      } else {
        setCandidates(response.data || [])
        setError(null)
      }
      setLoading(false)
    }

    fetchCandidates()
  }, [])

  return { candidates, loading, error, refetch: () => window.location.reload() }
}

export function useDesignReviews() {
  const [reviews, setReviews] = useState<DesignReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true)
      const response = await apiClient.getDesignReviews()

      if (response.error) {
        setError(response.error)
      } else {
        setReviews(response.data || [])
        setError(null)
      }
      setLoading(false)
    }

    fetchReviews()
  }, [])

  return { reviews, loading, error, refetch: () => window.location.reload() }
}

export function useDesignReview(id: number) {
  const [review, setReview] = useState<DesignReview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReview = async () => {
      setLoading(true)
      const response = await apiClient.getDesignReview(id)

      if (response.error) {
        setError(response.error)
      } else {
        setReview(response.data || null)
        setError(null)
      }
      setLoading(false)
    }

    if (id) {
      fetchReview()
    }
  }, [id])

  return { review, loading, error, refetch: () => window.location.reload() }
}

export function useDesignReviewQuestions(designReviewId: number) {
  const [questions, setQuestions] = useState<ProbingQuestions[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true)
      console.log('Fetching questions for design review:', designReviewId)
      const response = await apiClient.getDesignReviewQuestions(designReviewId)
      console.log('Questions API response:', response)

      if (response.error) {
        console.error('Error fetching questions:', response.error)
        setError(response.error)
      } else {
        console.log('Questions data:', response.data)
        setQuestions(response.data || [])
        setError(null)
      }
      setLoading(false)
    }

    if (designReviewId) {
      fetchQuestions()
    }
  }, [designReviewId])

  return { questions, loading, error, refetch: () => window.location.reload() }
}

export function useJobStatus(designReviewId: number, enabled: boolean = true) {
  const [status, setStatus] = useState<string>("pending")
  const [progress, setProgress] = useState<number>(0)
  const [message, setMessage] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !designReviewId) return

    let intervalId: NodeJS.Timeout
    let retryCount = 0
    const maxRetries = 60 // 5 minutes with 5-second intervals

    const checkStatus = async () => {
      setLoading(true)
      try {
        const response = await apiClient.getJobStatus(designReviewId)
        if (response.error) {
          setError(response.error)
          retryCount++
        } else if (response.data) {
          setStatus(response.data.status)
          setProgress(response.data.progress || 0)
          setMessage(response.data.message || "")
          setError(null)

          // Stop polling if job is completed or failed
          if (response.data.status === "completed" || response.data.status === "failed") {
            clearInterval(intervalId)
            setLoading(false)
            return
          }
        }
      } catch (error) {
        console.error("Error checking job status:", error)
        retryCount++
      }

      setLoading(false)

      // Stop polling after max retries
      if (retryCount >= maxRetries) {
        clearInterval(intervalId)
        setError("Job status check timed out")
      }
    }

    // Initial check
    checkStatus()

    // Poll every 5 seconds
    intervalId = setInterval(checkStatus, 5000)

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [designReviewId, enabled])

  return { status, progress, message, loading, error }
}

export function useQuestionsGenerationStatus(designReviewId: number, enabled: boolean = true) {
  const [status, setStatus] = useState<string>("pending")
  const [questionsCount, setQuestionsCount] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !designReviewId) return

    let intervalId: NodeJS.Timeout
    let retryCount = 0
    const maxRetries = 60 // 5 minutes with 5-second intervals

    const checkStatus = async () => {
      setLoading(true)
      try {
        const response = await apiClient.checkQuestionsGenerationStatus(designReviewId)
        if (response.error) {
          setError(response.error)
          retryCount++
        } else if (response.data) {
          setStatus(response.data.status)
          setQuestionsCount(response.data.questions_count || 0)
          setError(null)

          // Stop polling if questions are generated
          if (response.data.status === "completed" && (response.data.questions_count || 0) > 0) {
            clearInterval(intervalId)
            setLoading(false)
            return
          }
        }
      } catch (error) {
        console.error("Error checking questions generation status:", error)
        retryCount++
      }

      setLoading(false)

      // Stop polling after max retries
      if (retryCount >= maxRetries) {
        clearInterval(intervalId)
        setError("Questions generation status check timed out")
      }
    }

    // Initial check
    checkStatus()

    // Poll every 5 seconds
    intervalId = setInterval(checkStatus, 5000)

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [designReviewId, enabled])

  return { status, questionsCount, loading, error }
}

export function useEvaluationPolling(designReviewId: number, enabled: boolean = true) {
  const [evaluationData, setEvaluationData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !designReviewId) return

    let intervalId: NodeJS.Timeout
    let retryCount = 0
    const maxRetries = 60 // 5 minutes with 5-second intervals

    const checkEvaluation = async () => {
      setLoading(true)
      try {
        const response = await apiClient.getEvaluationResults(designReviewId)
        if (response.error) {
          setError(response.error)
          retryCount++
        } else if (response.data) {
          setEvaluationData(response.data)
          setError(null)

          // Stop polling if evaluation is complete
          if (response.data.status === "completed" || response.data.overallscore) {
            clearInterval(intervalId)
            setLoading(false)
            return
          }
        }
      } catch (error) {
        console.error("Error checking evaluation results:", error)
        retryCount++
      }

      setLoading(false)

      // Stop polling after max retries
      if (retryCount >= maxRetries) {
        clearInterval(intervalId)
        setError("Evaluation polling timed out")
      }
    }

    // Initial check
    checkEvaluation()

    // Poll every 5 seconds
    intervalId = setInterval(checkEvaluation, 5000)

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [designReviewId, enabled])

  return { evaluationData, loading, error }
}
