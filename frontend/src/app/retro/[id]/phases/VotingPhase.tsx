import  { useCallback, useEffect, useState } from 'react';
import RetroFooter from './RetroFooter';
import { Button } from '@/components/ui/button';
import RetroHeader from '../RetroHeader';
import { apiService } from '@/services/api';
import { PhaseConfirmModal } from '@/components/ui/dialog';
import { getCategoryEmoji } from '@/lib/utils';
import useEnterToCloseModal from "@/hooks/useEnterToCloseModal";

function getIdeaCategoryIcon(category: string) {
  switch (category) {
    case "format_1": return <span role="img" aria-label="happy">😊</span>;
    case "format_2": return <span role="img" aria-label="sad">😢</span>;
    case "format_3": return <span role="img" aria-label="confused">😕</span>;
    default: return null;
  }
}

export default function VotingPhase(props: any) {
  const {
    retro, participants, user, currentUserRole, showShareModal, setShowShareModal, handleLogout,
    isCurrentFacilitator, setPhase, broadcastPhaseChange, votesLeft,
    labellingItems, typingParticipants, setShowRoleModal, setSelectedParticipant,
    userVotes, handleVote, socket, isConnected, setLabellingItems
  } = props;

  // State untuk menyimpan votes semua peserta
  const [allUserVotes, setAllUserVotes] = useState<{ [userId: string]: { [groupIdx: number]: number } }>({});

  // Function untuk update votes di database (tanpa broadcast untuk menghindari duplikasi)
  const updateVotesInDatabase = useCallback(async (groupId: number, newVotes: number) => {
    try {
      await apiService.updateVotes(groupId, newVotes);
      console.log('✅ Database updated successfully for group', groupId, 'with votes:', newVotes);
    } catch (error) {
      console.error('❌ Failed to update votes:', error);
    }
  }, []);

  // TODO: Ganti dengan variabel mapping votes semua peserta yang benar jika sudah ada
  const maxVotes = 3; // Sesuai dengan implementasi di RetroPage

  // Enhanced vote handler that updates database and broadcasts
  const handleVoteWithBroadcast = useCallback((groupIdx: number, delta: number) => {
    console.log('📊 handleVoteWithBroadcast called with:', { groupIdx, delta });
    console.log('📊 userVotes before handleVote:', userVotes);
    
    // Calculate the new userVotes manually
    const currentUserVotes = userVotes[groupIdx] || 0;
    const newUserVotes = Math.max(0, currentUserVotes + delta);
    
    // Check if this vote change is valid
    const totalCurrentVotes = (Object.values(userVotes) as number[]).reduce((sum: number, votes: number) => sum + votes, 0);
    const totalNewVotes = totalCurrentVotes + delta;
    
    console.log('📊 Vote validation:', {
      currentUserVotes,
      newUserVotes,
      totalCurrentVotes,
      totalNewVotes,
      maxVotes,
      delta,
      isValid: totalNewVotes >= 0 && totalNewVotes <= maxVotes
    });
    
    // Only proceed if vote change is valid
    if (totalNewVotes < 0 || totalNewVotes > maxVotes) {
      console.log('❌ Invalid vote change, aborting');
      return;
    }
    
    const updatedUserVotes = { ...userVotes, [groupIdx]: newUserVotes };
    
    console.log('📊 Calculated updatedUserVotes:', updatedUserVotes);
    console.log('📊 Total votes in updatedUserVotes:', (Object.values(updatedUserVotes) as number[]).reduce((sum: number, votes: number) => sum + votes, 0));
    
    // Call the original handleVote function first
    handleVote(groupIdx, delta);
    
    console.log('📊 userVotes after handleVote:', userVotes);
    
    // Update database and broadcast if vote was successful
    const group = labellingItems[groupIdx];
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
      updateVotesInDatabase(group.id, Math.max(0, newVotes));
      
      // Broadcast vote update with allUserVotes - use calculated userVotes
      if (socket && isConnected && user) {
        console.log('📊 Broadcasting vote update with updatedUserVotes:', updatedUserVotes);
        console.log('📊 updatedUserVotes type:', typeof updatedUserVotes);
        console.log('📊 updatedUserVotes keys:', Object.keys(updatedUserVotes));
        console.log('📊 updatedUserVotes values:', Object.values(updatedUserVotes));
        console.log('📊 Total votes in updatedUserVotes:', (Object.values(updatedUserVotes) as number[]).reduce((a: number, b: number) => a + b, 0));
        
        // Log setiap key-value pair untuk debugging
        Object.entries(updatedUserVotes).forEach(([key, value]) => {
          console.log(`📊 Key: ${key}, Value: ${value}, Type: ${typeof value}`);
        });
        
        // Ensure we're sending the correct data structure
        const voteData = {
          retroId: retro.id,
          groupId: group.id,
          votes: Math.max(0, newVotes),
          userId: user.id,
          userVotes: updatedUserVotes
        };
        
        console.log('📊 Sending vote data to backend:', voteData);
        socket.emit('vote-update', voteData);
      }
    }
  }, [handleVote, labellingItems, setLabellingItems, updateVotesInDatabase, socket, isConnected, user, retro?.id, userVotes, maxVotes]);

  // Function untuk menyimpan semua votes ke database saat facilitator menekan Action Items
  const handleSaveVotesAndProceed = useCallback(async () => {
    try {
      console.log('💾 Saving all votes to database before proceeding to Action Items...');
      
      // Save votes for all groups to database
      const savePromises = labellingItems.map(async (group: any) => {
        if (group && group.id) {
          console.log(`🔄 Saving votes for group ${group.id}: ${group.votes || 0}`);
          await apiService.updateVotes(group.id, group.votes || 0);
        }
      });
      
      await Promise.all(savePromises);
      console.log('✅ All votes saved successfully to database');
      
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
        console.log('📡 Vote submission broadcasted via WebSocket');
      }
      
      // Proceed to Action Items phase
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
      console.log('📊 Received vote-update:', data);
      
      if (data.allUserVotes) {
        console.log('📊 Setting allUserVotes:', data.allUserVotes);
        console.log('📊 allUserVotes type:', typeof data.allUserVotes);
        console.log('📊 allUserVotes keys:', Object.keys(data.allUserVotes));
        
        // Log setiap user dalam allUserVotes
        Object.entries(data.allUserVotes).forEach(([userId, userVotes]) => {
          const totalVotes = (Object.values(userVotes) as number[]).reduce((sum: number, votes: number) => sum + votes, 0);
          console.log(`📊 User ${userId}: totalVotes=${totalVotes}, userVotes=`, userVotes);
        });
        
        // Replace allUserVotes completely to ensure consistency
        setAllUserVotes(data.allUserVotes);
      }
    };

    // Handler retro-state (jika backend mengirimkan allUserVotes di state)
    const handleRetroState = (state: { 
      labellingItems?: any[];
      allUserVotes?: { [userId: string]: { [groupIdx: number]: number } };
    }) => {
      console.log('📊 Received retro-state:', state);
      if (state.labellingItems) {
        setLabellingItems(state.labellingItems);
      }
      if (state.allUserVotes) {
        console.log('📊 Setting allUserVotes from state:', state.allUserVotes);
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
  useEffect(() => {
    console.log('📊 Current allUserVotes state:', allUserVotes);
    console.log('📊 Max votes:', maxVotes);
    console.log('📊 Number of participants with votes:', Object.keys(allUserVotes).length);
    console.log('📊 Current user votes:', userVotes);
    console.log('📊 Current user total votes:', (Object.values(userVotes) as number[]).reduce((a: number, b: number) => a + Number(b), 0));
    
    // Log untuk setiap participant
    participants.forEach((p: any) => {
      const userVoteObj = allUserVotes?.[p.user.id] || {};
      const totalVotes = (Object.values(userVoteObj) as number[]).reduce((a: number, b: number) => a + Number(b), 0);
      const hasUsedAllVotes = totalVotes >= maxVotes;
      console.log(`📊 ${p.user.name}: ${totalVotes}/${maxVotes} votes, hasUsedAllVotes=${hasUsedAllVotes}`);
    });
  }, [allUserVotes, participants, maxVotes, userVotes]);

  // Update allUserVotes locally when userVotes changes
  useEffect(() => {
    if (user?.id && userVotes) {
      console.log('📊 Updating allUserVotes locally for current user:', user.id);
      console.log('📊 Current userVotes:', userVotes);
      
      setAllUserVotes(prev => {
        const currentUserVotes = prev[user.id] || {};
        const isSame = JSON.stringify(currentUserVotes) === JSON.stringify(userVotes);
        
        if (isSame) {
          console.log('📊 User votes already up to date, skipping update');
          return prev;
        }
        
        console.log('📊 Updating user votes in allUserVotes');
        return {
          ...prev,
          [user.id]: { ...userVotes }
        };
      });
    }
  }, [userVotes, user?.id]);

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
        {labellingItems.map((group: any, idx: number) => (
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
                    onClick={() => handleVoteWithBroadcast(idx, -1)}
                    disabled={(userVotes[idx] || 0) <= 0}
                  >
                    -
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7 px-0"
                    onClick={() => handleVoteWithBroadcast(idx, 1)}
                    disabled={votesLeft <= 0}
                  >
                    +
                  </Button>
                  <span className="w-5 text-center font-semibold">{userVotes[idx] || 0}</span>
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
        title={<div className="flex flex-col items-start justify-center"><div className="text-xl font-semibold">Voting: {votesLeft} Votes Left</div></div>}
        center={<div></div>}
        right={isCurrentFacilitator && (
          <>
            <Button
              onClick={() => setShowConfirm(true)}
              className="flex items-center px-8 py-2 text-base font-semibold"
              variant="phasePrimary"
            >
              Next: Action Items <span className="ml-2">&#8594;</span>
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
        )}
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