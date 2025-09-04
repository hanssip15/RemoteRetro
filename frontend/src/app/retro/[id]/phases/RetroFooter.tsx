import {useCallback, useState, useEffect, useRef} from 'react';
import { apiService, Participant} from "@/services/api"

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useParams } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export default function RetroFooter({
  left,
  center, right, participants = [], typingParticipants = [], children, isCurrentFacilitator, user,
  allUserVotes = {},
  maxVotes = 3
}: any) {
  const params = useParams();
  const retroId = params.id as string;

  const [showRoleModal, setShowRoleModalLocal] = useState(false);
  const [selectedParticipant, setSelectedParticipantLocal] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFacilitatorGrantedModal, setShowFacilitatorGrantedModal] = useState(false);
  const prevFacilitatorId = useRef<string | null>(null);

  useEffect(() => {
    const facilitator = participants.find((p: any) => p.role)?.user.id;
    if (
      facilitator &&
      facilitator !== prevFacilitatorId.current &&
      facilitator === user?.id &&
      prevFacilitatorId.current !== null
    ) {
      setShowFacilitatorGrantedModal(true);
    }
    prevFacilitatorId.current = facilitator || null;
  }, [participants, user?.id]);

  const handlePromoteToFacilitator = useCallback(async () => {
    if (!user || !selectedParticipant) return;
    setLoading(true);
    try {
      await apiService.updateParticipantRole(retroId, selectedParticipant.id);
      setShowRoleModalLocal(false);
      setSelectedParticipantLocal(null);
    } catch (error) {
      alert("Failed to promote facilitator");
    } finally {
      setLoading(false);
    }
  }, [retroId, user, selectedParticipant]);

  return (
    <>
      {/* Modal Promote Facilitator */}
      <Dialog open={showRoleModal && !!selectedParticipant} onOpenChange={setShowRoleModalLocal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Promote to Facilitator?</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Are you sure you want to promote <strong>{selectedParticipant?.user.name}</strong> to facilitator? <br/>
            You will no longer be the facilitator.
          </DialogDescription>
          <DialogFooter className="flex-row justify-end space-x-3 mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowRoleModalLocal(false);
                setSelectedParticipantLocal(null);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handlePromoteToFacilitator}
              disabled={loading}
              style={{ backgroundColor: '#22c55e' }}
              className="text-white hover:bg-green-700"
            >
              {loading ? "Promoting..." : "Promote"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Facilitator Granted */}
      <Dialog open={showFacilitatorGrantedModal} onOpenChange={setShowFacilitatorGrantedModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>You've been granted the facilitatorship!</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            As <b>facilitator</b>, you are responsible for advancing the retrospective and keeping the vibe inclusive!
          </DialogDescription>
          <DialogFooter className="flex-row justify-end mt-4">
            <Button
              style={{ backgroundColor: '#2563eb' }}
              className="text-white hover:bg-blue-700"
              onClick={() => setShowFacilitatorGrantedModal(false)}
            >
              Got it!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer content */}
      <div className="fixed bottom-0 left-0 w-full z-40">
        {/* Avatar bar */}
        {participants.length > 0 && (
          <div className="w-full flex justify-center pb-1 mb-1">
           <div className="flex flex-row items-end gap-6 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 px-2 md:px-0">
              {participants.map((p: any) => (
                <div key={p.id} className="flex flex-col items-center relative group flex-shrink-0">
                  <div className="relative">
                    <Avatar
                      className={`h-14 w-14 border-2 ${p.role ? 'border-blue-500' : 'border-gray-200'} group-hover:border-indigo-500 transition`}
                      title={`${p.user.name} ${p.role ? '(Facilitator)' : '(Participant)'}`}
                    >
                      <AvatarImage 
                        src={p.user.image_url} 
                        alt={p.user.name} 
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <AvatarFallback>
                        {p.user.name?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    {isCurrentFacilitator && p.user.id !== user?.id && (
                      <button
                        className="absolute -top-2 -right-2 bg-white rounded-full shadow p-1 border border-gray-200 hover:bg-gray-100 transition"
                        title="Promote to Facilitator"
                        onClick={() => {
                          setShowRoleModalLocal(true);
                          setSelectedParticipantLocal(p);
                        }}
                      >
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                          <path d="M15.232 5.232a2.5 2.5 0 1 1 3.536 3.536L8.5 19H5v-3.5l12.232-12.268z" stroke="#222" strokeWidth="1.5"/>
                        </svg>
                      </button>
                    )}
                  </div>
                  <span className="text-xs text-gray-900 mt-1 font-medium">{p.user.name}{p.role ? ' (Facilitator)' : ''}</span>
                  
                  {/* === PERUBAHAN DIMULAI DI SINI === */}
                  {/* Indikator Status Gabungan (Mengetik atau Semua Vote Masuk) */}
                  <div className="flex justify-center items-center mt-1" style={{ minHeight: 16 }}>
                    {(() => {
                      const isTyping = typingParticipants.includes(p.user.id);

                      const userVoteObj = allUserVotes?.[p.user.id] || {};
                      const totalVotes = (Object.values(userVoteObj) as number[]).reduce((a: number, b: number) => a + Number(b), 0);
                      const hasUsedAllVotes = totalVotes >= maxVotes;

                      if (isTyping) {
                        return (
                          <div className="flex space-x-1">
                            <span className="dot" style={{ animationDelay: '0s' }}></span>
                            <span className="dot" style={{ animationDelay: '0.2s' }}></span>
                            <span className="dot" style={{ animationDelay: '0.4s' }}></span>
                          </div>
                        );
                      }
                      
                      if (hasUsedAllVotes) {
                        return (
                          <span className="text-xs font-bold text-green-600">ALL VOTES IN</span>
                        );
                      }

                      // Placeholder untuk menjaga layout tetap stabil
                      return <span className="text-xs" style={{ opacity: 0 }}>&nbsp;</span>;
                    })()}
                  </div>
                  {/* === PERUBAHAN SELESAI DI SINI === */}

                </div>
              ))}
            </div>
          </div>
        )}
        {/* Main white footer card */}
        <div className="w-full bg-white border-t rounded-t-xl shadow-lg">
          {(left || center || right) && (
            <div className="container mx-auto px-4 py-4 flex flex-row items-center justify-between gap-4 md:gap-4 md:flex-row">
              <div className="min-w-[180px] flex items-center">{left}</div>
              <div className="flex-1 flex flex-col items-center">{center}</div>
              <div className="flex items-center">{right}</div>
            </div>
          )}
          {children}
        </div>
      </div>
    </>
  );
}