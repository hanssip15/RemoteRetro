import React from 'react';
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
  setSelectedParticipant
}: any) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
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
          {[0, 1].map((groupIdx: number) => (
            <div key={groupIdx} className="bg-white border rounded-lg shadow-sm w-auto min-w-[220px] max-w-[350px] px-4 py-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-400">{groupLabels[groupIdx]?.trim() || 'Unlabeled'}</span>
                <div className="flex items-center gap-2">
                  <div className="bg-gray-100 text-gray-700 font-bold px-3 py-1 rounded select-none text-center" style={{fontSize: '1rem', minWidth: '60px'}}>
                    Votes {userVotes[groupIdx] || 0}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {/* TODO: Render items per group if needed */}
              </div>
            </div>
          ))}
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
                    {item.task} <span className="text-gray-700">({item.assigneeName})</span>
                    {item.edited && <span className="ml-2 text-xs text-gray-500 font-semibold">(edited)</span>}
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
          <Button className="px-8 py-2 rounded text-base font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300" style={{ minWidth: 180 }} onClick={() => window.location.href = '/dashboard'}>Visit your dashboard <span className="ml-2">&rarr;</span></Button>
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