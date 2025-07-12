import React from 'react';
import RetroFooter from './RetroFooter';
import { Button } from '@/components/ui/button';
import RetroHeader from '../RetroHeader';

export default function VotingPhase(props: any) {
  const {
    retro, participants, user, currentUserRole, showShareModal, setShowShareModal, handleLogout,
    isCurrentFacilitator, setPhase, broadcastPhaseChange, votesLeft,
    labellingItems, typingParticipants, setShowRoleModal, setSelectedParticipant,
    userVotes, handleVote
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
              <div className="mb-2 flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-400">{label}</span>
                <div className="flex items-center gap-2">
                  <div className="relative flex items-center">
                    <div className="bg-teal-400 text-white font-bold pl-4 pr-2 py-1 rounded-lg relative select-none text-left" style={{fontSize: '1rem', minWidth: '90px'}}>
                      <span className="relative z-10">Vote! &gt; &gt; </span>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7 px-0"
                    onClick={() => handleVote(idx, -1)}
                    disabled={(userVotes[idx] || 0) <= 0}
                  >
                    -
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7 px-0"
                    onClick={() => handleVote(idx, 1)}
                    disabled={votesLeft <= 0}
                  >
                    +
                  </Button>
                  <span className="w-5 text-center font-semibold">{userVotes[idx] || 0}</span>
                </div>
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
        title={<div className="flex flex-col items-start justify-center"><div className="text-xl font-semibold">Voting: {votesLeft} Votes Left</div></div>}
        center={<div></div>}
        right={isCurrentFacilitator && votesLeft === 0 && (
          <div className="flex flex-row items-center gap-2">
            <Button
              onClick={() => broadcastPhaseChange ? broadcastPhaseChange('ActionItems') : setPhase && setPhase('ActionItems')}
              className="px-8 py-2 rounded text-base font-semibold"
              variant="secondary"
            >
              Next: Action Items
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