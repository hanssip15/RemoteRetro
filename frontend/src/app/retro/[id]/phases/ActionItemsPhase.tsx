import React, { useEffect, useState, useRef } from 'react';
import RetroFooter from './RetroFooter';
import { Button } from '@/components/ui/button';
import RetroHeader from '../RetroHeader';
import { Check, Pencil, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { PhaseConfirmModal } from '@/components/ui/dialog';
import { api, apiService } from '@/services/api';
import { getCategoryEmoji } from '@/lib/utils';
import useEnterToCloseModal from "@/hooks/useEnterToCloseModal";
import { Participant } from '@/services/api';

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
  handleInputTextChange,   // ✅ sama seperti Ideation
  handleKeyDown,           // ✅ sama seperti Ideation
}: any) {
  const [allParticipants, setAllParticipants] = useState<Participant[]>([]);
  useEffect(() => {
    const fetchAllParticipants = async () => {
      const all = await apiService.getParticipants(retro.id);
      setAllParticipants(all);
    };
    fetchAllParticipants();
  }, [retro.id, participants]);

  React.useEffect(() => {
    if (allParticipants && allParticipants.length > 0 && !actionAssignee) {
      setActionAssignee(allParticipants[0].user.id);
    }
  }, [allParticipants, setActionAssignee]);

  const handleActionAssigneeChange = (newAssignee: string) => {
    if (newAssignee !== actionAssignee) {
      setActionAssignee(newAssignee);
    }
  };

  const [showModal, setShowModal] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [lastAddedActionItemIdx, setLastAddedActionItemIdx] = useState<number | null>(null);
  const actionItemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const actionItemsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setShowModal(true);
  }, []);

  // Initialize refs array when actionItems change
  useEffect(() => {
    actionItemRefs.current = actionItemRefs.current.slice(0, actionItems.length);
  }, [actionItems.length]);

  // Reset refs when sidebar state changes to ensure proper scrolling
  useEffect(() => {
    // Force re-initialization of refs when sidebar toggles
    actionItemRefs.current = new Array(actionItems.length).fill(null);
  }, [isSidebarCollapsed, actionItems.length]);

  // Detect when new action item is added for autoscroll
  useEffect(() => {
    if (actionItems && actionItems.length > 0) {
      // Set the last added item index to the last item in the array
      setLastAddedActionItemIdx(actionItems.length - 1);
    }
  }, [actionItems.length]); // Only depend on length, not the entire array

  // Autoscroll to the last added action item
  useEffect(() => {
    if (lastAddedActionItemIdx !== null) {
      // Use requestAnimationFrame to ensure DOM is fully rendered
      const timeoutId = setTimeout(() => {
        requestAnimationFrame(() => {
          try {
            // Try individual item scroll first
            if (actionItemRefs.current[lastAddedActionItemIdx]) {
              actionItemRefs.current[lastAddedActionItemIdx]?.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
              });
            }
            
            // Also try container scroll as backup
            if (actionItemsContainerRef.current) {
              actionItemsContainerRef.current.scrollTo({
                top: actionItemsContainerRef.current.scrollHeight,
                behavior: 'smooth'
              });
            }
          } catch (error) {
            // Ignore scroll errors
          }
        });
      }, 200);

      return () => clearTimeout(timeoutId);
    }
  }, [lastAddedActionItemIdx, isSidebarCollapsed]);

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

      <div className={`flex w-full flex-1 overflow-hidden min-h-0 bg-white transition-all duration-300 ${
        isSidebarCollapsed ? 'flex-col md:grid md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_400px]' : 'flex-row md:grid md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_400px]'
      }`}>
        {/* Panel kiri - Mobile: Action Items (Main), Desktop: Labelling Items */}
        <div className={`flex flex-col bg-white overflow-hidden min-h-0 ${
          isSidebarCollapsed ? 'w-full md:w-auto' : 'w-1/2 md:w-auto'
        }`}>
          {/* Mobile: Action Items (Main Content) */}
          <div className="md:hidden">
            <div className="flex items-center justify-between mb-2 p-4 border-b">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-xl">🚀</span>
                <span className="text-lg font-semibold truncate">Action Items</span>
              </div>
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                title={isSidebarCollapsed ? "Show labelling sidebar" : "Hide labelling sidebar"}
              >
                {isSidebarCollapsed ? (
                  <ChevronRight className="h-5 w-5 text-gray-600" />
                ) : (
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                )}
              </button>
            </div>
            <div ref={actionItemsContainerRef} className="flex-1 overflow-y-auto max-h-[calc(85vh-280px)] p-4">
              <div className="flex flex-col gap-2">
                {actionItems.length === 0 && <span className="text-gray-400 text-sm">No action items yet.</span>}
                {actionItems.map((item: any, idx: number) => (
                  <div 
                    key={item.id || idx} 
                    ref={(el) => {
                      actionItemRefs.current[idx] = el;
                    }}
                    className="bg-gray-50 border rounded px-3 py-2 text-sm flex items-start justify-between gap-2"
                  >
                    {editingActionIdx === idx ? (
                      <div className="flex-1 flex flex-col gap-1">
                        <div className="flex gap-2">
                          <select
                            className="w-32 px-2 py-1 rounded-md border text-sm"
                            value={editActionAssignee}
                            onChange={e => setEditActionAssignee(e.target.value)}
                          >
                            {allParticipants.map((p: any) => (
                              <option key={p.user.id} value={p.user.id}>{p.user.name}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            className="border rounded px-2 py-1 flex-1 text-sm"
                            value={editActionInput}
                            onChange={e => setEditActionInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const originalTask = (item.task || '').trim()
                                const newTask = editActionInput.trim()
                                const originalAssignee = item.assigneeId || item.assignee || ''
                                const hasChanges = (newTask !== originalTask) || (editActionAssignee !== originalAssignee)
                                if (hasChanges) {
                                  handleSaveEditActionItem(idx)
                                } else {
                                  e.preventDefault()
                                }
                              }
                              if (e.key === "Escape") setEditingActionIdx(null)
                            }}
                          />
                        </div>
                        <div className="flex gap-2 mt-1">
                          <Button size="sm" className="bg-black text-white hover:bg-black/90" onClick={() => handleSaveEditActionItem(idx)} disabled={
                            editActionInput.trim() === (item.task || '').trim() &&
                            (editActionAssignee === (item.assigneeId || item.assignee || ''))
                          }>
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="bg-white text-gray-900 hover:bg-gray-100" onClick={() => setEditingActionIdx(null)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 flex flex-col min-w-0">
                          <span className="break-words">
                            {item.task} <span className="text-gray-700">({item.assigneeName})</span>
                            {item.edited && <span className="ml-2 text-xs text-gray-500 font-semibold">(edited)</span>}
                          </span>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
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
                                onClick={() => {
                                  if (window.confirm(`Yakin ingin menghapus action item: \"${item.task}\"?`)) {
                                    handleDeleteActionItem(idx);
                                  }
                                }}
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

          {/* Desktop: Labelling Items */}
          <div className="hidden md:block">
            <div className="flex-1 overflow-y-auto max-h-[calc(92vh-240px)] flex flex-row flex-wrap gap-4 md:gap-8 p-4 md:p-8 w-full justify-center">
            {labellingItems && labellingItems.length > 0 ? (
              labellingItems.sort((a: any, b: any) => b.votes - a.votes).map((group: any) => (
                  <div key={group.id} className="bg-white border rounded-lg shadow-sm w-full sm:max-w-[400px] p-2 md:p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-400">{group.label || 'Unlabeled'}</span>
                    <div className="bg-gray-100 text-gray-700 font-bold px-3 py-1 rounded text-center">
                      Votes {group.votes || 0}
                    </div>
                  </div>
                    <div className="flex flex-col gap-1 md:gap-2">
                    {group.group_items.map((item: any, idx: number) => (
                        <div key={idx} className="bg-gray-50 border rounded px-2 md:px-3 py-1 md:py-2 text-xs md:text-sm">
                          <div className="flex items-start gap-1 md:gap-3">
                            <span className="mt-0.5 flex-shrink-0 text-xs md:text-sm">{getCategoryEmoji(item.item.format_type, retro.format)}</span>
                          <span className="break-words flex-1">{item.item.content}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-center w-full py-8">
                <p>No labelling items available</p>
              </div>
            )}
          </div>
        </div>
        </div>

        {/* Panel kanan - Mobile: Labelling Items (Sidebar), Desktop: Action Items */}
        {(!isSidebarCollapsed || window.innerWidth >= 768) && (
          <div className={`bg-white flex flex-col h-full overflow-hidden min-h-0 md:w-[300px] lg:w-[400px] transition-all duration-300 ${
            isSidebarCollapsed ? 'w-full' : 'w-1/2'
          }`}>
          {/* Mobile: Labelling Items (Sidebar) */}
          <div className="md:hidden">
            {!isSidebarCollapsed && (
              <>
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-xl">📋</span>
                    <span className="text-lg font-semibold truncate">Items</span>
                  </div>
                  <div className="w-6 h-6 p-1"></div>
                </div>
                <div className="flex-1 overflow-y-auto max-h-[calc(85vh-280px)] p-4">
                <div className="flex flex-col gap-2">
                  {labellingItems && labellingItems.length > 0 ? (
                    labellingItems.sort((a: any, b: any) => b.votes - a.votes).map((group: any) => (
                      <div key={group.id} className="bg-white border rounded-lg shadow-sm p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-400">{group.label || 'Unlabeled'}</span>
                          <div className="bg-gray-100 text-gray-700 font-bold px-2 py-1 rounded text-xs">
                            {group.votes || 0}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          {group.group_items.map((item: any, idx: number) => (
                            <div key={idx} className="bg-gray-50 border rounded px-2 py-1 text-xs">
                              <div className="flex items-start gap-2">
                                <span className="mt-0.5 flex-shrink-0 text-xs">{getCategoryEmoji(item.item.format_type, retro.format)}</span>
                                <span className="break-words flex-1">{item.item.content}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400 text-sm text-center py-4">
                      <p>No labelling items available</p>
                    </div>
                  )}
                </div>
                </div>
              </>
            )}
          </div>

          {/* Desktop: Action Items */}
          <div className="hidden md:block">
          <div className="flex items-center gap-2 mb-2 sticky top-0 z-10 bg-white">
              <span className="text-xl md:text-2xl">🚀</span>
              <span className="text-lg md:text-xl font-semibold">Action Items</span>
          </div>
            <hr className="mb-2 md:mb-4" />

          <div className="flex-1 overflow-y-auto max-h-[calc(87vh-260px)]">
              <div className="flex flex-col gap-1 md:gap-2">
                {actionItems.length === 0 && <span className="text-gray-400 text-xs md:text-sm">No action items yet.</span>}
              {actionItems.map((item: any, idx: number) => (
                  <div 
                    key={item.id || idx} 
                    ref={(el) => {
                      actionItemRefs.current[idx] = el;
                    }}
                    className="bg-gray-50 border rounded px-2 md:px-3 py-1 md:py-2 text-xs md:text-sm flex items-start justify-between gap-1 md:gap-2"
                  >
                  {editingActionIdx === idx ? (
                    <div className="flex-1 flex flex-col gap-1">
                      <div className="flex gap-2">
                        <select
                          className="w-32 px-2 py-1 rounded-md border text-sm"
                          value={editActionAssignee}
                          onChange={e => setEditActionAssignee(e.target.value)}
                        >
                          {allParticipants.map((p: any) => (
                            <option key={p.user.id} value={p.user.id}>{p.user.name}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          className="border rounded px-2 py-1 flex-1 text-sm"
                          value={editActionInput}
                          onChange={e => setEditActionInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const originalTask = (item.task || '').trim()
                              const newTask = editActionInput.trim()
                              const originalAssignee = item.assigneeId || item.assignee || ''
                              const hasChanges = (newTask !== originalTask) || (editActionAssignee !== originalAssignee)
                              if (hasChanges) {
                                handleSaveEditActionItem(idx)
                              } else {
                                e.preventDefault()
                              }
                            }
                            if (e.key === "Escape") setEditingActionIdx(null)
                          }}
                        />
                      </div>
                      <div className="flex gap-2 mt-1">
                        <Button size="sm" className="bg-black text-white hover:bg-black/90" onClick={() => handleSaveEditActionItem(idx)} disabled={
                          editActionInput.trim() === (item.task || '').trim() &&
                          (editActionAssignee === (item.assigneeId || item.assignee || ''))
                        }>
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="bg-white text-gray-900 hover:bg-gray-100" onClick={() => setEditingActionIdx(null)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 flex flex-col min-w-0">
                        <span className="break-words">
                          {item.task} <span className="text-gray-700">({item.assigneeName})</span>
                          {item.edited && <span className="ml-2 text-xs text-gray-500 font-semibold">(edited)</span>}
                        </span>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
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
                              onClick={() => {
                                if (window.confirm(`Yakin ingin menghapus action item: \"${item.task}\"?`)) {
                                  handleDeleteActionItem(idx);
                                }
                              }}
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
        )}
      </div>


      {/* Footer untuk mobile dan desktop */}
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
              <label className="font-medium mr-2 mb-1 text-sm md:text-base">Assignee:</label>
              <select
                className="w-48 md:w-64 px-2 md:px-3 pr-6 md:pr-8 py-1 md:py-2 rounded-md border text-sm md:text-base"
                value={actionAssignee}
                onChange={e => handleActionAssigneeChange(e.target.value)}
              >
                {allParticipants.length > 0 ? (
                  allParticipants.map((p: any) => (
                    <option key={p.user.id} value={p.user.id}>{p.user.name}</option>
                  ))
                ) : (
                  <option>No participants</option>
                )}
              </select>
            </div>

            <div className="flex flex-row gap-1 md:gap-2 w-full">
              <input
                type="text"
                placeholder="Ex. automate the linting process"
                className="border rounded px-2 py-1 flex-1 text-sm md:text-base"
                value={actionInput}
                onChange={e => {
                  setActionInput(e.target.value);
                  if (handleInputTextChange) handleInputTextChange(e);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && actionInput.trim() && actionAssignee) {
                    e.preventDefault();
                    handleAddActionItemWebSocket();
                  } else if (handleKeyDown) {
                    handleKeyDown(e);
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
                  disabled={actionItems.length === 0}
                >
                  Final <span className="ml-2">&#8594;</span>
                </Button>
                <PhaseConfirmModal
                  open={showConfirm}
                  onOpenChange={setShowConfirm}
                  title="Are you sure you want to distribute this retrospective's action items? This will close the retro."
                  onConfirm={async () => {
                    try {
                      const bulkData = actionItems.map((item: any) => ({
                        action_item: item.task,
                        assign_to: item.assigneeName,
                      }));
                      if (bulkData.length > 0) {
                        await api.createBulkActions(retro.id, bulkData);
                      }

                      const participantEmails = allParticipants.map((p: any) => p.user.email).filter(Boolean);
                      
                      await apiService.updateRetroStatus(retro.id, "completed")
                      await apiService.updateRetroPhase(retro.id, 'final'); 
                      await api.sendActionItemsEmail({
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
