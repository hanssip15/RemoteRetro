import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FeedbackCard } from "@/components/feedback-card"
import { ArrowLeft, Users, Clock, Share2 } from "lucide-react"
import { Link } from "react-router-dom"
import { apiService, Retro, RetroItem, Participant } from "@/services/api"
import { useSocket } from "@/hooks/use-socket"

export default function RetroPage() {
  const params = useParams()
  const navigate = useNavigate()
  const retroId = params.id as string

  const [retro, setRetro] = useState<Retro | null>(null)
  const [items, setItems] = useState<RetroItem[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [format, setFormat] = useState<string[]>([])
  const [inputCategory, setInputCategory] = useState("format_1")
  const [inputText, setInputText] = useState('')
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [isUpdatingItem, setIsUpdatingItem] = useState(false)
  const [isDeletingItem, setIsDeletingItem] = useState(false)
  const userData = localStorage.getItem('user_data');
  const currentUser = userData ? JSON.parse(userData) : null;

  // Get current user's role in this retro
  const currentUserRole = participants.find(p => p.user.id === currentUser?.id)?.role || false;

  // WebSocket handlers
  const handleItemAdded = (newItem: RetroItem) => {
    setItems(prev => {
      // Check if item already exists to avoid duplicates
      const exists = prev.find(item => item.id === newItem.id);
      if (exists) return prev;
      return [...prev, newItem];
    });
  };

  const handleItemUpdated = (updatedItem: RetroItem) => {
    setItems(prev => prev.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    ));
  };

  const handleItemDeleted = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleItemsUpdate = (newItems: RetroItem[]) => {
    setItems(newItems);
  };

  const handleParticipantUpdate = () => {
    // Refresh participants data
    fetchRetroData();
  };

  // Initialize WebSocket connection
  const { isConnected } = useSocket({
    retroId,
    onItemAdded: handleItemAdded,
    onItemUpdated: handleItemUpdated,
    onItemDeleted: handleItemDeleted,
    onItemsUpdate: handleItemsUpdate,
    onParticipantUpdate: handleParticipantUpdate,
  });

  useEffect(() => {
    if (!currentUser) {
      navigate("/login")
      return
    }
    if (retroId === "new") {
      navigate("/retro/new")
      return
    }

    fetchRetroData()
    fetchItems()
  }, [retroId, navigate])

  const fetchRetroData = async () => {
    try {
      console.log("Fetching retro data for ID:", retroId)

      const data = await apiService.getRetro(retroId)
      console.log("Retro data received:", data)
      if (data.retro.format === "happy_sad_confused") {
        setFormat(["format_1", "format_2", "format_3"])
      } else {
        setFormat(["format_1", "format_2", "format_3"])
      }
      if (!data.retro) {
        throw new Error("No retro data in response")
      }
      setRetro(data.retro)
      setParticipants(data.participants || [])
    } catch (error) {
      console.error("Error fetching retro data:", error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(Failed to fetch retro data: ${errorMessage})
    } finally {
      setLoading(false)
    }
  }

  const fetchItems = async () => {
    try {
      const itemsData = await apiService.getItems(retroId)
      setItems(itemsData)
    } catch (error) {
      console.error("Error fetching items:", error)
    }
  }
  
  const handleAdd = async () => {
    if (!inputText.trim() || !currentUser) return;

    setIsAddingItem(true)
    try {
      const newItem = await apiService.createItem(retroId, {
        category: inputCategory,
        content: inputText.trim(),
        created_by: currentUser.id,
        author: currentUser.name || currentUser.email,
      })

      // Note: Item will be added via WebSocket broadcast, so we don't need to add it here
      setInputText("")
    } catch (error) {
      console.error("Error adding item:", error)
      setError("Failed to add item. Please try again.")
    } finally {
      setIsAddingItem(false)
    }
  };

  const handleUpdateItem = async (itemId: string, content: string) => {
    if (!currentUser) return;

    setIsUpdatingItem(true)
    try {
      await apiService.updateItem(retroId, itemId, { 
        content,
        userId: currentUser.id 
      })
      // Note: Item will be updated via WebSocket broadcast
    } catch (error) {
      console.error("Error updating item:", error)
      setError("Failed to update item. Please try again.")
    } finally {
      setIsUpdatingItem(false)
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!currentUser) return;

    setIsDeletingItem(true)
    try {
       await apiService.deleteItem(retroId, itemId)
      // Note: Item will be deleted via WebSocket broadcast
    } catch (error) {
      console.error("Error deleting item:", error)
      setError("Failed to delete item. Please try again.")
    } finally {
      setIsDeletingItem(false)
    }
  };


  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isAddingItem) {
      handleAdd();
    }
  };

  const getItemsByCategory = (category: string) => {
    return items.filter((item) => item.category === category)
  }

  const getCategoryDisplayName = (category: string) => {
    if (retro?.format === "happy_sad_confused") {
      const mapping = {
        "format_1": "Happy",
        "format_2": "Sad", 
        "format_3": "Confused"
      }
      return mapping[category as keyof typeof mapping] || category
    } else {
      const mapping = {
        "format_1": "Start",
        "format_2": "Stop",
        "format_3": "Continue"
      }
      return mapping[category as keyof typeof mapping] || category
    }
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
                  {retro && (retro as any).duration && (
                    <Badge variant="secondary" className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{(retro as any).duration} min</span>
                    </Badge>
                  )}
                  <Badge variant={retro.status === "draft" ? "default" : "secondary"}>{retro.status}</Badge>
                  {/* WebSocket connection status */}
                  {/* User role indicator */}
                  {currentUserRole && (
                    <Badge variant="default" className="bg-blue-500">
                      Facilitator
                    </Badge>
                  )}
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
          {/* Format 1 */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span role="img" aria-label="format_1">X</span> {getCategoryDisplayName(format[0])}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 min-h-[200px]">
              {getItemsByCategory(format[0]).map((item) => (
                <FeedbackCard
                  key={item.id}
                  item={{ ...item, author: item.author || "Anonymous" }}
                  currentUser={currentUser}
                  userRole={currentUserRole}
                  onUpdate={handleUpdateItem}
                  onDelete={handleDeleteItem}
                />
              ))}
            </CardContent>
          </Card>
          {/* Format 2 */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span role="img" aria-label="format_2">X</span> {getCategoryDisplayName(format[1])}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 min-h-[200px]">
              {getItemsByCategory(format[1]).map((item) => (
                <FeedbackCard
                  key={item.id}
                  item={{ ...item, author: item.author || "Anonymous" }}
                  currentUser={currentUser}
                  userRole={currentUserRole}
                  onUpdate={handleUpdateItem}
                  onDelete={handleDeleteItem}
                />
              ))}
            </CardContent>
          </Card>
          {/* Format 3 */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span role="img" aria-label="format_3">X</span> {getCategoryDisplayName(format[2])}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 min-h-[200px]">
              {getItemsByCategory(format[2]).map((item) => (
                <FeedbackCard
                  key={item.id}
                  item={{ ...item, author: item.author || "Anonymous" }}
                  currentUser={currentUser}
                  userRole={currentUserRole}
                  onUpdate={handleUpdateItem}
                  onDelete={handleDeleteItem}
                />
              ))}
            </CardContent>
          </Card>
        </div>
        {/* Input form di bawah grid */}
        <div className="mt-8">
          <div className="flex flex-col md:flex-row gap-2 items-center justify-center">
            <label className="font-medium mr-2">Category:</label>
            <select
              className="border rounded px-2 py-1"
              value={inputCategory}
              onChange={e => setInputCategory(e.target.value)}
              disabled={isAddingItem}
            >
              <option value="format_1">{getCategoryDisplayName("format_1")}</option>
              <option value="format_2">{getCategoryDisplayName("format_2")}</option>
              <option value="format_3">{getCategoryDisplayName("format_3")}</option>
            </select>
            <input
              type="text"
              placeholder="Type something..."
              className="border rounded px-2 py-1"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isAddingItem}
            />
            <Button 
              onClick={handleAdd} 
              disabled={isAddingItem || !inputText.trim()}
              className="px-4 py-1"
            >
              {isAddingItem ? "Adding..." : "Add"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}