"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, Eye, Download, BarChart3 } from "lucide-react"
import Link from "next/link"
import { useDesignReviews, useCandidates } from "@/lib/api-hooks"
import type { Candidate, DesignReview } from "@/lib/types"

const getStatusColor = (status: string) => {
  switch (status) {
    case "Completed":
      return "bg-green-500/20 text-green-400 border-green-500/30"
    case "In Progress":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    case "Reviewed":
      return "bg-purple-500/20 text-purple-400 border-purple-500/30"
    case "Questions Generated":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    case "Finalized":
      return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30"
  }
}

const getScoreColor = (scoreOutOfFive: number) => {
  if (scoreOutOfFive >= 4) return "text-green-400"
  if (scoreOutOfFive >= 3) return "text-yellow-400"
  return "text-red-400"
}

const normalizeToFive = (score: number | undefined | null) => {
  if (!score && score !== 0) return 0
  // If the score appears to be on a 10-point scale, normalize to 5
  if (score > 5) return Math.min(5, score / 2)
  return score
}

const getReviewScoreOutOfFive = (review: DesignReview): number | null => {
  const raw = (review as any).scores && (review as any).scores.length
    ? (review as any).scores[0]?.overallscore
    : review.overallScore
  if (raw === undefined || raw === null) return null
  return normalizeToFive(raw)
}

export default function DashboardPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [candidateMap, setCandidateMap] = useState<{ [key: number]: Candidate }>({})

  const { reviews, loading, error } = useDesignReviews()
  const { candidates, loading: candidatesLoading } = useCandidates()

  // Create candidate lookup map for better performance
  useEffect(() => {
    if (candidates.length > 0) {
      const map = candidates.reduce(
        (acc, candidate) => {
          if (candidate.id) {
            acc[candidate.id] = candidate
          }
          return acc
        },
        {} as { [key: number]: Candidate },
      )
      setCandidateMap(map)
    }
  }, [candidates])

  const filteredSubmissions = reviews.filter((review) => {
    const candidate = candidateMap[review.candidate]
    const candidateName = candidate ? candidate.name : `Candidate ${review.candidate}`
    const matchesSearch =
      candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.problemDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (candidate?.designation && candidate.designation.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === "all" || review.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalSubmissions = reviews.length
  const completedReviews = reviews.filter((r) => r.status === "Completed" || r.status === "Finalized").length
  const normalizedScores = reviews
    .map((r) => getReviewScoreOutOfFive(r))
    .filter((s): s is number => s !== null)
  const averageScore = normalizedScores.length
    ? normalizedScores.reduce((acc, s) => acc + s, 0) / normalizedScores.length
    : 0
  const pendingReviews = reviews.filter((r) => r.status === "Pending" || r.status === "In Progress").length

  const handleExportJson = () => {
    try {
      const exportData = filteredSubmissions.map((review) => {
        const candidate = candidateMap[review.candidate]
        const normalized = getReviewScoreOutOfFive(review)
        return {
          id: review.id,
          candidateId: review.candidate,
          candidateName: candidate?.name || null,
          candidateDesignation: candidate?.designation || null,
          problemDescription: review.problemDescription,
          proposedArchitecture: review.proposedArchitecture,
          designTradeoffs: review.designTradeoffs,
          scalibilty: review.scalibilty,
          securityMeasures: review.securityMeasures,
          maintainability: review.maintainability,
          status: review.status,
          submissionDate: review.submissionDate,
          overallScore: review.overallScore ?? null,
          scoreOutOfFive: normalized,
        }
      })

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const ts = new Date().toISOString().replace(/[:.]/g, "-")
      a.download = `design-reviews-export-${ts}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Failed to export JSON:", err)
      alert("Failed to export JSON. Please try again.")
    }
  }

  // Enhanced loading state to include candidates
  if (loading || candidatesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-red-500">Error loading dashboard: {error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Candidate Submissions Dashboard</h1>
            <p className="text-muted-foreground">Manage and review design submissions</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportJson}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Link href="/submit">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Submission
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSubmissions}</div>
              <p className="text-xs text-muted-foreground">
                {candidates.length} candidate{candidates.length !== 1 ? "s" : ""} registered
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedReviews}</div>
              <p className="text-xs text-muted-foreground">
                {totalSubmissions > 0 ? Math.round((completedReviews / totalSubmissions) * 100) : 0}% completion rate
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageScore ? averageScore.toFixed(1) : "N/A"}</div>
              <p className="text-xs text-muted-foreground">
                {reviews.filter((r) => r.overallScore).length} scored review
                {reviews.filter((r) => r.overallScore).length !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingReviews}</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filter Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by candidate name, designation, or problem description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Questions Generated">Questions Generated</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Reviewed">Reviewed</SelectItem>
                  <SelectItem value="Finalized">Finalized</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Submissions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
            <CardDescription>
              {filteredSubmissions.length} of {reviews.length} submissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredSubmissions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No submissions found matching your criteria.</p>
                {reviews.length === 0 && (
                  <Link href="/submit" className="mt-4 inline-block">
                    <Button>Create First Submission</Button>
                  </Link>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Problem Description</TableHead>
                    <TableHead>Submission Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Overall Score</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((review) => {
                    const candidate = candidateMap[review.candidate]
                    return (
                      <TableRow key={review.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {candidate ? candidate.name : `Candidate ${review.candidate}`}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {candidate ? candidate.designation : `ID: ${review.candidate}`}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm max-w-xs">
                          <div className="truncate" title={review.problemDescription}>
                            {review.problemDescription}
                          </div>
                        </TableCell>
                        <TableCell>
                          {review.submissionDate ? new Date(review.submissionDate).toLocaleDateString() : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(review.status || "Pending")}>
                            {review.status || "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const normalized = getReviewScoreOutOfFive(review)
                            if (normalized === null) {
                              return <span className="text-muted-foreground">Pending</span>
                            }
                            return (
                              <span className={`font-bold ${getScoreColor(normalized)}`}>
                                {normalized.toFixed(1)}/5
                              </span>
                            )
                          })()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Link href={`/review/${review.id}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </Link>
                            {review.status === "Questions Generated" && (
                              <Link href={`/questions/${review.id}`}>
                                <Button variant="outline" size="sm">
                                  Answer
                                </Button>
                              </Link>
                            )}
                            {review.overallScore && (
                              <Link href={`/review/${review.id}`}>
                                <Button variant="outline" size="sm">
                                  <BarChart3 className="h-4 w-4 mr-1" />
                                  Score
                                </Button>
                              </Link>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
