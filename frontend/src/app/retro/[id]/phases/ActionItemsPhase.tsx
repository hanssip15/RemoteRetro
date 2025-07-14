import React, { useEffect, useState } from 'react';
import RetroFooter from './RetroFooter';
import { Button } from '@/components/ui/button';
import RetroHeader from '../RetroHeader';
import { Pencil, Trash2 } from 'lucide-react';


export default function ActionItemsPhase({
  retro,
  participants,
  user,
  currentUserRole,
  showShareModal,
  setShowShareModal,
  handleLogout,
  groupLabels,
  userVotes,
  actionItems,
  actionInput,
  actionAssignee,
  setActionInput,
  setActionAssignee,
  handleAddActionItem,
  isCurrentFacilitator,
  setPhase,
  typingParticipants,
  setShowRoleModal,
  setSelectedParticipant,
  editingActionIdx,
  editActionInput,
  editActionAssignee,
  setEditingActionIdx,
  setEditActionInput,
  setEditActionAssignee,
  handleEditActionItem,
  handleSaveEditActionItem,
  handleDeleteActionItem,
  broadcastPhaseChange,
  labellingItems,
  socket,
  isConnected,
}: any) {
  // Debug logging
  console.log('🔍 ActionItemsPhase - actionItems:', actionItems);
  console.log('🔍 ActionItemsPhase - socket:', socket);
  console.log('🔍 ActionItemsPhase - isConnected:', isConnected);
  console.log('🔍 ActionItemsPhase - actionInput:', actionInput);
  console.log('🔍 ActionItemsPhase - actionAssignee:', actionAssignee);
  
  // Handler untuk tombol Add yang mengirim ke WebSocket
  const handleAddActionItemWebSocket = () => {
    console.log('🚀 handleAddActionItemWebSocket called');
    console.log('🚀 actionInput:', actionInput);
    console.log('🚀 actionAssignee:', actionAssignee);
    console.log('🚀 user:', user);
    console.log('🚀 socket:', socket);
    console.log('🚀 isConnected:', isConnected);
    
    if (!actionInput.trim() || !actionAssignee || !user?.id) {
      console.log('❌ Validation failed:', { actionInput, actionAssignee, userId: user?.id });
      return;
    }

    // Cari nama assignee
    const assignee = participants.find((p: any) => p.user.id === actionAssignee);
    const assigneeName = assignee?.user.name || 'Unknown';

    console.log('🚀 Sending to WebSocket:', {
      retroId: retro?.id,
      task: actionInput,
      assigneeId: actionAssignee,
      assigneeName,
      createdBy: user.id
    });

    // Kirim ke WebSocket
    if (socket && isConnected) {
      socket.emit('action-item-added', {
        retroId: retro?.id,
        task: actionInput,
        assigneeId: actionAssignee,
        assigneeName,
        createdBy: user.id
      });
      console.log('✅ Action item sent to WebSocket');
    } else {
      console.log('❌ Socket not available or not connected');
    }

    // Kosongkan input
    setActionInput('');
    setActionAssignee('');
  };
  
  React.useEffect(() => {
    if (participants && participants.length > 0 && !actionAssignee) {
      setActionAssignee(participants[0].user.id);
    }
  }, [participants, actionAssignee, setActionAssignee]);
  
  const [showModal, setShowModal] = useState(true);

  useEffect(() => {
    setShowModal(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Modal Stage Change Action-Item Generation */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-xl w-full p-8">
            <h2 className="text-2xl font-bold mb-2 text-center">Stage Change: Action-Item Generation!</h2>
            <div className="mb-4">
              <b>Guidance:</b>
              <ul className="list-disc pl-6 mt-2 text-left">
                <li>Discuss the highest-voted items on the board.</li>
                <li>Generate action-items aimed at:
                  <ul className="list-disc pl-6">
                    <li>exploding the team's bottlenecks</li>
                    <li>bolstering the team's successes</li>
                  </ul>
                </li>
                <li>If you're physically present in the room with the facilitator, put your laptop away so you can focus.</li>
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
      <div className="w-full flex flex-row">
        {/* Card group kiri */}
        <div className="flex flex-row gap-6 p-8 items-start flex-1">
        {labellingItems && labellingItems.length > 0 ? (
          labellingItems.sort((a: any, b: any) => b.votes - a.votes).map((group: any, idx: number) => {
            return (
              <div key={group.id} className="bg-white border rounded-lg shadow-sm w-auto min-w-[220px] max-w-[350px] px-4 py-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-400">{groupLabels[idx]?.trim() || 'Unlabeled'}</span>
                  <div className="flex items-center gap-2">
                    <div className="bg-gray-100 text-gray-700 font-bold px-3 py-1 rounded select-none text-center" style={{fontSize: '1rem', minWidth: '60px'}}>
                      Votes {group.votes || 0}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {group.group_items.map((item: any, idx: number) => (
                    <div key={idx} className="bg-gray-50 border rounded px-3 py-2 text-sm flex items-center justify-between gap-2">
                      <span>{item.item ? item.item.content : 'No item'}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-gray-500 text-center w-full py-8">
            <p>No labelling items available</p>
            <p className="text-sm">Debug: labellingItems = {JSON.stringify(labellingItems)}</p>
          </div>
        )}
        </div>
        {/* Panel Action Items sticky kanan */}
        <div className="w-[400px] border-l bg-white flex flex-col p-6 sticky top-0 self-start overflow-y-auto" style={{ height: 'calc(100vh - 80px)', right: 0 }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🚀</span>
            <span className="text-xl font-semibold">Action Items</span>
          </div>
          <hr className="mb-4" />
          {/* List action items */}
          <div className="flex flex-col gap-2">
            {actionItems.length === 0 && <span className="text-gray-400 text-sm">No action items yet.</span>}
            {console.log('🚀 actionItems:', actionItems)}
            {console.log('🚀 current facilitator:', isCurrentFacilitator)}
            {actionItems.map((item: any, idx: number) => (
              <div key={item.id || idx} className="bg-gray-50 border rounded px-3 py-2 text-sm flex items-center justify-between gap-2">
                {editingActionIdx === idx ? (
                  <>
                    <div className="flex-1 flex flex-col gap-1">
                      <div className="flex gap-2">
                        <select
                          className="w-32 px-2 py-1 rounded-md border text-sm"
                          value={editActionAssignee}
                          onChange={e => setEditActionAssignee(e.target.value)}
                        >
                          {participants.map((p: any) => (
                            <option key={p.user.id} value={p.user.id}>{p.user.name}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          className="border rounded px-2 py-1 flex-1 text-sm"
                          value={editActionInput}
                          onChange={e => setEditActionInput(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2 mt-1">
                        
                        <button
                          className="px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500"
                          onClick={() => handleSaveEditActionItem(idx)}
                          type="button"
                        >
                          Save
                        </button>
                        <button
                          className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs border hover:bg-gray-200"
                          onClick={() => setEditingActionIdx(null)}
                          type="button"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex-1 flex flex-col">
                      <span>
                        {item.task} <span className="text-gray-700">({item.assigneeName})</span>
                        {item.edited && <span className="ml-2 text-xs text-gray-500 font-semibold">(edited)</span>}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {(isCurrentFacilitator || item.createdBy == user.id) && (
                        <>
                      <button
                        className="p-1 hover:bg-gray-200 rounded"
                        title="Edit"
                        onClick={() => handleEditActionItem(idx)}
                        type="button"
                      >
                        <Pencil className="h-4 w-4 text-gray-600" />
                      </button>
                      <button
                        className="p-1 hover:bg-red-100 rounded"
                        title="Delete"
                        onClick={() => handleDeleteActionItem(idx)}
                        type="button"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                      </>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <RetroFooter
        title={null}
        center={null}
        right={isCurrentFacilitator && actionItems.length > 0 && (
          <Button
            onClick={() => broadcastPhaseChange ? broadcastPhaseChange('final') : setPhase && setPhase('final')}
            className="px-8 py-2 rounded text-base font-semibold"
            variant="secondary"
          >
            Next: Final
          </Button>
        )}
        participants={participants}
        typingParticipants={typingParticipants}
        isCurrentFacilitator={isCurrentFacilitator}
        user={user}
        setShowRoleModal={setShowRoleModal}
        setSelectedParticipant={setSelectedParticipant}
      >
        <div className="w-full bg-white border-t">
          <div className="container mx-auto px-4 py-4 flex flex-row items-center gap-2">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <label className="font-medium mr-2 mb-1">Assignee:</label>
              <select
                className="w-64 px-3 pr-8 py-2 rounded-md border text-base"
                value={actionAssignee}
                onChange={e => setActionAssignee(e.target.value)}
              >
                {participants.length > 0 ? (
                  participants.map((p: any) => (
                    <option key={p.user.id} value={p.user.id}>{p.user.name}</option>
                  ))
                ) : (
                  <option>No participants</option>
                )}
              </select>
            </div>
            <input
              type="text"
              placeholder="Ex. automate the linting process"
              className="border rounded px-2 py-1 flex-1"
              value={actionInput}
              onChange={e => setActionInput(e.target.value)}
            />
            <Button
              className="px-4 py-1 bg-gray-400 text-white hover:bg-gray-500"
              style={{ minWidth: 100 }}
              onClick={handleAddActionItemWebSocket}
              disabled={!actionInput.trim() || !actionAssignee}
              type="submit"
            >
              Add
            </Button>
          </div>
        </div>
      </RetroFooter>
    </div>
  );
} 