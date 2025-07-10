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
import { ShareLinkModal } from '@/components/share-link-modal';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, User, Pen } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  const [showShareModal, setShowShareModal] = useState(false);
  const [user, setUser] = useState(() => {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  });

  // Get current user's role in this retro
  const currentUserRole = participants.find(p => p.user.id === user?.id)?.role || false;

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
    // If the ID is "new", redirect to the new retro page
    if (retroId === "new") {
      navigate("/retro/new")
      return
    }

    // Validate that retroId is a number

    fetchRetroData()
    fetchItems()
  }, [retroId, navigate])

  const fetchRetroData = async () => {
    try {
      const data = await apiService.getRetro(retroId)
      if (data.retro.format === "happy_sad_confused") {
        setFormat(["format_1", "format_2", "format_3"])
      } else {
        setFormat(["format_1", "format_2", "format_3"])
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

  const fetchItems = async () => {
    try {
      const itemsData = await apiService.getItems(retroId)
      setItems(itemsData)
    } catch (error) {
      console.error("Error fetching items:", error)
    }
  }
  
  const handleAdd = async () => {
    if (!inputText.trim() || !user) return;

    setIsAddingItem(true)
    try {
      const newItem = await apiService.createItem(retroId, {
        category: inputCategory,
        content: inputText.trim(),
        created_by: user.id,
        author: user.name || user.email,
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
    if (!user) return;

    setIsUpdatingItem(true)
    try {
      await apiService.updateItem(retroId, itemId, { 
        content,
        userId: user.id 
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
    if (!user) return;

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

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    window.location.href = '/login';
  };

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
    <div className="min-h-screen bg-gray-50 flex flex-col">
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
                  {currentUserRole && (
                    <Badge variant="default" className="bg-blue-500">
                      Facilitator
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => setShowShareModal(true)}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
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
      </div>

      {/* Share Link Modal */}
      <ShareLinkModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareUrl={typeof window !== 'undefined' ? window.location.href : ''}
      />

      {/* Retro Board */}
      <div className="container mx-auto px-4 py-8 flex-1 pb-56">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Happy */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span role="img" aria-label="happy">😀</span> {getCategoryDisplayName(format[0])}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 min-h-[200px]">
              {getItemsByCategory(format[0]).map((item) => (
                <FeedbackCard
                  key={item.id}
                  item={{ ...item, author: item.author || "Anonymous" }}
                  currentUser={user}
                  userRole={currentUserRole}
                  onUpdate={handleUpdateItem}
                  onDelete={handleDeleteItem}
                />
              ))}
            </CardContent>
          </Card>
          {/* Sad */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span role="img" aria-label="sad">😢</span> {getCategoryDisplayName(format[1])}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 min-h-[200px]">
              {getItemsByCategory(format[1]).map((item) => (
                <FeedbackCard
                  key={item.id}
                  item={{ ...item, author: item.author || "Anonymous" }}
                  currentUser={user}
                  userRole={currentUserRole}
                  onUpdate={handleUpdateItem}
                  onDelete={handleDeleteItem}
                />
              ))}
            </CardContent>
          </Card>
          {/* Confused */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span role="img" aria-label="confused">🤔</span> {getCategoryDisplayName(format[2])}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 min-h-[200px]">
              {getItemsByCategory(format[2]).map((item) => (
                <FeedbackCard
                  key={item.id}
                  item={{ ...item, author: item.author || "Anonymous" }}
                  currentUser={user}
                  userRole={currentUserRole}
                  onUpdate={handleUpdateItem}
                  onDelete={handleDeleteItem}
                />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Input bawah sticky */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t z-40">
        <div className="container mx-auto px-4 py-4 flex flex-col items-center">
          {/* Avatar semua participants berjajar horizontal di atas card submit */}
          {participants.length > 0 && (
            <div className="flex flex-row items-end gap-6 mb-3">
              {participants.map((p) => {
                const isCurrentUser = user && p.user.id === user.id;
                const isCurrentFacilitator = participants.find(x => x.role)?.user.id === user?.id;
                return (
                  <div key={p.id} className="flex flex-col items-center relative">
                    <div className="relative">
                      <Avatar
                        className={`h-14 w-14 border-2 ${p.role ? 'border-blue-500' : 'border-gray-200'} group-hover:border-indigo-500 transition`}
                        title={`${p.user.name} ${p.role ? '(Facilitator)' : '(Participant)'}`}
                      >
                        {p.user.imageUrl ? (
                          <AvatarImage src={p.user.imageUrl} alt={p.user.name} />
                        ) : (
                          <AvatarFallback>
                            {p.user.name?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      {/* Icon pensil hanya muncul pada avatar peserta lain, jika user saat ini facilitator */}
                      {isCurrentFacilitator && !isCurrentUser && (
                        <span className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow border cursor-pointer" title="Promote to Facilitator">
                          <Pen className="h-4 w-4 text-indigo-600" />
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-900 mt-1 font-medium">{p.user.name}</span>
                    <span className="text-[11px] text-gray-500">{p.role ? 'Facilitator' : 'Participant'}</span>
                  </div>
                );
              })}
            </div>
          )}
          <Card className="bg-white rounded-xl w-full">
            <CardContent className="py-4 px-8">
              {/* Teks submit an idea di atas form, rata tengah */}
              <div className="w-full flex justify-center mb-2">
                <span className="text-xs text-teal-600 font-semibold">Submit an idea!</span>
              </div>
              <form
                className="flex flex-col md:flex-row items-center gap-2 md:gap-4 w-full"
                onSubmit={e => { e.preventDefault(); handleAdd(); }}
              >
                <label className="font-medium mr-2 mb-1">Category:</label>
                <select
                  className="w-32 px-3 pr-8 py-2 rounded-md border text-base"
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
                  placeholder="Ex. we have a linter!"
                  className="border rounded px-2 py-1 flex-1"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isAddingItem}
                />
                <Button
                  onClick={handleAdd}
                  disabled={isAddingItem || !inputText.trim()}
                  className="px-4 py-1"
                  type="submit"
                >
                  {isAddingItem ? "Adding..." : "Submit"}
                </Button>
                <Button
                  variant="secondary"
                  className="ml-2"
                  disabled={items.length === 0}
                >
                  Grouping
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
