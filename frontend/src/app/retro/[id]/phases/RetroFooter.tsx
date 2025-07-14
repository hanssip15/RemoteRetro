import {useCallback, useState} from 'react';
import { apiService, Participant} from "@/services/api"

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useParams } from 'react-router-dom';

export default function RetroFooter({
  title, center, right, participants = [], typingParticipants = [], children, isCurrentFacilitator, user, setShowRoleModal, setSelectedParticipant, 
}: any) {
  const params = useParams();
  const retroId = params.id as string;

  const [showRoleModal, setShowRoleModalLocal] = useState(false);
  const [selectedParticipant, setSelectedParticipantLocal] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(false);

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
              >
                {loading ? "Promoting..." : "Promote"}
              </Button>
            </div>
          </div>
        </div>
      )}

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
