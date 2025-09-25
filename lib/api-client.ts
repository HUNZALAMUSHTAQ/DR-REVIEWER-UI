import type {
  Candidate,
  DesignReview,
  DesignReviewFormData,
  ProbingQuestions,
  QuestionAnswer,
  ApiResponse,
} from "./types"

const API_BASE_URL = "http://localhost:8000/api"

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      })

      const data = response.ok ? await response.json() : null

      return {
        data,
        status: response.status,
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
      }
    } catch (error) {
      return {
        status: 0,
        error: error instanceof Error ? error.message : "Network error",
      }
    }
  }

  private async requestFormData<T>(endpoint: string, formData: FormData, method = "POST"): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        body: formData,
      })

      const data = response.ok ? await response.json() : null

      return {
        data,
        status: response.status,
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
      }
    } catch (error) {
      return {
        status: 0,
        error: error instanceof Error ? error.message : "Network error",
      }
    }
  }

  // Candidate API methods
  async getCandidates(): Promise<ApiResponse<Candidate[]>> {
    return this.request<Candidate[]>("/candidate/")
  }

  async getCandidate(id: number): Promise<ApiResponse<Candidate>> {
    return this.request<Candidate>(`/candidate/${id}/`)
  }

  async createCandidate(candidate: Omit<Candidate, "id" | "createdOn" | "updatedOn">): Promise<ApiResponse<Candidate>> {
    return this.request<Candidate>("/candidate/", {
      method: "POST",
      body: JSON.stringify(candidate),
    })
  }

  async updateCandidate(id: number, candidate: Partial<Candidate>): Promise<ApiResponse<Candidate>> {
    return this.request<Candidate>(`/candidate/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(candidate),
    })
  }

  async deleteCandidate(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/candidate/${id}/`, {
      method: "DELETE",
    })
  }

  // Design Review API methods
  async getDesignReviews(): Promise<ApiResponse<DesignReview[]>> {
    return this.request<DesignReview[]>("/design-review/")
  }

  async getDesignReview(id: number): Promise<ApiResponse<DesignReview>> {
    return this.request<DesignReview>(`/design-review/${id}/`)
  }

  // Create design review with optional files
  async createDesignReview(
    reviewData: DesignReviewFormData & { documents?: File[] }
  ): Promise<ApiResponse<DesignReview>> {
    const formData = new FormData()
    Object.entries(reviewData).forEach(([key, value]) => {
      if (value === undefined || value === null) return
      if (key === 'documents' && Array.isArray(value)) {
        // Backend expects 'files' field name; map documents -> files
        value.forEach((file) => formData.append('files', file as File))
      } else {
        formData.append(key, value.toString())
      }
    })

    return this.requestFormData<DesignReview>("/design-review/", formData)
  }

  async updateDesignReview(id: number, reviewData: Partial<DesignReviewFormData>): Promise<ApiResponse<DesignReview>> {
    const formData = new FormData()
    Object.entries(reviewData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString())
      }
    })

    return this.requestFormData<DesignReview>(`/design-review/${id}/`, formData, "PATCH")
  }

  async deleteDesignReview(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/design-review/${id}/`, {
      method: "DELETE",
    })
  }

  // Design Review Questions API methods
  async getDesignReviewQuestions(designReviewId: number): Promise<ApiResponse<ProbingQuestions[]>> {
    const response = await this.request<{ questions: ProbingQuestions[] }>(`/design-review/${designReviewId}/questions/`)
    
    // Extract the questions array from the nested response
    if (response.data && response.data.questions) {
      return {
        data: response.data.questions,
        status: response.status,
        error: response.error
      }
    }
    
    // Return empty array if no questions found
    return {
      data: [],
      status: response.status,
      error: response.error
    }
  }

  async answerQuestion(questionId: number, answer: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/question/${questionId}/answer/`, {
      method: "POST",
      body: JSON.stringify({ answer }),
    })
  }

  async answerAllQuestions(designReviewId: number, answers: QuestionAnswer[]): Promise<ApiResponse<void>> {
    return this.request<void>(`/design-review/${designReviewId}/questions/answer/`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    })
  }

  // Design Review Evaluation API methods
  async triggerEvaluation(designReviewId: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/design-review/${designReviewId}/evaluate/`, {
      method: "POST",
    })
  }

  async getEvaluationResults(designReviewId: number): Promise<ApiResponse<any>> {
    return this.request<any>(`/design-review/${designReviewId}/evaluation/`)
  }

  // Job Status API methods - using existing endpoints
  async getJobStatus(designReviewId: number): Promise<ApiResponse<{ status: string; progress?: number; message?: string }>> {
    // Use the questions endpoint to check if questions are generated
    const response = await this.request<{ questions: ProbingQuestions[] }>(`/design-review/${designReviewId}/questions/`)
    
    if (response.error) {
      // If it's a 404, questions haven't been generated yet
      if (response.status === 404) {
        return {
          data: { status: "pending", progress: 0, message: "Submission received, waiting for processing..." },
          status: response.status,
          error: undefined
        }
      }
      return {
        data: { status: "failed", message: response.error },
        status: response.status,
        error: response.error
      }
    }
    
    if (response.data && response.data.questions && response.data.questions.length > 0) {
      return {
        data: { 
          status: "completed", 
          progress: 100, 
          message: `${response.data.questions.length} questions generated successfully` 
        },
        status: response.status,
        error: undefined
      }
    }
    
    return {
      data: { status: "processing", progress: 50, message: "Generating questions..." },
      status: response.status,
      error: undefined
    }
  }

  async checkQuestionsGenerationStatus(designReviewId: number): Promise<ApiResponse<{ status: string; questions_count?: number }>> {
    // Use the questions endpoint to check status
    const response = await this.request<{ questions: ProbingQuestions[] }>(`/design-review/${designReviewId}/questions/`)
    
    if (response.error) {
      // If it's a 404, questions haven't been generated yet
      if (response.status === 404) {
        return {
          data: { status: "pending" },
          status: response.status,
          error: undefined
        }
      }
      return {
        data: { status: "failed" },
        status: response.status,
        error: response.error
      }
    }
    
    if (response.data && response.data.questions && response.data.questions.length > 0) {
      return {
        data: { 
          status: "completed", 
          questions_count: response.data.questions.length 
        },
        status: response.status,
        error: undefined
      }
    }
    
    return {
      data: { status: "processing" },
      status: response.status,
      error: undefined
    }
  }
}

export const apiClient = new ApiClient()
