import React, { useEffect, useState } from 'react';
import RetroFooter from './RetroFooter';
import { Button } from '@/components/ui/button';
import RetroHeader from '../RetroHeader';

export default function FinalPhase({
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
  typingParticipants,
  isCurrentFacilitator,
  setShowRoleModal,
  setSelectedParticipant,
  labellingItems
}: any) {
  // Tambahkan state modal
  const [showModal, setShowModal] = useState(true);

  useEffect(() => {
    setShowModal(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Modal Stage Change Final/Closed */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-xl w-full p-8">
            <h2 className="text-2xl font-bold mb-2 text-center">The Retrospective Has Been Closed!</h2>
            <p className="mb-4 text-center">
              The facilitator has closed the retro and distributed the action items via email. You can stick around and review the board, or revisit this retro and all action items generated via your{' '}
              <a href="/dashboard" className="text-blue-600 underline">retro dashboard</a>.
            </p>
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
        {/* Card group kiri (read-only) */}
        <div className="flex flex-row gap-6 p-8 items-start flex-1">
        {labellingItems && labellingItems.length > 0 ? (
          labellingItems.sort((a: any, b: any) => b.votes - a.votes).map((group: any, idx: number) => {
            return (            <div key={group.id} className="bg-white border rounded-lg shadow-sm w-auto min-w-[220px] max-w-[350px] px-4 py-3">
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
                      <span>{item.item ? item.item.content : 'No item'}</span>
                    </div>
                  ))}
                </div>
            </div>
          )})
        ) : (
          <div className="text-gray-400 text-sm">No items to display.</div>
        )}
        </div>
        {/* Panel Action Items kanan (read-only) */}
        <div className="w-[400px] border-l bg-white flex flex-col p-6 sticky top-0 self-start overflow-y-auto" style={{ height: 'calc(100vh - 80px)', right: 0 }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🚀</span>
            <span className="text-xl font-semibold">Action Items</span>
          </div>
          <hr className="mb-4" />
          {/* List action items (read-only) */}
          <div className="flex flex-col gap-2">
            {actionItems.length === 0 && <span className="text-gray-400 text-sm">No action items yet.</span>}
            {actionItems.map((item: any, idx: number) => (
              <div key={idx} className="bg-gray-50 border rounded px-3 py-2 text-sm flex items-center justify-between gap-2">
                <div className="flex-1 flex flex-col">
                  <span>
                    {item.action_item} <span className="text-gray-700">({item.assign_to})</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <RetroFooter
        title={<div className="text-xl font-semibold">This retro is all wrapped up!</div>}
        center={<div className="text-gray-600">Contents are read-only.</div>}
        right={<div className="flex flex-row items-center gap-2">
          <Button className="flex items-center px-8 py-2 text-base font-semibold" style={{ minWidth: 180 }} onClick={() => window.location.href = '/dashboard'} variant="phasePrimary">Visit your dashboard <span className="ml-2">&rarr;</span></Button>
        </div>}
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