import  { useCallback, useEffect, useRef, useState } from 'react';
import RetroFooter from './RetroFooter';
import { Button } from '@/components/ui/button';
import RetroHeader from '../RetroHeader';
import { apiService } from '@/services/api';
import { PhaseConfirmModal } from '@/components/ui/dialog';
import { getCategoryEmoji } from '@/lib/utils';
import useEnterToCloseModal from "@/hooks/useEnterToCloseModal";


export default function VotingPhase(props: any) {
  const {
    retro, participants, user, currentUserRole, showShareModal, setShowShareModal, handleLogout,
    isCurrentFacilitator, setPhase, broadcastPhaseChange, votesLeft,
    labellingItems, typingParticipants, setShowRoleModal, setSelectedParticipant,
    userVotes, handleVote, socket, isConnected, setLabellingItems
  } = props;

  const [allUserVotes, setAllUserVotes] = useState<{ [userId: string]: { [groupIdx: number]: number } }>({});
  const [voteTotals, setVoteTotals] = useState<Record<number, number>>({});



  const maxVotes = 3;
  const handleVoteWithBroadcast = useCallback((groupIdx: number, delta: number) => {
    const currentUserVotes = userVotes[groupIdx] || 0;
    const newUserVotes = Math.max(0, currentUserVotes + delta);
    
    // Check if this vote change is valid
    const totalCurrentVotes = (Object.values(userVotes) as number[]).reduce((sum: number, votes: number) => sum + votes, 0);
    const totalNewVotes = totalCurrentVotes + delta;
    if (totalNewVotes < 0 || totalNewVotes > maxVotes) {
      return;
    }
    
    const updatedUserVotes = { ...userVotes, [groupIdx]: newUserVotes };
    handleVote(groupIdx, delta);
    
    const group = labellingItems.find((g:any) => g.id === groupIdx);
    if (group && group.id) {
      const currentVotes = group.votes || 0;
      const newVotes = currentVotes + delta;
      
      // Update local state immediately
      setLabellingItems((prev: any[]) => 
        prev.map((g: any, idx: number) => 
          idx === groupIdx 
            ? { ...g, votes: Math.max(0, newVotes) }
            : g
        )
      );
      
      // Update database and broadcast - ONLY ONCE
      
      // Broadcast vote update with allUserVotes - use calculated userVotes
      if (socket && isConnected && user) {
        
        // Ensure we're sending the correct data structure
        const voteData = {
          retroId: retro.id,
          groupId: group.id,
          votes: Math.max(0, newVotes),
          userId: user.id,
          userVotes: updatedUserVotes
        };
        
        socket.emit('vote-update', voteData);
      }
    }
  }, [handleVote, labellingItems, setLabellingItems, socket, isConnected, user, retro?.id, userVotes, maxVotes]);


  
  // Function untuk menyimpan semua votes ke database saat facilitator menekan Action Items
  const handleSaveVotesAndProceed = useCallback(async () => {
    
    try {
      const currentVoteTotals = voteTotalsRef.current;

      // Save votes for all groups to database
        const savePromises = Object.entries(currentVoteTotals).map(async ([groupIdStr, totalVotes]) => {
        const groupId = Number(groupIdStr);

        const group = labellingItems.find((g: any) => g.id === groupId);
        if (!group) {
          console.warn(`⚠️ Group with id ${groupId} not found in labellingItems`);
        } else {  
          await apiService.updateVotes(group.id, totalVotes);
        }      
      });
      
      await Promise.all(savePromises);
      
      // Broadcast vote submission to all participants
      if (socket && isConnected && user) {
        socket.emit('vote-submission', {
          retroId: retro.id,
          facilitatorId: user.id,
          groupVotes: labellingItems.reduce((acc: any, group: any) => {
            if (group && group.id) {
              acc[group.id] = group.votes || 0;
            }
            return acc;
          }, {})
        });
      }
      
      // // Proceed to Action Items phase
      if (broadcastPhaseChange) {
        broadcastPhaseChange('ActionItems');
      } else if (setPhase) {
        setPhase('ActionItems');
      }
      
    } catch (error) {
      console.error('❌ Failed to save votes to database:', error);
      // Still proceed to Action Items even if save fails
      if (broadcastPhaseChange) {
        broadcastPhaseChange('ActionItems');
      } else if (setPhase) {
        setPhase('ActionItems');
      }
    }
  }, [labellingItems, broadcastPhaseChange, setPhase, socket, isConnected, user, retro?.id]);
  const [showModal, setShowModal] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    setShowModal(true);
  }, []);

  useEnterToCloseModal(showModal, () => setShowModal(false));

  useEffect(() => {
    async function fetchLabellingItems() {
      try {
        // Ambil data group beserta votes dari backend
        const groups = await apiService.getLabelsByRetro(retro.id);
        setLabellingItems(groups); // Pastikan groups sudah mengandung field votes
      } catch (err) {
        console.error('Failed to fetch voting data:', err);
      }
    }
    if (retro?.id) {
      fetchLabellingItems();
    }
  }, [retro?.id, setLabellingItems]);

  useEffect(() => {
    if (socket && retro?.id) {
      // Request state voting dari server via WebSocket
      socket.emit('request-retro-state', { retroId: retro.id });

      // Handler untuk menerima state dari server
      const handleRetroState = (state: any) => {
        if (state && state.labellingItems) {
          setLabellingItems(state.labellingItems);
        }
      };
      socket.on(`retro-state:${retro.id}`, handleRetroState);

      // Cleanup listener saat unmount
      return () => {
        socket.off(`retro-state:${retro.id}`, handleRetroState);
      };
    }
  }, [socket, retro?.id, setLabellingItems]);

  // Handler untuk menerima data votes semua peserta dari websocket
  useEffect(() => {
    if (!socket) return;

    // Handler vote-update (pastikan backend mengirimkan allUserVotes)
    const handleVoteUpdate = (data: { 
      groupId: number; 
      votes: number; 
      userId: string; 
      userVotes: { [groupId: number]: number };
      allUserVotes?: { [userId: string]: { [groupIdx: number]: number } };
    }) => {
      
      if (data.allUserVotes) {
        
        // Replace allUserVotes completely to ensure consistency
        setAllUserVotes(data.allUserVotes);
      }
    };

    // Handler retro-state (jika backend mengirimkan allUserVotes di state)
    const handleRetroState = (state: { 
      labellingItems?: any[];
      allUserVotes?: { [userId: string]: { [groupIdx: number]: number } };
    }) => {
      if (state.labellingItems) {
        setLabellingItems(state.labellingItems);
      }
      if (state.allUserVotes) {
        // Replace allUserVotes completely to ensure consistency
        setAllUserVotes(state.allUserVotes);
      }
    };

    socket.on(`vote-update:${retro?.id}`, handleVoteUpdate);
    socket.on(`retro-state:${retro?.id}`, handleRetroState);

    return () => {
      socket.off(`vote-update:${retro?.id}`, handleVoteUpdate);
      socket.off(`retro-state:${retro?.id}`, handleRetroState);
    };
  }, [socket, retro?.id]);

  // Debug logging untuk allUserVotes
 

  // Update allUserVotes locally when userVotes changes
  useEffect(() => {
    if (user?.id && userVotes) {

      
      setAllUserVotes(prev => {
        const currentUserVotes = prev[user.id] || {};
        const isSame = JSON.stringify(currentUserVotes) === JSON.stringify(userVotes);
        
        if (isSame) {
          return prev;
        }
        
        return {
          ...prev,
          [user.id]: { ...userVotes }
        };
      });
    }
  }, [userVotes, user?.id]);

  useEffect(() => {
    const totals: Record<number, number> = {};
  
    for (const userVotes of Object.values(allUserVotes)) {
      for (const [indexStr, vote] of Object.entries(userVotes)) {
        const index = Number(indexStr);
        totals[index] = (totals[index] || 0) + vote;
      }
    }
  
    setVoteTotals(totals);    
  }, [allUserVotes]);
  const voteTotalsRef = useRef(voteTotals);

  useEffect(() => {
    voteTotalsRef.current = voteTotals;
  }, [voteTotals]);
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Modal Stage Change Voting */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-xl w-full p-8">
            <h2 className="text-2xl font-bold mb-2 text-center">Stage Change: Voting!</h2>
            <div className="mb-4">
              <b>Guidance:</b>
              <ul className="list-disc pl-6 mt-2 text-left">
                <li>Apply votes to the items you feel are <b>most important</b> for the team to discuss.</li>
                <li>Multiple votes can be supplied to a single item.</li>
                <li>Voting is blind. Totals will be revealed when the facilitator advances the retro.</li>
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
        {labellingItems.map((group: any) => (
            <div key={group.id} className="bg-white border rounded-lg shadow-sm min-w-[350px] max-w-[400px] w-full p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-lg font-semibold text-gray-400">{group.label}</span>
                  {/* <span className="text-sm text-gray-500">Total Votes: {group.votes || 0}</span> */}
                </div>
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
                    onClick={() => handleVoteWithBroadcast(group.id, -1)}
                    disabled={(userVotes[group.id] || 0) <= 0}
                  >
                    -
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7 px-0"
                    onClick={() => handleVoteWithBroadcast(group.id, 1)}
                    disabled={votesLeft <= 0}
                  >
                    +
                  </Button>
                  <span className="w-5 text-center font-semibold">{userVotes[group.id] || 0}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                  {group.group_items.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-2 text-base">
                    <span>{getCategoryEmoji(item.item.format_type, retro.format)}</span>
                    <span>{item.item.content}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="h-40" />
      <RetroFooter
        left={
          <>
            {/* Mobile: kiri, title & subtitle */}
            <div className="flex flex-col items-start text-left md:hidden">
              <div className="text-2xl font-semibold mb-1">Voting</div>
              <div className="text-gray-500">{votesLeft} Votes Left</div>
            </div>
            {/* Desktop: kosong (atau tambahkan high contrast jika ada) */}
          </>
        }
        center={
          // Desktop only: title & subtitle di tengah
          <div className="hidden md:flex flex-col items-center justify-center">
            <div className="text-2xl font-semibold mb-1">Voting</div>
            <div className="text-gray-500">{votesLeft} Votes Left</div>
          </div>
        }
        right={
          isCurrentFacilitator && (
            <>
              <Button
                onClick={() => setShowConfirm(true)}
                className="flex items-center px-1 py-1 text-sm md:px-8 md:py-2 md:text-base font-semibold"
                variant="phasePrimary"
              >
                Action Items <span className="ml-2">&#8594;</span>
              </Button>
              <PhaseConfirmModal
                open={showConfirm}
                onOpenChange={setShowConfirm}
                title="Is your team satisfied with their votes?"
                onConfirm={handleSaveVotesAndProceed}
                onCancel={() => {}}
                confirmLabel="Yes"
                cancelLabel="No"
              />
            </>
          )
        }
        participants={participants}
        typingParticipants={typingParticipants}
        isCurrentFacilitator={isCurrentFacilitator}
        user={user}
        setShowRoleModal={setShowRoleModal}
        setSelectedParticipant={setSelectedParticipant}
        votesLeft={votesLeft}
        allUserVotes={allUserVotes}
        maxVotes={maxVotes}
      />
    </div>
  );
} 