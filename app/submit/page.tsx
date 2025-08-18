"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileText, ArrowLeft, Send, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import { useCandidates, useJobStatus, useQuestionsGenerationStatus } from "@/lib/api-hooks"
import { JobStatus } from "@/components/job-status"

export default function SubmitPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedReviewId, setSubmittedReviewId] = useState<number | null>(null)
  const [showJobStatus, setShowJobStatus] = useState(false)
  const { candidates, loading: candidatesLoading, error: candidatesError } = useCandidates()
  const [showNewCandidateForm, setShowNewCandidateForm] = useState(false)
  const [newCandidate, setNewCandidate] = useState({ name: "", designation: "" })

  const [formData, setFormData] = useState({
    candidate: "",
    problemDescription: "",
    proposedArchitecture: "",
    designTradeoffs: "",
    scalability: "",
    securityMeasures: "",
    maintainability: "",
  })

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Job status hooks
  const { status: jobStatus, progress, message, loading: jobLoading, error: jobError } = useJobStatus(
    submittedReviewId || 0,
    showJobStatus
  )
  
  const { status: questionsStatus, questionsCount, loading: questionsLoading, error: questionsError } = useQuestionsGenerationStatus(
    submittedReviewId || 0,
    showJobStatus
  )

  const validateForm = () => {
    const errors: { [key: string]: string } = {}

    // Validate candidate selection
    if (!formData.candidate) {
      errors.candidate = "Please select a candidate"
    }

    // Validate problem description
    if (!formData.problemDescription.trim()) {
      errors.problemDescription = "Problem description is required"
    } else if (formData.problemDescription.trim().length < 50) {
      errors.problemDescription = "Problem description must be at least 50 characters"
    }

    // Validate proposed architecture
    if (!formData.proposedArchitecture.trim()) {
      errors.proposedArchitecture = "Proposed architecture is required"
    } else if (formData.proposedArchitecture.trim().length < 50) {
      errors.proposedArchitecture = "Proposed architecture must be at least 50 characters"
    }

    // Validate design tradeoffs
    if (!formData.designTradeoffs.trim()) {
      errors.designTradeoffs = "Design tradeoffs are required"
    } else if (formData.designTradeoffs.trim().length < 30) {
      errors.designTradeoffs = "Design tradeoffs must be at least 30 characters"
    }

    // Validate scalability
    if (!formData.scalability.trim()) {
      errors.scalability = "Scalability information is required"
    }

    // Validate security measures
    if (!formData.securityMeasures.trim()) {
      errors.securityMeasures = "Security measures are required"
    }

    // Validate maintainability
    if (!formData.maintainability.trim()) {
      errors.maintainability = "Maintainability information is required"
    }

    // Validate file upload (MANDATORY)
    if (uploadedFiles.length === 0) {
      errors.documents = "At least one supporting document is required"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form before submission
    if (!validateForm()) {
      alert("Please complete all required fields and upload at least one supporting document.")
      return
    }

    setIsSubmitting(true)

    try {
      // Submit form with files included
      const response = await apiClient.createDesignReview({
        problemDescription: formData.problemDescription,
        proposedArchitecture: formData.proposedArchitecture,
        designTradeoffs: formData.designTradeoffs,
        scalibilty: formData.scalability, // Note: API has typo "scalibilty"
        securityMeasures: formData.securityMeasures,
        maintainability: formData.maintainability,
        candidate: Number.parseInt(formData.candidate),
        status: "Pending",
        documents: uploadedFiles
      })

      if (response.error) {
        console.error("Failed to submit design review:", response.error)
        alert("Failed to submit design review. Please try again.")
      } else {
        // Set the submitted review ID and show job status
        setSubmittedReviewId(response.data?.id || null)
        setShowJobStatus(true)
      }
    } catch (error) {
      console.error("Error submitting design review:", error)
      alert("An error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleJobComplete = () => {
    setShowJobStatus(false)
    setSubmittedReviewId(null)
    // Reset form
    setFormData({
      candidate: "",
      problemDescription: "",
      proposedArchitecture: "",
      designTradeoffs: "",
      scalability: "",
      securityMeasures: "",
      maintainability: "",
    })
    setUploadedFiles([])
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return
    const newFiles = Array.from(files)
    setUploadedFiles((prev) => [...prev, ...newFiles])
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files)
    }
  }

  const removeFile = (index: number) => {
    const fileToRemove = uploadedFiles[index]
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
    console.log(`Removed file: ${fileToRemove?.name}`)
  }

  const handleCreateCandidate = async () => {
    if (!newCandidate.name || !newCandidate.designation) return

    try {
      const response = await apiClient.createCandidate(newCandidate)
      if (response.error) {
        console.error("Failed to create candidate:", response.error)
        alert("Failed to create candidate. Please try again.")
      } else {
        setFormData((prev) => ({ ...prev, candidate: response.data?.id?.toString() || "" }))
        setShowNewCandidateForm(false)
        setNewCandidate({ name: "", designation: "" })
        // Refresh the page to get updated candidates list
        window.location.reload()
      }
    } catch (error) {
      console.error("Error creating candidate:", error)
      alert("An error occurred. Please try again.")
    }
  }

  // Show job status if a review was submitted
  if (showJobStatus && submittedReviewId) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Processing Your Submission</h1>
              <p className="text-muted-foreground">We're analyzing your design and generating questions</p>
            </div>
          </div>
          
          <JobStatus
            status={questionsStatus === "completed" ? "completed" : jobStatus}
            progress={progress}
            message={message}
            loading={jobLoading || questionsLoading}
            error={jobError || questionsError}
            designReviewId={submittedReviewId}
            questionsCount={questionsCount}
            onComplete={handleJobComplete}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Submit Design Review</h1>
            <p className="text-muted-foreground">Provide detailed information about your system design</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
          {/* Candidate Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Candidate Information</CardTitle>
              <CardDescription>Select or add candidate details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="candidate">Candidate</Label>
                  {candidatesLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : candidatesError ? (
                    <div className="text-red-500 text-sm p-2">Error loading candidates: {candidatesError}</div>
                  ) : (
                    <div>
                      <Select value={formData.candidate} onValueChange={(value) => handleInputChange("candidate", value)}>
                        <SelectTrigger className={formErrors.candidate ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select a candidate *" />
                        </SelectTrigger>
                        <SelectContent>
                          {candidates.map((candidate) => (
                            <SelectItem key={candidate.id} value={candidate.id?.toString() || ""}>
                              {candidate.name} - {candidate.designation}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.candidate && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.candidate}</p>
                      )}
                    </div>
                  )}

                  <div className="mt-2">
                    {!showNewCandidateForm ? (
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowNewCandidateForm(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Candidate
                      </Button>
                    ) : (
                      <div className="border rounded-lg p-4 space-y-3">
                        <div>
                          <Label htmlFor="newCandidateName">Name</Label>
                          <Input
                            id="newCandidateName"
                            value={newCandidate.name}
                            onChange={(e) => setNewCandidate((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter candidate name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="newCandidateDesignation">Designation</Label>
                          <Input
                            id="newCandidateDesignation"
                            value={newCandidate.designation}
                            onChange={(e) => setNewCandidate((prev) => ({ ...prev, designation: e.target.value }))}
                            placeholder="Enter designation"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleCreateCandidate}
                            disabled={!newCandidate.name || !newCandidate.designation}
                          >
                            Create Candidate
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowNewCandidateForm(false)
                              setNewCandidate({ name: "", designation: "" })
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Design Details */}
          <Card>
            <CardHeader>
              <CardTitle>Design Submission</CardTitle>
              <CardDescription>Provide comprehensive details about your system design</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="problemDescription">Problem Description *</Label>
                <Textarea
                  id="problemDescription"
                  placeholder="Describe the problem your system aims to solve..."
                  className={`min-h-[120px] mt-2 ${formErrors.problemDescription ? "border-red-500" : ""}`}
                  value={formData.problemDescription}
                  onChange={(e) => handleInputChange("problemDescription", e.target.value)}
                  required
                />
                {formErrors.problemDescription && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.problemDescription}</p>
                )}
              </div>

              <div>
                <Label htmlFor="proposedArchitecture">Proposed Architecture *</Label>
                <Textarea
                  id="proposedArchitecture"
                  placeholder="Outline your proposed solution and architecture..."
                  className={`min-h-[120px] mt-2 ${formErrors.proposedArchitecture ? "border-red-500" : ""}`}
                  value={formData.proposedArchitecture}
                  onChange={(e) => handleInputChange("proposedArchitecture", e.target.value)}
                  required
                />
                {formErrors.proposedArchitecture && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.proposedArchitecture}</p>
                )}
              </div>

              <div>
                <Label htmlFor="designTradeoffs">Design Tradeoffs *</Label>
                <Textarea
                  id="designTradeoffs"
                  placeholder="Discuss the tradeoffs and alternatives considered..."
                  className={`min-h-[120px] mt-2 ${formErrors.designTradeoffs ? "border-red-500" : ""}`}
                  value={formData.designTradeoffs}
                  onChange={(e) => handleInputChange("designTradeoffs", e.target.value)}
                  required
                />
                {formErrors.designTradeoffs && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.designTradeoffs}</p>
                )}
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="scalability">Scalability *</Label>
                  <Textarea
                    id="scalability"
                    placeholder="How does your design scale?"
                    className={`min-h-[100px] mt-2 ${formErrors.scalability ? "border-red-500" : ""}`}
                    value={formData.scalability}
                    onChange={(e) => handleInputChange("scalability", e.target.value)}
                    required
                  />
                  {formErrors.scalability && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.scalability}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="securityMeasures">Security Measures *</Label>
                  <Textarea
                    id="securityMeasures"
                    placeholder="What security measures are in place?"
                    className={`min-h-[100px] mt-2 ${formErrors.securityMeasures ? "border-red-500" : ""}`}
                    value={formData.securityMeasures}
                    onChange={(e) => handleInputChange("securityMeasures", e.target.value)}
                    required
                  />
                  {formErrors.securityMeasures && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.securityMeasures}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="maintainability">Maintainability *</Label>
                  <Textarea
                    id="maintainability"
                    placeholder="How maintainable is your design?"
                    className={`min-h-[100px] mt-2 ${formErrors.maintainability ? "border-red-500" : ""}`}
                    value={formData.maintainability}
                    onChange={(e) => handleInputChange("maintainability", e.target.value)}
                    required
                  />
                  {formErrors.maintainability && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.maintainability}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Supporting Documents *</CardTitle>
              <CardDescription>Upload diagrams, PDFs, or other supporting materials (Required)</CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-primary bg-primary/5' 
                    : formErrors.documents
                    ? 'border-red-500 bg-red-50'
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">Drag and drop files here, or click to browse</p>
                <p className="text-sm text-muted-foreground">Supports PDF, PNG, JPG, and other document formats</p>
                {/* Files will be uploaded with the main submission; no background upload */}
                {formErrors.documents && (
                  <p className="text-red-500 text-sm mt-2 font-medium">{formErrors.documents}</p>
                )}
                <Input 
                  ref={fileInputRef}
                  type="file" 
                  multiple 
                  className="hidden" 
                  onChange={(e) => handleFileUpload(e.target.files)}
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
                  onClick={(e) => e.stopPropagation()}
                />
                <Button 
                  type="button"
                  variant="outline" 
                  className="mt-4 bg-transparent"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    fileInputRef.current?.click()
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Choose Files
                </Button>
              </div>

              {/* File List */}
              {uploadedFiles.length > 0 && (
                <div className="mt-6 space-y-2">
                  <h4 className="font-medium">Uploaded Files:</h4>
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">{file.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button 
              type="submit" 
              size="lg" 
              disabled={
                isSubmitting ||
                !formData.candidate || 
                !formData.problemDescription.trim() || 
                !formData.proposedArchitecture.trim() || 
                !formData.designTradeoffs.trim() || 
                !formData.scalability.trim() || 
                !formData.securityMeasures.trim() || 
                !formData.maintainability.trim() || 
                uploadedFiles.length === 0
              }
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Design Review
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
