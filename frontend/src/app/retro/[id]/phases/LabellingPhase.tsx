import { useCallback, useEffect, useState } from 'react';
import RetroFooter from './RetroFooter';
import { Button } from '@/components/ui/button';
import RetroHeader from '../RetroHeader';
import { apiService } from '@/services/api';
import { PhaseConfirmModal } from '@/components/ui/dialog';
import { getCategoryEmoji } from '@/lib/utils';
import useEnterToCloseModal from "@/hooks/useEnterToCloseModal";

export default function LabellingPhase(props: any) {
  const {
    retro, participants, user, currentUserRole, showShareModal, setShowShareModal, handleLogout,
    isCurrentFacilitator, setPhase, broadcastPhaseChange,
    labellingItems, typingParticipants, setShowRoleModal, setSelectedParticipant,
    setLabellingItems, socket, isConnected
  } = props;

  const [showModal, setShowModal] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    setShowModal(true);
  }, []);

  // Normalisasi label dari backend: jika 'unlabeled', ubah ke '' agar placeholder bekerja
  useEffect(() => {
    if (labellingItems && Array.isArray(labellingItems)) {
      const normalized = labellingItems.map((group: any) => ({
        ...group,
        label: group.label === 'unlabeled' ? '' : group.label || ''
      }));
      setLabellingItems(normalized);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // hanya saat mount

  // Debounce function untuk update label
  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };

  // Function untuk update label ke database
  const updateLabelInDatabase = useCallback(async (groupId: number, newLabel: string) => {
    const labelToSave = newLabel.trim() === "" ? "unlabeled" : newLabel;
    try {
      await apiService.updateLabel(groupId, labelToSave);
      
      // Broadcast label update to other participants via WebSocket
      if (socket && isConnected && user) {
        socket.emit('label-update', {
          retroId: retro.id,
          groupId: groupId,
          label: labelToSave,
          userId: user.id
        });
      }
    } catch (error) {
      console.error('❌ Failed to update label:', error);
    }
  }, [socket, isConnected, user, retro?.id]);

  // Debounced version of updateLabelInDatabase
  const debouncedUpdateLabel = useCallback(
    debounce(updateLabelInDatabase, 10), // 1 second delay
    [updateLabelInDatabase]
  );

  // Panggil custom hook untuk modal
  useEnterToCloseModal(showModal, () => setShowModal(false));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Modal Stage Change Labeling */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-xl w-full p-8">
            <h2 className="text-2xl font-bold mb-2 text-center">Stage Change: Labeling!</h2>
            <div className="mb-4">
              <b>Guidance:</b>
              <ul className="list-disc pl-6 mt-2 text-left">
                <li>Work as a team to arrive at sensible labels for each group of ideas.</li>
                <li>Don't spend too much time labeling any one group. An approximate label is good enough.</li>
              </ul>
            </div>
            <div className="flex justify-center">
              <button
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                onClick={() => setShowModal(false)}
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
      <RetroHeader
        retro={retro}
        participants={participants}
        user={user}
        currentUserRole={currentUserRole}
        showShareModal={showShareModal}
        setShowShareModal={setShowShareModal}
        handleLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col items-center justify-start w-full overflow-auto pb-40">
          <div className="flex flex-row flex-wrap gap-8 mt-8 w-full justify-center">
            {labellingItems.map((group: any, idx: number) => (
              <div key={group.id} className="bg-white border rounded-lg shadow-sm min-w-[350px] max-w-[400px] w-full p-4">
                <div className="mb-2">
                  <input
                    className="w-full max-w-[200px] text-center text-gray-500 font-semibold bg-gray-100 rounded px-2 py-1 mb-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="unlabeled"
                    maxLength={20}
                    value={group.label === 'unlabeled' ? '' : group.label || ''}
                    readOnly={!isCurrentFacilitator}
                    onChange={(e) => {
                      if (isCurrentFacilitator) {
                        const newLabel = e.target.value;
                        
                        // Update local state immediately for real-time feedback
                        const updatedGroups = [...labellingItems];
                        updatedGroups[idx].label = newLabel;
                        setLabellingItems(updatedGroups);
                        
                        // Update database with debouncing
                        if (group.id) {
                          debouncedUpdateLabel(group.id, newLabel);
                        }
                      }
                    }}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  {group.group_items.map((item: any) => {
                    return (
                      <div key={item.id} className="flex items-center gap-2 text-base">
                        <span>{getCategoryEmoji(item.item.format_type, retro.format)}</span>
                        <span>{item.item.content}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
      </div>
      <div className="h-40" />
      <RetroFooter
        left={<div className="flex flex-col items-start text-left"><div className="text-2xl font-semibold mb-1">Labelling</div><div className="text-gray-500">Arrive at sensible group labels</div></div>}
        title={null}
        center={<div></div>}
        right={isCurrentFacilitator && (
          <>
            <Button
              onClick={() => setShowConfirm(true)}
              className="flex items-center px-1 py-1 text-sm md:px-8 md:py-2 md:text-base font-semibold"
              variant="phasePrimary"
            >
              Next: Voting <span className="ml-2">&#8594;</span>
            </Button>
            <PhaseConfirmModal
              open={showConfirm}
              onOpenChange={setShowConfirm}
              title="Is your team satisfied with the applied labels?"
              onConfirm={() => {
                if (broadcastPhaseChange) broadcastPhaseChange('voting');
                else if (setPhase) setPhase('voting');
              }}
              onCancel={() => {}}
              confirmLabel="Yes"
              cancelLabel="No"
            />
          </>
        )}
        participants={participants}
        typingParticipants={typingParticipants}
        isCurrentFacilitator={isCurrentFacilitator}
        user={user}
        setShowRoleModal={setShowRoleModal}
        setSelectedParticipant={setSelectedParticipant}
      />
    </div>
  );
} 