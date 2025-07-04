"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Calendar, Users, TrendingUp, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"
import { apiService, Retro } from "@/services/api"

interface DashboardStats {
  totalRetros: number
  uniqueMembers: number
  actionItems: {
    total: number
    completed: number
  }
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [retros, setRetros] = useState<Retro[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // Auto-refresh every 15 seconds
  useEffect(() => {
    fetchDashboardData()

    const interval = setInterval(() => {
      fetchDashboardData(true) // Silent refresh
    }, 15000)

    return () => clearInterval(interval)
  }, [currentPage])

  const fetchDashboardData = async (silent = false) => {
    if (!silent) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }

    try {
      // Fetch dashboard data from backend
      const [retrosData, statsData] = await Promise.all([
        apiService.getDashboardRetros(currentPage, 3),
        apiService.getDashboardStats(),
      ])

      setStats(statsData)
      setRetros(retrosData.retros)
      setPagination(retrosData.pagination)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
      case "in_progress":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      case "draft":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case "in_progress":
        return "In Progress"
      case "active":
        return "Active"
      case "completed":
        return "Completed"
      case "draft":
        return "Draft"
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>

          {/* Loading Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-4 animate-pulse"></div>
                  <div className="h-8 bg-gray-200 rounded w-16 mb-2 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Loading Recent Retros */}
          <Card>
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              Dashboard
              {refreshing && <RefreshCw className="h-5 w-5 ml-2 animate-spin text-gray-400" />}
            </h1>
            <p className="text-gray-600 mt-2">Manage your retrospectives and track team progress</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => fetchDashboardData()} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Link to="/retro/new">
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>New Retro</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Retros</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalRetros || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.totalRetros === 1 ? "retrospective" : "retrospectives"} created
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.uniqueMembers || 0}</div>
              <p className="text-xs text-muted-foreground">Unique participants</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Action Items</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.actionItems.total || 0}</div>
              <p className="text-xs text-muted-foreground">{stats?.actionItems.completed || 0} completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Retros */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Retrospectives</CardTitle>
                <CardDescription>Your team's latest retrospective sessions</CardDescription>
              </div>
              {pagination && pagination.total > 3 && (
                <div className="text-sm text-gray-500">
                  Showing {(pagination.page - 1) * pagination.limit + 1}-
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {retros.length > 0 ? (
                retros.map((retro) => (
                  <div
                    key={retro.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold">{retro.title}</h3>
                      <p className="text-sm text-gray-600">
                        {formatDate(retro.createdAt)} • {retro.teamSize || 0} participants • {retro.duration} min
                      </p>
                      {retro.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">{retro.description}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Badge className={`${getStatusColor(retro.status)} border-0`}>
                        {getStatusLabel(retro.status)}
                      </Badge>
                      <Link to={`/retro/${retro.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No retrospectives found</p>
                  <Link to="/retro/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Retro
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="text-sm text-gray-500">
                  Page {pagination.page} of {pagination.totalPages}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrev}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>

                  {/* Page Numbers */}
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => {
                      // Show first page, last page, current page, and pages around current
                      const showPage =
                        pageNum === 1 || pageNum === pagination.totalPages || Math.abs(pageNum - pagination.page) <= 1

                      if (!showPage) {
                        // Show ellipsis
                        if (pageNum === 2 && pagination.page > 4) {
                          return (
                            <span key={pageNum} className="px-2 text-gray-400">
                              ...
                            </span>
                          )
                        }
                        if (pageNum === pagination.totalPages - 1 && pagination.page < pagination.totalPages - 3) {
                          return (
                            <span key={pageNum} className="px-2 text-gray-400">
                              ...
                            </span>
                          )
                        }
                        return null
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === pagination.page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
