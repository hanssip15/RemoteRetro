import React, { useCallback, useEffect, useState } from 'react';
import RetroFooter from './RetroFooter';
import { Button } from '@/components/ui/button';
import RetroHeader from '../RetroHeader';
import { apiService } from '@/services/api';

export default function LabellingPhase(props: any) {
  const {
    retro, participants, user, currentUserRole, showShareModal, setShowShareModal, handleLogout,
    isCurrentFacilitator, setPhase, broadcastPhaseChange,
    labellingItems, typingParticipants, setShowRoleModal, setSelectedParticipant,
    setLabellingItems, socket, isConnected
  } = props;

  const [showModal, setShowModal] = useState(true);

  useEffect(() => {
    setShowModal(true);
  }, []);

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
    try {
      console.log('🔄 Updating label in database:', { groupId, newLabel });
      await apiService.updateLabel(groupId, newLabel);
      console.log('✅ Label updated successfully');
      
      // Broadcast label update to other participants via WebSocket
      if (socket && isConnected && user) {
        socket.emit('label-update', {
          retroId: retro.id,
          groupId: groupId,
          label: newLabel,
          userId: user.id
        });
        console.log('📡 Label update broadcasted via WebSocket');
      }
    } catch (error) {
      console.error('❌ Failed to update label:', error);
    }
  }, [socket, isConnected, user, retro?.id]);

  // Debounced version of updateLabelInDatabase
  const debouncedUpdateLabel = useCallback(
    debounce(updateLabelInDatabase, 1000), // 1 second delay
    [updateLabelInDatabase]
  );

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
      <div className="flex-1 flex flex-col items-center justify-start w-full">
          <div className="flex flex-row gap-8 mt-8 w-full justify-center">
            {labellingItems.map((group: any, idx: number) => (
              <div key={group.id} className="bg-white border rounded-lg shadow-sm min-w-[350px] max-w-[400px] w-full p-4">
                <div className="mb-2">
                  <input
                    className="w-full text-center text-gray-500 font-semibold bg-gray-100 rounded px-2 py-1 mb-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Optional Group Label"
                    maxLength={20}
                    value={group.label}
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
                  {group.group_items.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-2 text-base">
                      <span>{item.item.content}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
      </div>
      <RetroFooter
        title={<div className="flex flex-col items-start justify-center"><div className="text-2xl font-semibold mb-1">Labelling</div><div className="text-gray-500">Arrive at sensible group labels</div></div>}
        center={<div></div>}
        right={isCurrentFacilitator && (
          <div className="flex flex-row items-center gap-2">
            <Button
              onClick={() => broadcastPhaseChange ? broadcastPhaseChange('voting') : setPhase && setPhase('voting')}
              className="px-8 py-2 rounded text-base font-semibold"
              variant="secondary"
            >
              Next: Voting
            </Button>
          </div>
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