import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FeedbackCard } from "@/components/feedback-card"
import { AddFeedbackForm } from "@/components/add-feedback-form"
import { ArrowLeft, Users, Clock, Share2 } from "lucide-react"
import { Link } from "react-router-dom"
import { apiService, Retro, RetroItem, Participant } from "@/services/api"
import { Input } from "@/components/ui/input"

export default function RetroPage() {
  const params = useParams()
  const navigate = useNavigate()
  const retroId = params.id as string
  const [newWentWell, setNewWentWell] = useState('');
  const [retroItems, setRetroItems] = useState<RetroItem[]>([])

  const [retro, setRetro] = useState<Retro | null>(null)
  const [items, setItems] = useState<RetroItem[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [format, setFormat] = useState<string[]>([])

  useEffect(() => {
    // If the ID is "new", redirect to the new retro page
    if (retroId === "new") {
      navigate("/retro/new")
      return
    }

    fetchRetroData()
  }, [retroId, navigate])

  const fetchRetroData = async () => {
    try {
      console.log("Fetching retro data for ID:", retroId)

      const data = await apiService.getRetro(retroId)
      console.log("Retro data received:", data)
      if (data.retro.format === "happy_sad_confused") {
        setFormat(["Happy", "Sad", "Confused"])
      } else {
        setFormat(["Start", "Stop", "Continue"])
      }
      if (!data.retro) {
        throw new Error("No retro data in response")
      }
      setRetro(data.retro)
      setItems(data.items || [])
      setParticipants(data.participants || [])
    } catch (error) {
      console.error("Error fetching retro data:", error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(`Failed to fetch retro data: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAddLocalItem = () => {
    if (!newWentWell.trim()) return;
  
    const newItem: RetroItem = {
      id: Date.now(), // temporary ID
      content: newWentWell.trim(),
      type: "went_well",
      author: currentUser?.name || "Anonymous",
      votes: 0,
      category: null, // jika ada kategori
      createdAt: new Date().toISOString(),
    };
  
    setRetroItems((prev) => [...prev, newItem]);
    setNewWentWell('');
  };
  

  const handleAddItem = async (type: string, content: string, author: string) => {
    try {
      const newItem = await apiService.createItem(Number.parseInt(retroId, 10), {
        category: type,
        content,
        author,
      })
      setItems((prev) => [...prev, newItem])
    } catch (error) {
      console.error("Error adding item:", error)
    }
  }

  const handleUpdateItem = async (id: number, content: string) => {
    try {
      const updatedItem = await apiService.updateItem(Number.parseInt(retroId, 10), id, { content })
      setItems((prev) => prev.map((item) => (item.id === id ? updatedItem : item)))
    } catch (error) {
      console.error("Error updating item:", error)
    }
  }

  const handleDeleteItem = async (id: number) => {
    try {
      await apiService.deleteItem(Number.parseInt(retroId, 10), id)
      setItems((prev) => prev.filter((item) => item.id !== id))
    } catch (error) {
      console.error("Error deleting item:", error)
    }
  }

  const handleVoteItem = async (id: number) => {
    try {
      const updatedItem = await apiService.voteItem(Number.parseInt(retroId, 10), id)
      setItems((prev) => prev.map((item) => (item.id === id ? updatedItem : item)))
    } catch (error) {
      console.error("Error voting item:", error)
    }
  }

  const getItemsByType = (type: string) => {
    return items.filter((item) => item.category === type).sort((a, b) => b.votes - a.votes)
  }

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href)
    // You could add a toast notification here
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading retrospective...</p>
        </div>
      </div>
    )
  }

  if (error || !retro) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{error || "Retrospective not found"}</h1>
          <Link to="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{retro.title}</h1>
                <div className="flex items-center space-x-4 mt-1">
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <Users className="h-3 w-3" />
                    <span>{participants.length} participants</span>
                  </Badge>
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{retro.duration} min</span>
                  </Badge>
                  <Badge variant={retro.status === "active" ? "default" : "secondary"}>{retro.status}</Badge>
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={copyShareLink}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>

      {/* Retro Board */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* What Went Well */}
          <Card className="h-fit">
            <CardHeader className="bg-green-50">
              <CardTitle className="text-green-800 flex items-center justify-between">
                {format[0]}
                <Badge variant="secondary">{getItemsByType("went_well").length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {getItemsByType("went_well").map((item) => (
                <FeedbackCard
                  key={item.id}
                  item={{
                    id: item.id,
                    content: item.content,
                    author: item.author || "Anonymous",
                    votes: item.votes,
                    category: item.category,
                  }}
                  onUpdate={handleUpdateItem}
                  onDelete={handleDeleteItem}
                  onVote={handleVoteItem}
                />
              ))}
               <div className="flex items-center space-x-2 pt-2">
                  <Input
                    placeholder="Add feedback..."
                    className="flex-1"
                    // value={newWentWell}
                    // onChange={(e) => setNewWentWell(e.target.value)}
                    // disabled={isSubmitting}
                  />
                  <Button
                    // onClick={handleAddWentWell}
                    // disabled={isSubmitting || !newWentWell.trim()}
                  >
                    Add
                  </Button>
                </div>
            </CardContent>
          </Card>

          {/* What Could Improve */}
          <Card className="h-fit">
            <CardHeader className="bg-yellow-50">
              <CardTitle className="text-yellow-800 flex items-center justify-between">
                {format[1]}
                <Badge variant="secondary">{getItemsByType("improve").length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {getItemsByType("improve").map((item) => (
                <FeedbackCard
                  key={item.id}
                  item={{
                    id: item.id,
                    content: item.content,
                    author: item.author || "Anonymous",
                    votes: item.votes,
                    category: item.category,
                  }}
                  onUpdate={handleUpdateItem}
                  onDelete={handleDeleteItem}
                  onVote={handleVoteItem}
                />
              ))}
            </CardContent>
          </Card>

          {/* Action Items */}
          <Card className="h-fit">
            <CardHeader className="bg-blue-50">
              <CardTitle className="text-blue-800 flex items-center justify-between">
                {format[2]}
                <Badge variant="secondary">{getItemsByType("action_item").length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {getItemsByType("action_item").map((item) => (
                <FeedbackCard
                  key={item.id}
                  item={{
                    id: item.id,
                    content: item.content,
                    author: item.author || "Anonymous",
                    votes: item.votes,
                    category: item.category,
                  }}
                  onUpdate={handleUpdateItem}
                  onDelete={handleDeleteItem}
                  onVote={handleVoteItem}
                />
              ))}
              
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
