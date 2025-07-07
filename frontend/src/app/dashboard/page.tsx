"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Calendar, Users, TrendingUp, RefreshCw, ChevronLeft, ChevronRight, LogOut, User, Settings } from "lucide-react"
import { Link } from "react-router-dom"
import { apiService, Retro } from "@/services/api"
import { api } from '../../services/api'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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

interface User {
  id: string
  email: string
  name: string
  imageUrl: string 
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [retros, setRetros] = useState<Retro[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  // Check authentication and fetch user info first
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Step 1: Check if user is authenticated
        const authStatus = api.isAuthenticated()
        setIsAuthenticated(authStatus)
        
        if (!authStatus) {
          setError('User not authenticated. Please login first.')
          setLoading(false)
          return
        }

        // Step 2: Fetch user info
        console.log('Fetching user info from session...')
        const userData = await api.getCurrentUser()
        setUser(userData)
        console.log('User data loaded from session:', userData)

        // Step 3: Fetch dashboard data only after user is confirmed
        await fetchDashboardData(true) // Silent fetch for initial load

      } catch (err) {
        console.error('Failed to initialize dashboard:', err)
        setError('Failed to load dashboard. Please try logging in again.')
        // Clear invalid session data
        api.removeAuthToken()
      } finally {
        setLoading(false)
      }
    }

    initializeDashboard()
  }, [])

  // Setup auto-refresh only after initial load is complete
  useEffect(() => {
    if (!isAuthenticated || loading) return

    const interval = setInterval(() => {
      fetchDashboardData(true) // Silent refresh
    }, 15000)

    return () => clearInterval(interval)
  }, [isAuthenticated, loading])

  // Handle page changes
  useEffect(() => {
    if (!isAuthenticated || loading) return
    
    fetchDashboardData(true) // Silent fetch for page changes
  }, [currentPage, isAuthenticated])

  const fetchDashboardData = async (silent = false) => {
    // Don't fetch if not authenticated
    if (!isAuthenticated) {
      console.log('Skipping dashboard fetch - user not authenticated')
      return
    }

    if (!silent) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }

    try {
      console.log('Starting dashboard data fetch...')
      
      // Fetch dashboard data from backend
      const [retrosData, statsData] = await Promise.all([
        apiService.getDashboardRetros(currentPage, 3),
        apiService.getDashboardStats(),
      ])

      // Handle empty data gracefully - this is not an error
      console.log('Dashboard data received:', { retrosData, statsData })
      
      // Validate data structure
      const validRetrosData = retrosData && typeof retrosData === 'object' ? retrosData : { retros: [], pagination: null }
      const validStatsData = statsData && typeof statsData === 'object' ? statsData : { totalRetros: 0, uniqueMembers: 0, actionItems: { total: 0, completed: 0 } }
      
      console.log('Validated data:', { validRetrosData, validStatsData })
      
      setStats(validStatsData)
      setRetros(validRetrosData.retros || [])
      setPagination(validRetrosData.pagination || {
        page: currentPage,
        limit: 3,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      })
      setError(null) // Clear any previous errors
      
      console.log('Dashboard data set successfully')
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      
      // Log the full error details for debugging
      if (error instanceof Error) {
        console.error("Error details:", {
          message: error.message,
          name: error.name,
          stack: error.stack
        })
      }
      
      // Only set error for actual network/authentication issues, not empty data
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase()
        console.log('Error message analysis:', errorMessage)
        
        if (errorMessage.includes('authentication failed') || 
            errorMessage.includes('http error') ||
            errorMessage.includes('failed to fetch') ||
            errorMessage.includes('network error') ||
            errorMessage.includes('unauthorized') ||
            errorMessage.includes('forbidden') ||
            errorMessage.includes('not found') ||
            errorMessage.includes('500') ||
            errorMessage.includes('502') ||
            errorMessage.includes('503') ||
            errorMessage.includes('504')) {
          console.log('Setting error UI for critical error')
          setError('Failed to load dashboard data. Please try refreshing.')
        } else {
          // For other errors, just log them but don't show error UI
          console.warn('Non-critical error during dashboard fetch:', error)
          console.log('Setting empty data instead of error UI')
          // Set empty data instead of error
          setStats({
            totalRetros: 0,
            uniqueMembers: 0,
            actionItems: { total: 0, completed: 0 }
          })
          setRetros([])
          setPagination({
            page: currentPage,
            limit: 3,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          })
          setError(null) // Clear any previous errors
        }
      } else {
        // Handle non-Error objects
        console.warn('Unknown error type during dashboard fetch:', error)
        console.log('Setting empty data for unknown error type')
        setStats({
          totalRetros: 0,
          uniqueMembers: 0,
          actionItems: { total: 0, completed: 0 }
        })
        setRetros([])
        setPagination({
          page: currentPage,
          limit: 3,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        })
        setError(null)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
      console.log('Dashboard fetch completed')
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
      case "completed":
        return "Completed"
      case "draft":
        return "Draft"
      default:
        return status
    }
  }

  const handleLogout = () => {
    api.removeAuthToken()
    window.location.href = '/login'
  }

  // Show authentication error
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please login to access the dashboard</p>
          <Link to="/login">
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header with loading state */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
              <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-x-4">
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with User Profile */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">RemoteRetro</h1>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">Dashboard</span>
            </div>
            
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.imageUrl} alt={user.name} />
                      <AvatarFallback>
                        {user.name?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8"> 

        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 flex items-center">
              Welcome back, {user?.name?.split(' ')[0] || 'User'}!
              {refreshing && <RefreshCw className="h-5 w-5 ml-2 animate-spin text-gray-400" />}
            </h2>
            <p className="text-gray-600 mt-2">Manage your retrospectives and track team progress</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="default"
              className="flex items-center space-x-2 h-10 px-4"
              onClick={() => fetchDashboardData()}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Link to="/retro/new">
              <Button className="flex items-center space-x-2 h-10 px-4" size="default">
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
              <div className="text-2xl font-bold">{stats?.totalRetros ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                {(stats?.totalRetros ?? 0) === 1 ? "retrospective" : "retrospectives"} created
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.uniqueMembers ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                {(stats?.uniqueMembers ?? 0) === 1 ? "unique participant" : "unique participants"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Action Items</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.actionItems?.total ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.actionItems?.completed ?? 0} completed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Retros */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Retrospectives</CardTitle>
                <CardDescription>
                  {retros.length > 0 
                    ? "Your team's latest retrospective sessions" 
                    : "Get started by creating your first retrospective"
                  }
                </CardDescription>
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
                      {retro.format && (
                        <span className="inline-block text-xs bg-blue-100 text-blue-800 rounded px-2 py-0.5 mt-1 mb-1 mr-2">
                          Format: {retro.format.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </span>
                      )}
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
                <div className="text-center py-12">
                  <div className="mb-4">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No retrospectives yet</h3>
                    <p className="text-gray-500 mb-6">
                      Start your first retrospective to begin tracking team feedback and improvements
                    </p>
                  </div>
                  <Link to="/retro/new">
                    <Button size="lg">
                      <Plus className="h-5 w-5 mr-2" />
                      Create Your First Retro
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Pagination - only show if there are multiple pages */}
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
