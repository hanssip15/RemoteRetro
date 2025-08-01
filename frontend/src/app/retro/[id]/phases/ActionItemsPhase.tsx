import React, { useEffect, useState } from 'react';
import RetroFooter from './RetroFooter';
import { Button } from '@/components/ui/button';
import RetroHeader from '../RetroHeader';
import { Pencil, Trash2 } from 'lucide-react';
import { PhaseConfirmModal } from '@/components/ui/dialog';
import { api, apiService } from '@/services/api';
import { getCategoryEmoji } from '@/lib/utils';
import useEnterToCloseModal from "@/hooks/useEnterToCloseModal";


export default function ActionItemsPhase({
  retro,
  participants,
  user,
  currentUserRole,
  showShareModal,
  setShowShareModal,
  handleLogout,
  actionItems,
  actionInput,
  actionAssignee,
  setActionInput,
  setActionAssignee,  
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
  handleAddActionItemWebSocket,
  handleEditActionItem,
  handleSaveEditActionItem,
  handleDeleteActionItem,
  broadcastPhaseChange,
  labellingItems,
}: any) {
  // Debug logging

  
  // Handler untuk tombol Add yang mengirim ke WebSocket

  
  React.useEffect(() => {
    // Hanya set actionAssignee jika belum ada nilai dan ada participants
    if (participants && participants.length > 0 && !actionAssignee) {
      setActionAssignee(participants[0].user.id);
    }
  }, [participants, setActionAssignee]); // Hapus actionAssignee dari dependencies untuk mencegah infinite loop
  
  // Helper function untuk memastikan actionAssignee tetap konsisten
  const handleActionAssigneeChange = (newAssignee: string) => {
    // Hanya update jika nilai benar-benar berbeda
    if (newAssignee !== actionAssignee) {
      setActionAssignee(newAssignee);
    }
  };

  const [showModal, setShowModal] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    setShowModal(true);
  }, []);

  useEnterToCloseModal(showModal, () => setShowModal(false));

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
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] w-full h-full bg-gray-50">
        {/* Panel kiri: feedback/group */}
        <div className="flex flex-col bg-white">
          <div className="flex flex-row flex-wrap gap-8 p-8 w-full justify-center">
            {labellingItems && labellingItems.length > 0 ? (
              labellingItems.sort((a: any, b: any) => b.votes - a.votes).map((group: any) => {
                return (
                  <div key={group.id} className="bg-white border rounded-lg shadow-sm min-w-[350px] max-w-[400px] w-full p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-lg font-semibold text-gray-400">{group.label || 'Unlabeled'}</span>
                      <div className="flex items-center gap-2">
                        <div className="bg-gray-100 text-gray-700 font-bold px-3 py-1 rounded select-none text-center" style={{fontSize: '1rem', minWidth: '60px'}}>
                          Votes {group.votes || 0}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {group.group_items.map((item: any, idx: number) => (
                        <div key={idx} className="bg-gray-50 border rounded px-3 py-2 text-sm flex items-center justify-between gap-2">
                          <span>{getCategoryEmoji(item.item.format_type, retro.format)}{item.item.content}</span>
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
        </div>
        {/* Panel kanan: Action Items */}
        <div className="w-[400px] border-l bg-white flex flex-col p-6 h-full min-h-screen">
          {/* Header sticky */}
          <div className="flex items-center gap-2 mb-2 sticky top-0 z-10 bg-white">
            <span className="text-2xl">🚀</span>
            <span className="text-xl font-semibold">Action Items</span>
          </div>
          <hr className="mb-4" />
          {/* Isi panel scrollable */}
          <div className="flex-1 overflow-y-auto">
            {/* List action items */}
            <div className="flex flex-col gap-2">
              {actionItems.length === 0 && <span className="text-gray-400 text-sm">No action items yet.</span>}
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
      </div>
      <RetroFooter
        title={null}
        center={null}
        right={null}
        participants={participants}
        typingParticipants={typingParticipants}
        isCurrentFacilitator={isCurrentFacilitator}
        user={user}
        setShowRoleModal={setShowRoleModal}
        setSelectedParticipant={setSelectedParticipant}
        
      >
        <div className="w-full bg-white border-t">
          <div className="container mx-auto px-2 sm:px-4 pt-7 pb-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <label className="font-medium mr-2 mb-1">Assignee:</label>
              <select
                className="w-64 px-3 pr-8 py-2 rounded-md border text-base"
                value={actionAssignee}
                onChange={e => handleActionAssigneeChange(e.target.value)}
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
            <div className="flex flex-row gap-2 w-full">
            <input
              type="text"
              placeholder="Ex. automate the linting process"
              className="border rounded px-2 py-1 flex-1"
              value={actionInput}
              onChange={e => setActionInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && actionInput.trim() && actionAssignee) {
                  e.preventDefault(); // Prevent default form submission
                  handleAddActionItemWebSocket();
                }
              }}
            
            />
            <Button
              onClick={handleAddActionItemWebSocket}
              disabled={!actionInput.trim() || !actionAssignee}
              className="px-4 py-1"
              type="submit"
              variant="phaseSecondary"
            >
              Add
            </Button>
            </div>
            {isCurrentFacilitator && (
              <>
                <Button
                  onClick={() => setShowConfirm(true)}
                  className="flex items-center px-8 py-2 text-base font-semibold w-full sm:w-auto"
                  variant="phasePrimary"
                  disabled= {actionItems.length === 0}
                >
                  Next: Final <span className="ml-2">&#8594;</span>
                </Button>
                <PhaseConfirmModal
                  open={showConfirm}
                  onOpenChange={setShowConfirm}
                  title="Are you sure you want to distribute this retrospective's action items? This will close the retro."
                  onConfirm={async () => {
                    try {
                      const bulkData = actionItems.map((item: any) => ({
                        retro_id: retro.id,
                        action_item: item.task,
                        assign_to: item.assigneeName,
                      }));
                      if (bulkData.length > 0) {
                        await api.createBulkActions(bulkData);
                      }

                      // Kirim email action items ke semua participant
                      const participantEmails = participants.map((p: any) => p.user.email).filter(Boolean);
                      await apiService.updateRetro(retro.id, { status: "completed" })
                      await apiService.updatePhase(retro.id, 'final'); 
                      await api.sendActionItemsEmail({
                        retroId: retro.id,
                        retroTitle: retro.title,
                        actionItems: actionItems.map((item: any) => ({
                          task: item.task,
                          assigneeName: item.assigneeName,
                        })),
                        participantEmails,
                      });

                      if (broadcastPhaseChange) broadcastPhaseChange('final');
                      else if (setPhase) setPhase('final');
                    } catch (err) {
                      alert('Failed to save action items to database or send email!');
                      console.error(err);
                    }
                  }}
                  onCancel={() => {}}
                  confirmLabel="Yes"
                  cancelLabel="No"
                />
              </>
            )}
          </div>
        </div>
      </RetroFooter>
    </div>
  );
} 