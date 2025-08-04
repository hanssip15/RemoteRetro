"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Calendar, Users, TrendingUp, RefreshCw, ChevronLeft, ChevronRight, LogOut, User } from "lucide-react"
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
  activeRetros?: number
  completedRetros?: number
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
  

  const fetchDashboardData = async (silent = false, userId: string) => {
    if (!silent) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }
  
    try {

      
      const [retrosData, statsData] = await Promise.all([
        await apiService.getDashboardRetros(userId,currentPage, 3),
        await apiService.getDashboardStats(userId)  
      ])
  
      setStats(statsData)
      setRetros(retrosData.retros || [])
      setPagination(retrosData.pagination || {
        page: currentPage,
        limit: 3,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      })
      setError(null)
    } catch (error) {
      // Error handling seperti sebelumnya
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
  const fetchUserAndDashboard = async () => {
    try {
      const userData = await api.getCurrentUser()
      if (!userData) {
        api.removeAuthToken()
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
        return
      }
      setUser(userData)
      setIsAuthenticated(true)

      // Panggil fetchDashboard setelah user valid
      await fetchDashboardData(false, userData.id)
    } catch (err) {
      console.error(err)
      setError('Failed to fetch user. Please try again.')
      await api.removeAuthToken()
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
    }
  }

  fetchUserAndDashboard()
}, [currentPage])
  
//   useEffect(() => {
//   if (!isAuthenticated || !user?.id) return
//   fetchDashboardData(false, user.id)
// }, [isAuthenticated, user?.id, currentPage])

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
      case "draft":
        return "bg-gray-100 text-gray-800"
      case "ongoing":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case "draft":
        return "Draft"
      case "ongoing":
        return "Ongoing"
      case "completed":
        return "Completed"
      default:
        return status
    }
  }

  const handleLogout = async () => {
    try {
      await api.removeAuthToken(); // Panggil backend untuk logout
    } catch (error) {
      console.error('Failed to logout:', error);
    }
    window.location.href = '/login';
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
      <div className="sticky top-0 z-30 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">RetroSprint</h1>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">Dashboard</span>
            </div>
            
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.imageUrl} alt={user.name} loading="lazy" />
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

        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 md:mb-8">
          <div>
            <h2 className="text-xl md:text-3xl font-bold text-gray-900 flex items-center">
              Welcome back, {user?.name?.split(' ')[0] || 'User'}!
              {refreshing && <RefreshCw className="h-5 w-5 ml-2 animate-spin text-gray-400" />}
            </h2>
             <p className="text-sm md:text-gray-600 mt-1 md:mt-2">Manage your retrospectives and track team progress</p>
            {/* Button group for mobile */}
            <div className="flex justify-center gap-2 mt-4 md:hidden">
              <Button
                variant="outline"
                size="default"
                className="flex items-center space-x-2 h-9 px-3"
                onClick={() => fetchDashboardData(false, user?.id || '')}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Link to="/retro/new">
                <Button className="flex items-center space-x-2 h-9 px-3" size="default">
                  <Plus className="h-4 w-4" />
                  <span>New Retro</span>
                </Button>
              </Link>
            </div>
          </div>
          {/* Button group for desktop */}
          <div className="hidden md:flex items-center space-x-2">
            <Button
              variant="outline"
              size="default"
              className="flex items-center space-x-2 h-10 px-4"
              onClick={() => fetchDashboardData(false, user?.id || '')}
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
        <div className="grid gap-4 md:grid-cols-3 md:gap-6 mb-4 md:mb-8">

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Retros</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalRetros ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                Total retrospectives created
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Retros</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeRetros ?? 0}</div>
              <p className="text-xs text-muted-foreground">Ongoing sessions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Retros</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.completedRetros ?? 0}</div>
              <p className="text-xs text-muted-foreground">Finished sessions</p>
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
            <div className="space-y-2 md:space-y-4">
              {retros.length > 0 ? (
                retros.map((retro) => (
                  <div
                    key={retro.id}
                    className="flex flex-col md:flex-row md:items-center md:justify-between p-2 md:p-4 border rounded-lg hover:bg-gray-50 transition-colors"

                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-base md:text-lg">{retro.title}</h3>

                      {retro.format && (
                        <div className="text-xs text-gray-600 mt-1 mb-1">
                          Format: {retro.format.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                        </div>
                      )}
                      <p className="text-sm text-gray-600">
                        {formatDate(retro.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 mt-2 md:mt-0 ml-0 md:ml-4">
                      <Badge className={`${getStatusColor(retro.status)} border-0 text-xs md:text-sm`}>
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
              <div className="flex items-center justify-between mt-4 md:mt-6 pt-4 border-t overflow-x-auto">
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
                          className="w-8 h-8 p-0 text-xs md:text-base"

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