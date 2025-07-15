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
  title, center, right, participants = [], typingParticipants = [], children, isCurrentFacilitator, user, setShowRoleModal, setSelectedParticipant, 
  votesLeft,
  allUserVotes = {},
  maxVotes = 3
}: any) {
  const params = useParams();
  const retroId = params.id as string;

  const [showRoleModal, setShowRoleModalLocal] = useState(false);
  const [selectedParticipant, setSelectedParticipantLocal] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFacilitatorGrantedModal, setShowFacilitatorGrantedModal] = useState(false);
  const prevIsFacilitator = useRef(isCurrentFacilitator);

  useEffect(() => {
    // Munculkan modal hanya jika transisi dari bukan facilitator ke facilitator
    if (!prevIsFacilitator.current && isCurrentFacilitator) {
      setShowFacilitatorGrantedModal(true);
    }
    prevIsFacilitator.current = isCurrentFacilitator;
  }, [isCurrentFacilitator]);

  // Handler promote facilitator
  const handlePromoteToFacilitator = useCallback(async () => {
    if (!user || !selectedParticipant) return;
    setLoading(true);
    try {
      await apiService.updateParticipantRole(retroId, selectedParticipant.id);
      setShowRoleModalLocal(false);
      setSelectedParticipantLocal(null);
      // Optionally: refresh data
    } catch (error) {
      alert("Failed to promote facilitator");
    } finally {
      setLoading(false);
    }
  }, [retroId, user, selectedParticipant]);

  return (
    <>
      {/* Modal */}
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
              style={{ backgroundColor: '#22c55e' }} // green-600
              className="text-white hover:bg-green-700"
            >
              {loading ? "Promoting..." : "Promote"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal for facilitator granted */}
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
              style={{ backgroundColor: '#2563eb' }} // blue-600
              className="text-white hover:bg-blue-700"
              onClick={() => setShowFacilitatorGrantedModal(false)}
            >
              Got it!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ...footer content, avatar bar, dsb... */}
      <div className="fixed bottom-0 left-0 w-full z-40">
        {/* Avatar bar: tanpa background putih */}
        {participants.length > 0 && (
          <div className="w-full flex justify-center pb-1 mb-4">
            <div className="flex flex-row items-end gap-6">
              {participants.map((p: any) => (
                <div key={p.id} className="flex flex-col items-center relative group">
                  <div className="relative">
                    <Avatar
                      className={`h-14 w-14 border-2 ${p.role ? 'border-blue-500' : 'border-gray-200'} group-hover:border-indigo-500 transition`}
                      title={`${p.user.name} ${p.role ? '(Facilitator)' : '(Participant)'}`}
                    >
                      <AvatarImage 
                        src={p.user.imageUrl || p.user.image_url || undefined} 
                        alt={p.user.name} 
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <AvatarFallback>
                        {p.user.name?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    {/* Icon edit hanya untuk facilitator dan bukan diri sendiri */}
                    {isCurrentFacilitator && p.user.id !== user?.id && (
                      <button
                        className="absolute -top-2 -right-2 bg-white rounded-full shadow p-1 border border-gray-200 hover:bg-gray-100 transition"
                        title="Promote to Facilitator"
                        onClick={() => {
                          setShowRoleModalLocal(true);
                          setSelectedParticipantLocal(p);
                        }}
                      >
                        {/* Hanya icon pensil tanpa bulatan */}
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                          <path d="M15.232 5.232a2.5 2.5 0 1 1 3.536 3.536L8.5 19H5v-3.5l12.232-12.268z" stroke="#222" strokeWidth="1.5"/>
                        </svg>
                      </button>
                    )}
                  </div>
                  <span className="text-xs text-gray-900 mt-1 font-medium">{p.user.name}{p.role ? ' (Facilitator)' : ''}</span>
                  {/* ALL VOTES IN indicator for any participant */}
                  {(() => {
                    const userVoteObj = allUserVotes?.[p.user.id] || {};
                    const totalVotes = Object.values(userVoteObj).reduce((a: number, b) => a + Number(b), 0);
                    return totalVotes >= maxVotes ? (
                      <span className="text-xs font-bold text-green-600 mt-1">ALL VOTES IN</span>
                    ) : null;
                  })()}
                  {/* Typing indicator */}
                  {typingParticipants.includes(p.user.id) && (
                    <div className="flex space-x-1 mt-1">
                      <span className="dot dot1"></span>
                      <span className="dot dot2"></span>
                      <span className="dot dot3"></span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Card putih/footer utama */}
        <div className="w-full bg-white border-t rounded-t-xl shadow-lg">
          {(title || center || right) && (
            <div className="container mx-auto px-4 py-4 flex flex-row items-center justify-between">
              <div>{title}</div>
              <div>{center}</div>
              <div>{right}</div>
            </div>
          )}
          {children}
        </div>
      </div>
    </>
  );
} 
