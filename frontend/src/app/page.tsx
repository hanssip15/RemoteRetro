import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, MessageSquare, BarChart3, Zap } from "lucide-react"
import { api } from "@/services/api"
import { useEffect, useState   } from "react"

export default function HomePage() {
  const [authStatus, setAuthStatus] = useState(false)
   useEffect(() => {
    api.isAuthenticated().then((status: boolean) => {
      setAuthStatus(status)
    })
  }, [])
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="h-8 w-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">RetroSprint</h1>
          </div>
          <nav className="flex items-center space-x-4">
            <Link to="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>

            {authStatus && (
              <Link to="/retro/new">
                <Button>Start Retro</Button>
              </Link>
            )}
            {!authStatus && (
              <Link to="/login">
                <Button>Login</Button>
              </Link>
            )
            }
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 md:mb-6">
            Better Retrospectives for
            <span className="text-indigo-600"> Remote Teams</span>
          </h2>
          <p className="text-base md:text-xl text-gray-600 mb-6 md:mb-8 max-w-md md:max-w-3xl mx-auto">
            Conduct engaging and productive retrospectives with your distributed team. Collaborate in real-time, gather
            insights, and drive continuous improvement.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/retro/new">
              <Button size="lg" className="px-6 py-2 md:px-8 md:py-3 w-full sm:w-auto">
                Start Your First Retro
              </Button>
            </Link>
            <Link to="/demo">
              <Button variant="outline" size="lg" className="px-6 py-2 md:px-8 md:py-3 bg-transparent w-full sm:w-auto">
                View Demo
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-10 md:gap-8 md:mb-16">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <Users className="h-12 w-12 text-indigo-600 mb-4" />
              <CardTitle>Real-time Collaboration</CardTitle>
              <CardDescription>
                Work together seamlessly with your team members in real-time, no matter where they are located.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <MessageSquare className="h-12 w-12 text-indigo-600 mb-4" />
              <CardTitle>Structured Feedback</CardTitle>
              <CardDescription>
                Organize thoughts with What Went Well, What Could Improve, and Action Items sections.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <BarChart3 className="h-12 w-12 text-indigo-600 mb-4" />
              <CardTitle>Analytics & Insights</CardTitle>
              <CardDescription>
                Track team progress over time with detailed analytics and actionable insights.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white rounded-2xl p-6 md:p-12 shadow-lg">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 md:mb-4">Ready to improve your team retrospectives?</h3>
          <p className="text-base md:text-lg text-gray-600 mb-6 md:mb-8">
            Join thousands of teams already using RetroSprint to drive continuous improvement.
          </p>
          <Link to="/retro/new">
            <Button size="lg" className="px-8 py-3 md:px-12 md:py-4 text-base md:text-lg w-full sm:w-auto">
              Get Started Now - It's Free
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 md:py-12 mt-10 md:mt-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Zap className="h-6 w-6" />
            <span className="text-xl font-bold">RetroSprint</span>
          </div>
          <p className="text-gray-400">Built with ❤️ for remote teams everywhere</p>
        </div>
      </footer>
    </div>
  )
}
