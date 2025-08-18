export interface Candidate {
  id?: number
  name: string
  designation: string
  createdOn?: string
  updatedOn?: string
  design_reviews?: DesignReview[]
}

export interface DesignDocument {
  id?: number
  isProcessed?: "error" | "pending" | "processing" | "analyzed" | "done"
  url?: string
  type: string
  size: number
  createdOn?: string
  updatedOn?: string
}

export interface ProbingQuestions {
  id?: number
  question: string
  answer?: string | null
  difficulty: number
  createdOn?: string
  updatedOn?: string
}

export interface DesignReviewScore {
  id?: number
  overallscore: number
  status?: "Pending" | "Incomplete" | "Completed"
  reviewedOn: string
  technicalDepth: number
  systemDesign: number
  tradeoff: number
  ownership: number
  feedbackSummary: string
  createdOn?: string
  updatedOn?: string
}

export interface DesignReview {
  id?: number
  problemDescription: string
  proposedArchitecture: string
  designTradeoffs: string
  scalibilty: string // Note: API has typo "scalibilty" instead of "scalability"
  securityMeasures: string
  maintainability: string
  candidate: number
  status?: "Pending" | "Incomplete" | "Completed" | "Questions Generated" | "In Progress" | "Reviewed" | "Finalized"
  submissionDate?: string
  overallScore?: number | null
  createdOn?: string
  updatedOn?: string
  documents?: DesignDocument[]
  probing_questions?: ProbingQuestions[]
  scores?: DesignReviewScore[]
}

export interface DesignReviewFormData {
  problemDescription: string
  proposedArchitecture: string
  designTradeoffs: string
  scalibilty: string
  securityMeasures: string
  maintainability: string
  candidate: number
  status?: string
  overallScore?: number
}

export interface QuestionAnswer {
  questionId: number
  answer: string
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  status: number
}
