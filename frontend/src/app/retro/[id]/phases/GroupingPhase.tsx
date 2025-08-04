import { useEffect, useState, useMemo, useCallback } from 'react';
import RetroFooter from './RetroFooter';
import { Button } from '@/components/ui/button';
import RetroHeader from '../RetroHeader';
import Draggable from 'react-draggable';
import { PhaseConfirmModal } from '@/components/ui/dialog';
import { apiService } from '@/services/api';
import useEnterToCloseModal from "@/hooks/useEnterToCloseModal";
import HighContrastToggle from '@/components/HighContrastToggle';

export default function GroupingPhase({
  retro,
  participants,
  user,
  currentUserRole,
  showShareModal,
  setShowShareModal,
  handleLogout,
  items = [],
  itemPositions,
  highContrast,
  setHighContrast,
  itemGroups = {},
  signatureColors,
  handleDrag,
  handleStop,
  getGroupSummary,
  broadcastPhaseChange,
  draggingByOthers,
  isCurrentFacilitator,
  typingParticipants,
  setShowRoleModal,
  setSelectedParticipant,
  setPhase,
  getCategoryDisplayName,
  setItemGroups
}: {
  items?: any[];
  itemGroups?: { [id: string]: string };
  [key: string]: any;
  setItemGroups: (groups: { [id: string]: string }) => void;
  highContrast: boolean;
  setHighContrast: (val: boolean) => void;
  socket?: any;
}) {
  // 1. Semua useState hooks di awal
  const [showModal, setShowModal] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [forceRender, setForceRender] = useState(false);

  // 2. Semua useCallback hooks
  const handleModalClose = useCallback(() => setShowModal(false), []);

  // 3. Semua useEffect hooks
  useEffect(() => {
    setShowModal(true);
  }, []);

  useEnterToCloseModal(showModal, handleModalClose);

  // 5. Fallback: jika stuck di loading, force render setelah 3 detik
  useEffect(() => {
    if (items.length > 0 && Object.keys(itemPositions || {}).length === 0) {
      const timer = setTimeout(() => {
        // Hanya force render jika benar-benar tidak ada positions setelah 3 detik
        if (Object.keys(itemPositions || {}).length === 0) {
          setForceRender(true);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [items.length, itemPositions]);

  // 6. Semua useMemo hooks
  const positionsReady = useMemo(() => {
    const itemsLength = items.length;
    const positionsLength = Object.keys(itemPositions || {}).length;
    
    // Ready jika ada items dan positions untuk semua items
    // atau jika forceRender aktif
    const ready = (itemsLength > 0 && positionsLength === itemsLength) || forceRender;
    
    return ready;
  }, [items.length, itemPositions, forceRender]);

  // Cek jika tidak ada grup yang terbentuk, assign setiap item ke grup sendiri
  const processedItemGroups = useMemo(() => {
    // Jika itemGroups kosong atau semua item punya signature unik (tidak ada grouping)
    if (!itemGroups || Object.keys(itemGroups).length === 0) {
      // Setiap item jadi grup sendiri
      const result: { [id: string]: string } = {};
      (items || []).forEach((item: any) => {
        result[item.id] = item.id; // signature = id unik
      });
      return result;
    }
    // Cek jika semua signature unik (tidak ada 2 item dengan signature sama)
    const sigCount: { [sig: string]: number } = {};
    (Object.values(itemGroups) as string[]).forEach((sig: string) => { sigCount[sig] = (sigCount[sig] || 0) + 1; });
    const allUnique = Object.values(sigCount).every((count: number) => count === 1);
    if (allUnique) {
      const result: { [id: string]: string } = {};
      (items || []).forEach((item: any) => {
        result[item.id] = item.id;
      });
      return result;
    }
    // Default: pakai itemGroups asli
    return itemGroups;
  }, [itemGroups, items]);




  // 7. Early return untuk loading state
  if (!positionsReady && !forceRender) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading grouping board...</p>
          <p className="text-xs text-gray-400 mt-2">
            Items: {items.length} | Positions: {Object.keys(itemPositions || {}).length}
          </p>
        </div>
      </div>
    );
  }

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
                onClick={handleModalClose}
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
      <div className="flex-1 relative bg-white overflow-auto pb-40" style={{ minHeight: 'calc(100vh - 120px)' }}>
        {items.map((item: any, idx: number) => {
          const signature = processedItemGroups[item.id];
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
        {/* Footer modular */}
        <div className="h-40" />
        <RetroFooter
          left={
            <>
              {/* Mobile: kiri, title & summary */}
              <div className="flex flex-col items-start text-left md:hidden">
                <div className="text-lg font-semibold">Grouping</div>
                <div className="text-xs text-gray-500">
                  {(() => {
                    const summary = getGroupSummary();
                    return `${summary.totalGroups} groups, ${summary.totalGroupedItems} items grouped`;
                  })()}
                </div>
              </div>
              {/* Desktop: high contrast toggle */}
              <div className="hidden md:block">
                <HighContrastToggle highContrast={highContrast} onToggle={() => setHighContrast(!highContrast)} />
              </div>
            </>
          }
          center={
            // Desktop only: title & summary di tengah
            <div className="hidden md:flex flex-col items-center justify-center">
              <div className="text-lg font-semibold">Grouping</div>
              <div className="text-xs text-gray-500">
                {(() => {
                  const summary = getGroupSummary();
                  return `${summary.totalGroups} groups, ${summary.totalGroupedItems} items grouped`;
                })()}
              </div>
            </div>
          }
          right={
            isCurrentFacilitator && (
              <>
                <Button
                  onClick={() => setShowConfirm(true)}
                  className="flex items-center px-1 py-1 text-xs md:px-8 md:py-2 md:text-base font-semibold"
                  variant="phasePrimary"
                >
                  Next: Labelling <span className="ml-2">&#8594;</span>
                </Button>
                <PhaseConfirmModal
                  open={showConfirm}
                  onOpenChange={setShowConfirm}
                  title="Has your team finished grouping the ideas?"
                  onConfirm={async () => {
                    // Cek jika belum ada grup, assign setiap item ke grup sendiri
                    const sigCount: { [sig: string]: number } = {};
                    (Object.values(itemGroups || {}) as string[]).forEach((sig: string) => { sigCount[sig] = (sigCount[sig] || 0) + 1; });
                    const allUnique = Object.values(sigCount).every((count: number) => count === 1);
                    const noGroups = !itemGroups || Object.keys(itemGroups).length === 0 || allUnique;
                    if (noGroups && items && items.length > 0) {
                      const newGroups: { [id: string]: string } = {};
                      // 1. Buat grup di backend untuk setiap item
                      for (const item of items) {
                        // Buat grup baru (label = 'unlabeled')
                        const group = await apiService.createGroup(retro.id, { label: 'unlabeled', votes: 0 });
                        // Assign item ke grup
                        await apiService.createGroupItem(group.id.toString(), item.id);
                        newGroups[item.id] = group.id.toString();
                      }
                      setItemGroups(newGroups); // update state global
                      if (typeof setPhase === 'function') setPhase('labelling');
                    } 
                     if (typeof broadcastPhaseChange === 'function') broadcastPhaseChange('labelling');
                      else if (typeof setPhase === 'function') setPhase('labelling');
                  }}
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
        />
      </div>
    </div>
  );
} 