import React, { useEffect, useState } from 'react';
import RetroFooter from './RetroFooter';
import { Button } from '@/components/ui/button';
import RetroHeader from '../RetroHeader';
import Draggable from 'react-draggable';

export default function GroupingPhase({
  retro,
  participants,
  user,
  currentUserRole,
  showShareModal,
  setShowShareModal,
  handleLogout,
  items,
  itemPositions,
  highContrast,
  itemGroups,
  signatureColors,
  handleDrag,
  handleStop,
  getGroupSummary,
  saveGroupData,
  isPhaseChanging,
  broadcastPhaseChange,
  draggingByOthers,
  isCurrentFacilitator,
  currentUserParticipant,
  typingParticipants,
  setShowRoleModal,
  setSelectedParticipant,
  setPhase,
  getCategoryDisplayName
}: any) {
  const [showModal, setShowModal] = useState(true);

  useEffect(() => {
    setShowModal(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Modal Stage Change Grouping */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-xl w-full p-8">
            <h2 className="text-2xl font-bold mb-2 text-center">Stage Change: Grouping!</h2>
            <div className="mb-4">
              <b>Guidance:</b>
              <ul className="list-disc pl-6 mt-2 text-left">
                <li>Bring related ideas into contact.</li>
                <li>Leave disparate ideas far apart.</li>
                <li>If there's a disagreement, attempt to settle it without speaking.</li>
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
      <div className="flex-1 relative bg-white overflow-hidden" style={{ minHeight: 'calc(100vh - 120px)' }}>
        {items.map((item: any, idx: number) => {
          const signature = itemGroups[item.id];
          const groupSize = signature ? Object.values(itemGroups).filter((sig: any) => sig === signature).length : 0;
          let borderColor = highContrast ? '#000000' : '#e5e7eb';
          if (!highContrast && signature && groupSize > 1 && signatureColors[signature]) {
            borderColor = signatureColors[signature];
          }
          const pos = itemPositions[item.id] || { x: 200 + (idx % 3) * 220, y: 100 + Math.floor(idx / 3) * 70 };
          const isBeingDraggedByOthers = draggingByOthers[item.id];
          const draggingUser = participants.find((p: any) => p.user.id === isBeingDraggedByOthers);
          return (
            <Draggable
              key={item.id}
              position={pos}
              onDrag={(e: any, data: any) => handleDrag(item.id, e, data)}
              onStop={(e: any, data: any) => handleStop(item.id, e, data)}
              bounds="parent"
            >
              <div
                id={'group-item-' + item.id}
                className={`px-3 py-2 bg-white border rounded shadow text-sm cursor-move select-none relative ${isBeingDraggedByOthers ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
                style={{
                  minWidth: 80,
                  textAlign: 'center',
                  zIndex: isBeingDraggedByOthers ? 10 : 2,
                  border: `4px solid ${borderColor}`,
                  transition: 'border-color 0.2s',
                  position: 'absolute',
                }}
              >
                {item.content} <span className="text-xs text-gray-500">({getCategoryDisplayName(item.category)})</span>
                {isBeingDraggedByOthers && draggingUser && (
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {draggingUser.user.name} is dragging
                  </div>
                )}
              </div>
            </Draggable>
          );
        })}
        {/* High Contrast toggle kiri bawah (fixed) */}
        <div className="fixed left-4 bottom-4 flex items-center gap-2 z-10 bg-white border rounded px-2 py-1 shadow">
          <span className="text-gray-700 text-lg">
            <svg width="22" height="22" fill="none" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16V2z" fill="#222"/><circle cx="10" cy="10" r="8" stroke="#888" strokeWidth="2"/></svg>
          </span>
          <span className="text-base text-gray-900 font-medium">High Contrast</span>
          <label className="ml-2 relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={highContrast}
              onChange={(e) => {}}
              readOnly
            />
            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
            <div className="absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-all peer-checked:translate-x-4"></div>
          </label>
        </div>
        {/* Footer modular */}
        <RetroFooter
          title={<div className="flex flex-col items-start justify-center"><div className="text-lg font-semibold">Grouping</div><div className="text-xs text-gray-500">{(() => {const summary = getGroupSummary();return `${summary.totalGroups} groups, ${summary.totalGroupedItems} items grouped`;})()}</div></div>}
          center={<div></div>}
          right={isCurrentFacilitator && (
            <div className="flex flex-row items-center gap-2">
              <Button
                onClick={() => broadcastPhaseChange ? broadcastPhaseChange('labelling') : setPhase && setPhase('labelling')}
                className="px-8 py-2 rounded text-base font-semibold"
                variant="secondary"
              >
                Next: Labelling
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
    </div>
  );
} 