"use client"
// import { io } from 'socket.io-client';
import { useSocket } from "@/hooks/use-socket"
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

import { useEffect, useState, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShareLinkModal } from "@/components/share-link-modal"
import { ArrowLeft, Users, Clock, Share2, Play, RefreshCw, Crown, User } from "lucide-react"
import RetroHeader from '../RetroHeader';
import { Link } from "react-router-dom"
import { apiService, Retro, Participant, api } from "@/services/api"
import { PhaseConfirmModal } from '@/components/ui/dialog';


export default function RetroLobbyPage() {
  const params = useParams()
  const navigate = useNavigate()
  const retroId = params.id as string
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  
  const [retro, setRetro] = useState<Retro>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<boolean>(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showStartConfirm, setShowStartConfirm] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [socket, setSocket] = useState<any>(null)
  const [isOngoing, setIsOngoing] = useState(false)
  const [isPromoting, setIsPromoting] = useState(false)

  // Get current user from localStorage
  const userData = localStorage.getItem('user_data');
  const currentUser = userData ? JSON.parse(userData) : null;


  const fetchLobbyData = useCallback(async () => {
    if (!retroId) return;
    
    try {
      console.log('🔄 Fetching lobby data for retro:', retroId);
      const data = await apiService.getRetro(retroId);
      if (data.retro.status === "ongoing") {
        handleChangeView()
      }
      setRetro(data.retro);
      setParticipants(data.participants);
    } catch (error) {
      console.error("Error fetching lobby data:", error);
      setError("Failed to fetch lobby data");
    } finally {
      setLoading(false);
    }
  }, [retroId]);

  useEffect(() => {
    // Step 1: Check if user is authenticated
    const authStatus = api.isAuthenticated()
    if (!authStatus) {
      navigate('/login')
      return
    }

    if (!retroId) return;    
    fetchLobbyData();
  }, [retroId, fetchLobbyData]);

  // Auto-join participant function
  const checkAndJoinParticipant = useCallback(async () => {
    if (!currentUser || !retroId) return;
    const participant = participants.find((p) => p.user.id === currentUser.id);
    if (!participant) {
      try {
        setIsJoining(true);
        await apiService.addParticipant(retroId, {
          userId: currentUser.id,
          role: false,
        });
        await fetchLobbyData();
      } catch (error) {
        console.error("Failed to join as participant:", error);
      } finally {
        setIsJoining(false);
      }
    }
  }, [currentUser, retroId, participants, fetchLobbyData]);

  
  useEffect(() => {
    if (!loading && retro && participants.length > 0) {
      checkAndJoinParticipant();
    }
  }, [loading, retro, participants, checkAndJoinParticipant]);

  const handleChangeView = async () => {
    navigate(`/retro/${retroId}`)
  }

  const handleStartRetro = useCallback(async () => {
    try {
      if (socket) {
        socket.emit('retro-started', { retroId });
      }
      setIsOngoing(true)
      await apiService.updateRetro(retroId, { status: "ongoing" })
      // Set initial phase to prime-directive
      await apiService.updatePhase(retroId, 'prime-directive', currentUser?.id || '')
      handleChangeView()
    } catch (error) {
      console.error("Error starting retro:", error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to start retro'
      alert(`Failed to start retro: ${errorMessage}`)
    }
  }, [retroId, navigate, socket, isOngoing, currentUser?.id])

  


  const handlePromoteToFacilitator = useCallback(async () => {
    if (!selectedParticipant) return;
    try {
      setIsPromoting(true);
      await apiService.updateParticipantRole(retroId, selectedParticipant.id);
      await fetchLobbyData();
      setShowRoleModal(false);
      setSelectedParticipant(null);
    } catch (error) {
      console.error("Error promoting participant:", error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to promote participant';
      alert(`Failed to promote participant: ${errorMessage}`);
    } finally {
      setIsPromoting(false);
    }
  }, [retroId, selectedParticipant, fetchLobbyData]);


  const { isConnected } = useSocket({
    retroId,
    onParticipantUpdate: fetchLobbyData,
    onRetroStarted: handleChangeView,
  });
  
  const shareUrl = typeof window !== "undefined" ? window.location.href : ""
  const facilitator = participants.find((p) => p.role === true)
  const isFacilitator = currentUser?.id === facilitator?.user.id

  
  

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lobby...</p>
          {isJoining && (
            <p className="text-sm text-indigo-600 mt-2">Joining as participant...</p>
          )}
        </div>
      </div>
    )
  }

  if (error && !retro) {
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

  if (joinError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Join Error</h1>
          <p className="text-gray-600 mb-4">{joinError}</p>
          <Button onClick={() => setJoinError(null)}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header sticky pakai RetroHeader */}
      <RetroHeader
        retro={retro}
        participants={participants}
        user={currentUser}
        currentUserRole={isFacilitator}
        showShareModal={showShareModal}
        setShowShareModal={setShowShareModal}
        handleLogout={() => {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
          window.location.href = '/login';
        }}
      />

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
                        {/* <span className="text-sm font-medium text-indigo-600">
                          {participant.user.name.charAt(0).toUpperCase()}
                        </span>
                         */}
                         <Avatar
                      className={`h-12 w-12 border-3 ${participant.role ? 'border-blue-500' : 'border-gray-200'} group-hover:border-indigo-500 transition`}
                      title={`${participant.user.name} ${participant.role ? '(Facilitator)' : '(Participant)'}`}
                    >
                      <AvatarImage 
                        src={participant.user.imageUrl || participant.user.image_url || undefined} 
                        alt={participant.user.name} 
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <AvatarFallback>
                        {participant.user.name?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                      </div>
                      <div>
                        <p className="font-medium">{participant.user.name}</p>
                        <p className="text-sm text-gray-500">
                          {participant.role === true ? "Facilitator" : "Participant"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {participant.role === true && (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      )}
                      {!participant.role && isFacilitator && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedParticipant(participant);
                            setShowRoleModal(true);
                          }}
                          className="text-xs px-2 py-1"
                        >
                          Promote to Facilitator
                        </Button>
                      )}
                    </div>
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
          {/* Kolom kanan: Stack Retrospective Details (tanpa Prime Directive) */}
          <div className="flex flex-col gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Retrospective Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900">Title</h3>
                  <p className="text-gray-600">{retro?.title}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900">Status</h3>
                    <p className="text-gray-600">{retro?.status}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Format</h3>
                    <p className="text-gray-600">{retro?.format || "-"}</p>
                  </div>
                </div>
                {facilitator && (
                  <div>
                    <h3 className="font-medium text-gray-900">Facilitator</h3>
                    <p className="text-gray-600">{facilitator.user.name}</p>
                  </div>
                )}
                {/* Tombol Start Retro di bawah Format */}
                {isFacilitator && (
                  <div className="mt-4">
                    <Button onClick={() => setShowStartConfirm(true)} className="w-full">
                      <Play className="h-4 w-4 mr-2" />
                      Start Retro
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>



      {showShareModal && shareUrl && (
        <ShareLinkModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          shareUrl={shareUrl}
        />
      )}

      {/* Promote to Facilitator Confirmation */}
      {showRoleModal && selectedParticipant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Promote to Facilitator?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to promote <strong>{selectedParticipant.user.name}</strong> to facilitator? 
              You will no longer be the facilitator.
            </p>
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedParticipant(null);
                }}
                disabled={isPromoting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handlePromoteToFacilitator}
                disabled={isPromoting}
              >
                {isPromoting ? 'Promoting...' : 'Promote to Facilitator'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Start Confirmation */}
      <PhaseConfirmModal
        open={showStartConfirm}
        onOpenChange={setShowStartConfirm}
        title="Start Retrospective?"
        description="Once started, participants will be redirected to the retrospective board."
        onConfirm={handleStartRetro}
        onCancel={() => {}}
        confirmLabel="Start Retrospective"
        cancelLabel="Cancel"
      />
    </div>
  )
}
