"use client"
// import { io } from 'socket.io-client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

import { useEffect, useState, useCallback, Dispatch, SetStateAction } from "react"
import {useNavigate} from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShareLinkModal } from "@/components/share-link-modal"
import { Users, Play, Crown } from "lucide-react"
import RetroHeader from '../RetroHeader';
import { Link } from "react-router-dom"
import { apiService, Retro, Participant, api, User } from "@/services/api"
import { PhaseConfirmModal } from '@/components/ui/dialog';


interface RetroLobbyPageProps {
  socket: any;
  isConnected: boolean;
  userId: string;
  retroId: string;
  participants: Participant[];
  setParticipants: Dispatch<SetStateAction<Participant[]>>;
  retro: Retro | null;
}

export default function RetroLobbyPage({ socket, retroId, participants, setParticipants, retro }: RetroLobbyPageProps) {
  const navigate = useNavigate()
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  
  const [loading, setLoading] = useState(true)
  const [error] = useState<string | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showStartConfirm, setShowStartConfirm] = useState(false)
  const [isJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [isOngoing, setIsOngoing] = useState(false)
  const [isPromoting, setIsPromoting] = useState(false)
  const [user, setUser] = useState<User>()
  const [isUserJoined, setIsUserJoined] = useState(false)
  // Get current user from sessionStorage

  // Timeout fallback untuk mencegah loading yang terlalu lama
  useEffect(() => {
    if (user && !isUserJoined) {
      const timeout = setTimeout(() => {
        window.location.reload();
        setIsUserJoined(true);
        setLoading(false);
      }, 3000); // 3 detik timeout

      return () => clearTimeout(timeout);
    }
  }, [user, isUserJoined]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
          const userData = await api.getCurrentUser();
          if (!userData) {
            api.removeAuthToken(); // optional logout
            navigate('/login');
          return;
          }
  
          setUser(userData);
      } catch (err) {
        console.error(err);
        // setError('Failed to fetch user. Please try again.');
        await api.removeAuthToken();
        navigate('/login');
      }
    };
  
    fetchUser();
  }, []);

  // Selesaikan loading jika user dan participants sudah ada
  useEffect(() => {
    if (user && participants && participants.length > 0) {
      // Cek apakah current user sudah ada di dalam participants
      const currentUserParticipant = participants.find((p) => p.user.id === user.id);
      if (currentUserParticipant) {
        setIsUserJoined(true);
        setLoading(false);
      } else {
        // Tetap loading sampai user berhasil join
        setIsUserJoined(false);
        setLoading(true);
      }
    }
  }, [user, participants]);

  // Cek join status setiap kali participants berubah
  useEffect(() => {
    if (user && participants && participants.length > 0) {
      const currentUserParticipant = participants.find((p) => p.user.id === user.id);

      
      if (currentUserParticipant && !isUserJoined) {
        setIsUserJoined(true);
        setLoading(false);
      }
    }
  }, [user, participants, isUserJoined]);

  useEffect(() => {
    // Step 1: Check if user is authenticated
    const authStatus = api.isAuthenticated()
    if (!authStatus) {
      navigate('/login')
      return
    }

    if (!retroId) return;    
  }, [retroId]);

  // Auto-join participant function
  // const checkAndJoinParticipant = useCallback(async () => {
  //   if (!user || !retroId) return;
  //   const participant = participants.find((p) => p.user.id === user.id);
  //   if (!participant) {
  //     try {
  //       setIsJoining(true);
  //       await apiService.addParticipant(retroId, {
  //         userId: user.id,
  //         role: false,
  //       });
  //       await fetchLobbyData();
  //     } catch (error) {
  //       console.error("Failed to join as participant:", error);
  //     } finally {
  //       setIsJoining(false);
  //     }
  //   }
  // }, [user, retroId, participants, fetchLobbyData]);

  
  // useEffect(() => {
  //   if (!loading && retro && participants.length > 0) {
  //     checkAndJoinParticipant();
  //   }
  // }, [loading, retro, participants, checkAndJoinParticipant]);

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
      await apiService.updatePhase(retroId, 'prime-directive')
      handleChangeView()
    } catch (error) {
      console.error("Error starting retro:", error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to start retro'
      alert(`Failed to start retro: ${errorMessage}`)
    }
  }, [retroId, navigate, socket, isOngoing, user?.id])
  // Ensure user is never null after authentication
  // if (!user) {
  //   // This should never happen after authentication check
  //   throw new Error("User not found. This should not happen after authentication.");
  // }


  // useSocket({
  //   retroId,
  //   userId,
  //   onParticipantUpdate: fetchLobbyData,
  //   onRetroStarted: handleChangeView,
  // });

  

  const handlePromoteToFacilitator = useCallback(async () => {
    if (!selectedParticipant) return;
    try {
      setIsPromoting(true);
      await apiService.updateParticipantRole(retroId, selectedParticipant.id);
      await apiService.getRetro(retroId); // Refresh participants after role change
      setParticipants(prev => prev.map(p => p.id === selectedParticipant.id ? { ...p, role: true } : p));
      setShowRoleModal(false);
      setSelectedParticipant(null);
    } catch (error) {
      console.error("Error promoting participant:", error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to promote participant';
      alert(`Failed to promote participant: ${errorMessage}`);
    } finally {
      setIsPromoting(false);
    }
  }, [retroId, selectedParticipant, setParticipants]);
  
  const shareUrl = typeof window !== "undefined" ? window.location.href : ""
  const facilitator = participants.find((p) => p.role === true)
  const isFacilitator = user?.id === facilitator?.user.id




  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lobby...</p>
          {!isUserJoined && user && (
            <p className="text-sm text-indigo-600 mt-2">Joining as participant...</p>
          )}
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
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header sticky pakai RetroHeader */}
      <RetroHeader
        retro={retro}
        participants={participants}
        user={user}
        currentUserRole={isFacilitator}
        showShareModal={showShareModal}
        setShowShareModal={setShowShareModal}
        handleLogout={async () => {
          try {
            await api.removeAuthToken(); // Panggil backend untuk logout
          } catch (error) {
            console.error('Failed to logout:', error);
          }
          window.location.href = '/login';
        }}
      />

   \ {/* Lobby Content */}
      <div className="flex-1 container mx-auto px-2 py-4 sm:px-4 sm:py-8 flex flex-col">
        <div className="grid flex-1 min-h-0 lg:grid-cols-2 gap-4 sm:gap-8">
          {/* Kolom kiri: Participants */}
          <Card className="mb-4 lg:mb-0 h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Participants ({participants.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center">
              <div className="space-y-2 sm:space-y-3 w-full">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="w-8 h-8 sm:w-12 sm:h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                        <Avatar
                          className={`h-8 w-8 sm:h-12 sm:w-12 border-3 ${participant.role ? 'border-blue-500' : 'border-gray-200'} group-hover:border-indigo-500 transition`}
                          title={`${participant.user.name} ${participant.role ? '(Facilitator)' : '(Participant)'}`}
                        >
                          <AvatarImage 
                            src={participant.user.imageUrl || participant.user.image_url || undefined} 
                            alt={participant.user.name} 
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <AvatarFallback>
                            {participant.user.name?.charAt(0)?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div>
                        <p className="font-medium text-sm sm:text-base">{participant.user.name}</p>
                        <p className="text-xs sm:text-sm text-gray-500">
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
                    <p className="text-gray-500 text-center text-sm">No participants yet</p>
                  </div>
                )}
                
              </div>
            </CardContent>
          </Card>
          {/* Kolom kanan: Retrospective Details */}
          <Card className="mb-4 lg:mb-0 h-full flex flex-col">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Retrospective Details</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="flex-1 space-y-3 sm:space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 text-sm sm:text-base">Title</h3>
                  <p className="text-gray-600 text-sm sm:text-base">{retro?.title}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm sm:text-base">Status</h3>
                    <p className="text-gray-600 text-sm sm:text-base">{retro?.status}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm sm:text-base">Format</h3>
                    <p className="text-gray-600 text-sm sm:text-base">{retro?.format || "-"}</p>
                  </div>
                </div>
                {facilitator && (
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm sm:text-base">Facilitator</h3>
                    <p className="text-gray-600 text-sm sm:text-base">{facilitator.user.name}</p>
                  </div>
                )}
              </div>
              {/* Tombol Start Retro di bagian bawah */}
              {isFacilitator && (
                <div className="pt-4">
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
