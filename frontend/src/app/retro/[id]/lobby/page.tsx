"use client"
// import { io } from 'socket.io-client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

import { useEffect, useState, useCallback } from "react"
import { useParams, useNavigate} from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShareLinkModal } from "@/components/share-link-modal"
import { Users, Play, Crown } from "lucide-react"
import RetroHeader from '../RetroHeader';
import { Link } from "react-router-dom"
import { apiService, Retro, Participant, api, User } from "@/services/api"
import { PhaseConfirmModal } from '@/components/ui/dialog';
import { useRetroSocket } from '@/hooks/use-retro-socket';


export default function RetroLobbyPage() {
  const params = useParams()
  const navigate = useNavigate()
  const retroId = params.id as string
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  
  const [retro, setRetro] = useState<Retro>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showStartConfirm, setShowStartConfirm] = useState(false)
  const [isJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [socket] = useState<any>(null)
  const [isOngoing, setIsOngoing] = useState(false)
  const [isPromoting, setIsPromoting] = useState(false)
  const [user, setUser] = useState<User>()
  const [userId, setUserId] = useState<string>();
  // Get current user from sessionStorage

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
          setUserId(userData.id);
      } catch (err) {
        console.error(err);
        // setError('Failed to fetch user. Please try again.');
        await api.removeAuthToken();
        navigate('/login');
      }
    };
  
    fetchUser();
  }, []);

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

  

  const {  } = useRetroSocket({
    retroId,
    userId: userId!,
    onParticipantUpdate: fetchLobbyData,
    onRetroStarted: handleChangeView,
  });
  


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
  
  const shareUrl = typeof window !== "undefined" ? window.location.href : ""
  const facilitator = participants.find((p) => p.role === true)
  const isFacilitator = user?.id === facilitator?.user.id

// const leaveRetro = async () => {
//     if (!userId) {
//       console.error('User ID is undefined. Cannot leave retro.');
//       return;
//     }
//     try {
//       await apiService.leaveParticipant(retroId, userId);
//     } catch (error) {
//       console.error('Failed to leave retro:', error);
//     }
//   };

//   // Handle browser/tab close
//   useBeforeUnload(() => {
//     sessionStorage.setItem('leavingRetro', 'true'); // Sementara
//     leaveRetro();
//     return; // Return undefined to prevent default dialog
//   });

//   // Handle route change within the app
//   useEffect(() => {
//     const currentPath = window.location.pathname;
    
//     const handleClick = (event: MouseEvent) => {
//       const target = event.target as HTMLAnchorElement;
//       if (target.tagName === 'A' && target.href) {
//         const url = new URL(target.href);
//         if (url.pathname !== currentPath) {
//           leaveRetro();
//         }
//       }
//     };

//     document.addEventListener('click', handleClick);

//     return () => {
//       document.removeEventListener('click', handleClick);
//     };
//   }, [retroId, userId]);

//   useEffect(() => {
//   if (sessionStorage.getItem('leavingRetro') === 'true') {
//     sessionStorage.removeItem('leavingRetro');
//     console.log("User kembali setelah refresh, jangan keluarkan lagi.");
//     // Jangan kirim leaveRetro lagi
//   }
// }, []);



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
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header sticky pakai RetroHeader */}
      <RetroHeader
        retro={retro}
        participants={participants}
        user={user}
        currentUserRole={isFacilitator}
        showShareModal={showShareModal}
        setShowShareModal={setShowShareModal}
        handleLogout={() => {
          sessionStorage.removeItem('auth_token');
          sessionStorage.removeItem('user_data');
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
