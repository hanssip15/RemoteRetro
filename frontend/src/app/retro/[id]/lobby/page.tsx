"use client"

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { JoinNameModal } from "@/components/join-name-modal"
import { ShareLinkModal } from "@/components/share-link-modal"
import { ArrowLeft, Users, Clock, Share2, Play, RefreshCw, Crown } from "lucide-react"
import { Link } from "react-router-dom"
import { apiService, Retro, Participant } from "@/services/api"

export default function RetroLobbyPage() {
  const params = useParams()
  const navigate = useNavigate()
  const retroId = params.id as string

  const [retro, setRetro] = useState<Retro | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showStartConfirm, setShowStartConfirm] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)

  useEffect(() => {
    if (retroId === "new") {
      navigate("/retro/new")
      return
    }


    // Check if user already joined
    const storedUserName = localStorage.getItem(`retro_${retroId}_user`)
    const storedUserRole = localStorage.getItem(`retro_${retroId}_role`)

    if (storedUserName && storedUserRole) {
      setUserName(storedUserName)
      setUserRole(storedUserRole)
    } else {
      setShowJoinModal(true)
    }

    fetchLobbyData()
  }, [retroId, navigate])

  const fetchLobbyData = async () => {
    try {
      const data = await apiService.getRetro(retroId)
      setRetro(data.retro)
      setParticipants(data.participants)

      // Check if retro has started
      if (data.retro.status === "in_progress") {
        navigate(`/retro/${retroId}`)
        return
      }
    } catch (error) {
      console.error("Error fetching lobby data:", error)
      setError("Failed to fetch lobby data")
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async (name: string) => {
    setIsJoining(true)
    setJoinError(null)

    try {
      const participant = await apiService.joinRetro(retroId, { name })

      // Store user info in localStorage
      localStorage.setItem(`retro_${retroId}_user`, name)
      localStorage.setItem(`retro_${retroId}_role`, participant.role)

      setUserName(name)
      setUserRole(participant.role)
      setShowJoinModal(false)

      // Refresh lobby data
      fetchLobbyData()
    } catch (error) {
      console.error("Error joining retro:", error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to join retro'
      setJoinError(errorMessage)
    } finally {
      setIsJoining(false)
    }
  }

  const handleStartRetro = async () => {
    try {
      await apiService.updateRetro(Number.parseInt(retroId, 10), { status: "in_progress" })
      navigate(`/retro/${retroId}`)
    } catch (error) {
      console.error("Error starting retro:", error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to start retro'
      alert(`Failed to start retro: ${errorMessage}`)
    }
  }

  const shareUrl = typeof window !== "undefined" ? window.location.href : ""
  const facilitator = participants.find((p) => p.role === "facilitator")
  const isFacilitator = userRole === "facilitator"

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lobby...</p>
        </div>
      </div>
    )
  }

  if (error || !retro) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{error || "Retro not found"}</h1>
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
                  <Badge variant={retro.status === "active" ? "default" : "secondary"}>{retro.status}</Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => setShowShareModal(true)}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              {isFacilitator && (
                <Button onClick={() => setShowStartConfirm(true)}>
                  <Play className="h-4 w-4 mr-2" />
                  Start Retro
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lobby Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Kolom kiri: Participants */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Participants ({participants.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[420px] flex items-center justify-center">
              <div className="space-y-3 w-full">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-indigo-600">
                          {participant.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{participant.name}</p>
                        <p className="text-sm text-gray-500">
                          {participant.role === "facilitator" ? "Facilitator" : "Participant"}
                        </p>
                      </div>
                    </div>
                    {participant.role === "facilitator" && (
                      <Crown className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                ))}
                {participants.length === 0 && (
                  <div className="flex w-full h-full items-center justify-center">
                    <p className="text-gray-500 text-center">No participants yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          {/* Kolom kanan: Stack Retrospective Details + Prime Directive */}
          <div className="flex flex-col gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Retrospective Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900">Title</h3>
                  <p className="text-gray-600">{retro.title}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900">Status</h3>
                    <p className="text-gray-600">{retro.status}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Format</h3>
                    <p className="text-gray-600">{retro.format || "-"}</p>
                  </div>
                </div>
                {facilitator && (
                  <div>
                    <h3 className="font-medium text-gray-900">Facilitator</h3>
                    <p className="text-gray-600">{facilitator.name}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-center">The Prime Directive</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <hr className="my-2 w-full" />
                  <div className="mt-4 text-base text-gray-800 text-center" style={{ whiteSpace: 'pre-line' }}>
{`Regardless of what we discover,
we understand and truly believe
that everyone did the best job they could,
given what they knew at the time,
their skills and abilities,
the resources available,
and the situation at hand.`}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showJoinModal && (
        <JoinNameModal
          onJoin={handleJoin}
          error={joinError ?? undefined}
          isJoining={isJoining}
        />
      )}

      {showShareModal && shareUrl && (
        <ShareLinkModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          shareUrl={shareUrl}
        />
      )}

      {/* Start Confirmation */}
      {showStartConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Start Retrospective?</h3>
            <p className="text-gray-600 mb-6">
              Once started, participants will be redirected to the retrospective board.
            </p>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowStartConfirm(false)}>
                Cancel
              </Button>
              <Button onClick={handleStartRetro}>
                Start Retrospective
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
