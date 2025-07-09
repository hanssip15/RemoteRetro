import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FeedbackCard } from "@/components/feedback-card"
import { ArrowLeft, Users, Clock, Share2 } from "lucide-react"
import { Link } from "react-router-dom"
import { apiService, Retro, RetroItem, Participant } from "@/services/api"
// import { AddFeedbackForm } from "@/components/add-feedback-form"
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
  const [inputCategory, setInputCategory] = useState("happy")
  const [inputText, setInputText] = useState('')
  const userData = localStorage.getItem('user_data');
  const currentUser = userData ? JSON.parse(userData) : null;
  const [dataList, setDataList] = useState<{ category: string; text: string; id: string; user_id: string }[]>([]);

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
      setParticipants(data.participants || [])
    } catch (error) {
      console.error("Error fetching retro data:", error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(`Failed to fetch retro data: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }
  
  const handleAdd = () => {
    if (!inputText.trim()) return; // Jangan tambahkan jika kosong

    const newItem = {
      id: crypto.randomUUID(),
      category: inputCategory,
      text: inputText.trim(),
      user_id: currentUser?.id,
    };

    // Tambahkan item ke dalam array secara asynchronous
    setDataList(prev => [...prev, newItem]);
    setInputText(""); // Kosongkan input setelah ditambahkan
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAdd();
    }
  };

  // const handleAddFeedback = () => {
  //   if (!newFeedback.trim()) return;
  
  //   const newItem: FeedbackItem = {
  //     id: crypto.randomUUID(), // generate unique id for React key
  //     content: newFeedback.trim(),
  //     format: "format_1",
  //     retro_id: retroId,
  //   };
  
  //   setFeedbackItems((prev) => [...prev, newItem]);
  //   setNewFeedback('');
  // };


  
  

  const handleAddItem = async (type: string, content: string, author: string) => {
    try {
      const newItem = await apiService.createItem(Number.parseInt(String(retroId), 10), {
        category: type,
        content,
        author,
      })
      setItems((prev) => [...prev, newItem])
    } catch (error) {
      console.error("Error adding item:", error)
    }
  }

  // const handleUpdateItem = async (id: number, content: string) => {
  //   try {
  //     const updatedItem = await apiService.updateItem(Number.parseInt(String(retroId), 10), id, { content })
  //     setItems((prev) => prev.map((item) => (item.id === id ? updatedItem : item)))
  //   } catch (error) {
  //     console.error("Error updating item:", error)
  //   }
  // }

  // const handleDeleteItem = async (id: number) => {
  //   try {
  //     await apiService.deleteItem(Number.parseInt(String(retroId), 10), id)
  //     setItems((prev) => prev.filter((item) => item.id !== id))
  //   } catch (error) {
  //     console.error("Error deleting item:", error)
  //   }
  // }


  // const getItemsByType = (type: string) => {
  //   return items.filter((item) => item.category === type).sort((a, b) => b.votes - a.votes)
  // }

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href)
    // You could add a toast notification here
  }

  // Handler khusus untuk AddFeedbackForm baru (happy, sad, confused)
  const handleAddItemSimple = (content: string, author: string) => {
    handleAddItem("happy", content, author)
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
          {/* Format 1 */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span role="img" aria-label="format_1">X</span> {format[0]}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 min-h-[200px]">
              {/* {getItemsByType && getItemsByType("happy").map((item) => (
                <FeedbackCard
                  key={item.id}
                  item={{ ...item, author: item.author || "Anonymous" }}
                  onUpdate={handleUpdateItem}
                  onDelete={handleDeleteItem}
                  onVote={handleVoteItem}
                />
              ))} */}
              <div className="max-w-md mx-auto mt-4">
                  <h3 className="font-semibold mb-2">Data:</h3>
                  <ul className="space-y-1">
                  {dataList
                      .filter(item => item.category === format[0]) // hanya ambil yang kategori happy
                      .map((item, index) => (
                        <li key={index} className="border p-2 rounded bg-gray-50">
                          <span className="font-medium text-blue-600">{item.user_id}</span>: {item.text}
                        </li>
                    ))}
                  </ul>
                </div>
            </CardContent>
          </Card>
          {/* Format 2 */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span role="img" aria-label="format_2">X</span> {format[1]}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 min-h-[200px]">
            <div className="max-w-md mx-auto mt-4">
                  <h3 className="font-semibold mb-2">Data:</h3>
                  <ul className="space-y-1">
                  {dataList
                      .filter(item => item.category === format[1]) // hanya ambil yang kategori happy
                      .map((item, index) => (
                        <li key={index} className="border p-2 rounded bg-gray-50">
                          <span className="font-medium text-blue-600">{item.user_id}</span>: {item.text}
                        </li>
                    ))}
                  </ul>
                </div>
            </CardContent>
          </Card>
          {/* Format 3 */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span role="img" aria-label="format_3">X</span> {format[2]}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 min-h-[200px]">
            <div className="max-w-md mx-auto mt-4">
                  <h3 className="font-semibold mb-2">Data:</h3>
                  <ul className="space-y-1">
                  {dataList
                      .filter(item => item.category === format[2]) // hanya ambil yang kategori happy
                      .map((item, index) => (
                        <li key={index} className="border p-2 rounded bg-gray-50">
                          <span className="font-medium text-blue-600">{item.user_id}</span>: {item.text}
                        </li>
                    ))}
                  </ul>
                </div>
            </CardContent>
          </Card>
        </div>
        {/* Input form di bawah grid */}
        <div className="mt-8">
          <div className="flex flex-col md:flex-row gap-2 items-center justify-center">
            <label className="font-medium mr-2">Category:</label>
            <input type="hidden" value={currentUser?.id} />

            <select
              className="border rounded px-2 py-1"
              value={inputCategory}
              onChange={e => setInputCategory(e.target.value)}
            >
              <option value={format[0]}>{format[0].charAt(0).toUpperCase() + format[0].slice(1)}</option>
              <option value={format[1]}>{format[1].charAt(0).toUpperCase() + format[1].slice(1)}</option>
              <option value={format[2]}>{format[2].charAt(0).toUpperCase() + format[2].slice(1)}</option>
            </select>
            <input
              type="text"
              placeholder="Type something..."
              className="border rounded px-2 py-1"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button onClick={handleAdd}>Add</button>
          </div>
        </div>
      </div>
    </div>
  )
}
