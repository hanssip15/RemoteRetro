import React from 'react';
import RetroFooter from './RetroFooter';
import { Button } from '@/components/ui/button';
import RetroHeader from '../RetroHeader';

export default function LabellingPhase(props: any) {
  const {
    retro, participants, user, currentUserRole, showShareModal, setShowShareModal, handleLogout,
    isCurrentFacilitator, setPhase, broadcastPhaseChange,
    labellingItems, typingParticipants, setShowRoleModal, setSelectedParticipant,
    groupLabels, setGroupLabels
  } = props;
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
      <div className="flex-1 flex flex-col items-center justify-start w-full">
        <div className="flex flex-row gap-8 mt-8 w-full justify-center">
          {Object.entries(labellingItems).map(([label, groupItems]: any, idx: number) => (
            <div key={label} className="bg-white border rounded-lg shadow-sm min-w-[350px] max-w-[400px] w-full p-4">
              <div className="mb-2">
                <input
                  className="w-full text-center text-gray-500 font-semibold bg-gray-100 rounded px-2 py-1 mb-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Optional Group Label"
                  maxLength={20}
                  value={label}
                  readOnly
                />
              </div>
              <div className="flex flex-col gap-2">
                {groupItems.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-2 text-base">
                    <span>{item.content}</span>
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