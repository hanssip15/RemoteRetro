import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import RetroFooter from './RetroFooter';
import { Button } from '@/components/ui/button';
import RetroHeader from '../RetroHeader';
import Draggable from 'react-draggable';
import { PhaseConfirmModal } from '@/components/ui/dialog';
import useEnterToCloseModal from "@/hooks/useEnterToCloseModal";
import HighContrastToggle from '@/components/HighContrastToggle';
import { Loader2, Share2, User, LogOut } from 'lucide-react';
import { CategoryIcon } from '@/components/CategoryIcon';
import { useOrientation } from '@/hooks/useOrientation';
import LandscapeWarning from '@/components/LandscapeWarning';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PhaseModal } from '@/components/shared';

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
  setShowRoleModal,
  setSelectedParticipant,
  setPhase,
  socket,
  isConnected
}: {
  items?: any[];
  itemGroups?: { [id: string]: string };
  [key: string]: any;
  setItemGroups: (groups: { [id: string]: string }) => void;
  highContrast: boolean;
  setHighContrast: (val: boolean) => void;
  socket?: any;
}) {
  const [showModal, setShowModal] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [measuredPositions, setMeasuredPositions] = useState<{ [key: string]: { x: number; y: number } }>({});
  const measurementRef = useRef<HTMLDivElement | null>(null);
  const reflowRafRef = useRef<number | null>(null);
  const reflowTimeoutRef = useRef<number | null>(null);

  const handleModalClose = useCallback(() => setShowModal(false), []);
  const [isLoading, setIsLoading] = useState(false);
  
  // Hook untuk mendeteksi orientasi device
  const { isPortrait } = useOrientation();
  useEffect(() => {
    setShowModal(true);
  }, []);

  useEnterToCloseModal(showModal, handleModalClose);

  const positionsReady = useMemo(() => {
    const itemsLength = items.length;
    const positionsLength = Object.keys(itemPositions || {}).length;
    const measuredLength = Object.keys(measuredPositions || {}).length;
    const ready = itemsLength > 0 && (positionsLength === itemsLength || measuredLength === itemsLength);
    return ready;
  }, [items.length, itemPositions, measuredPositions]);

  const processedItemGroups = useMemo(() => {
    if (!itemGroups || Object.keys(itemGroups).length === 0) {
      const result: { [id: string]: string } = {};
      (items || []).forEach((item: any) => {
        result[item.id] = item.id; 
      });
      return result;
    }
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
    return itemGroups;
  }, [itemGroups, items]);

  // Compute measured positions with consistent 15px horizontal gaps
  const computeLayout = useCallback(() => {
    if (!items || items.length === 0) return;
    const container = boardRef.current;
    const containerWidth = container?.clientWidth || (typeof window !== 'undefined' ? window.innerWidth - 40 : 1000);
    const baseX = 10;
    const baseY = 10;
    const gap = 15;
    const positions: { [key: string]: { x: number; y: number } } = {};
    let currentX = baseX;
    let currentY = baseY;
    let rowHeight = 0;
    for (const item of items) {
      const el = document.getElementById('measure-item-' + item.id);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const PanjangKartuPrev = Math.ceil(rect.width);
      const height = Math.ceil(rect.height);
      if (currentX !== baseX && currentX + PanjangKartuPrev > containerWidth) {
        currentX = baseX;
        currentY += rowHeight + gap;
        rowHeight = 0;
      }
      positions[item.id] = { x: currentX, y: currentY };
      currentX += PanjangKartuPrev + gap;
      if (height > rowHeight) rowHeight = height;
    }
    setMeasuredPositions(positions);
    if (socket && isConnected && user) {
      socket.emit('item-position-update', {
        retroId: retro.id,
        itemPositions: positions,
        userId: user.id,
        source: 'init-layout'
      });
    }
  }, [items, socket, isConnected, retro?.id, user?.id]);

  // Trigger initial measurement-based layout when no server positions
  useEffect(() => {
    const shouldCompute = items.length > 0 && (!itemPositions || Object.keys(itemPositions || {}).length === 0);
    if (!shouldCompute) return;
    if (reflowRafRef.current) cancelAnimationFrame(reflowRafRef.current);
    reflowRafRef.current = requestAnimationFrame(() => computeLayout());
    return () => { if (reflowRafRef.current) cancelAnimationFrame(reflowRafRef.current); };
  }, [items, itemPositions, computeLayout]);

  // Recompute layout on measurement changes and window resize
  useEffect(() => {
    const m = measurementRef.current;
    if (!m) return;
    const ro = new ResizeObserver(() => {
      if (reflowTimeoutRef.current) window.clearTimeout(reflowTimeoutRef.current);
      reflowTimeoutRef.current = window.setTimeout(() => computeLayout(), 50);
    });
    m.querySelectorAll('[id^="measure-item-"]').forEach(el => ro.observe(el));
    const onResize = () => computeLayout();
    window.addEventListener('resize', onResize);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', onResize);
      if (reflowTimeoutRef.current) window.clearTimeout(reflowTimeoutRef.current);
    };
  }, [items, computeLayout]);

  // Always render the board; show overlay loader until positions ready

  // Tampilkan warning landscape jika device dalam mode portrait
  const showLandscapeWarning = isPortrait && window.innerWidth <= 768; // Hanya untuk mobile
  
  // Deteksi mobile landscape mode
  const isMobileLandscape = window.innerWidth <= 768 && !isPortrait;
  
  

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Landscape Warning untuk Mobile */}
      <LandscapeWarning isVisible={showLandscapeWarning} />
      {/* Modal Stage Change Grouping */}
      <PhaseModal
        isVisible={showModal}
        onClose={handleModalClose}
        title="Stage Change: Grouping!"
      >
        <b>Guidance:</b>
        <ul className="list-disc pl-6 mt-2 text-left">
          <li>Bring related ideas into contact.</li>
          <li>Leave disparate ideas far apart.</li>
          <li>If there's a disagreement, attempt to settle it without speaking.</li>
        </ul>
      </PhaseModal>
      {/* Sembunyikan header pada mobile landscape */}
      {!isMobileLandscape && (
        <RetroHeader
          retro={retro}
          participants={participants}
          user={user}
          currentUserRole={currentUserRole}
          showShareModal={showShareModal}
          setShowShareModal={setShowShareModal}
          handleLogout={handleLogout}
        />
      )}
      
      {/* Minimal controls untuk mobile landscape */}
      {isMobileLandscape && (
        <div className="fixed top-1 right-1 z-50 flex gap-1">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-6 w-6 bg-white/90 backdrop-blur-sm" 
            onClick={() => setShowShareModal(true)}
          >
            <Share2 className="h-3 w-3" />
          </Button>
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-6 w-6 rounded-full p-0 bg-white/90 backdrop-blur-sm">
                  <Avatar
                    className={`h-6 w-6 border-2 ${currentUserRole ? 'border-blue-500' : 'border-gray-200'} transition`}
                    title={user.name + (currentUserRole ? ' (Facilitator)' : '')}
                  >
                    <AvatarImage 
                      src={user.imageUrl || user.image_url || undefined}
                      alt={user.name}
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <AvatarFallback className="text-[8px]">
                      {user.name?.charAt(0)?.toUpperCase() || <User className="h-2 w-2" />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}
      <div ref={boardRef} className={`flex-1 relative bg-white overflow-auto pb-40 ${showLandscapeWarning ? 'pointer-events-none opacity-50' : ''}`} style={{ 
        minHeight: isMobileLandscape ? '100vh' : 'calc(100vh - 120px)'
      }}>
        {!positionsReady && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Preparing layout…</p>
            </div>
          </div>
        )}
        {/* Hidden measurement container to get actual sizes before positioning */}
        <div ref={measurementRef} aria-hidden="true" style={{ position: 'absolute', visibility: 'hidden', pointerEvents: 'none', left: 0, top: 0, width: '100%' }}>
          {items.map((item: any) => {
            const signature = processedItemGroups[item.id];
            const groupSize = signature ? Object.values(itemGroups).filter((sig: any) => sig === signature).length : 0;
            let borderColor = highContrast ? '#000000' : '#e5e7eb';
            if (!highContrast && signature && groupSize > 1 && signatureColors[signature]) {
              borderColor = signatureColors[signature];
            }
            return (
              <div
                key={'m-' + item.id}
                id={'measure-item-' + item.id}
                className={`px-1 md:px-3 py-1 md:py-2 bg-white border rounded shadow text-xs md:text-sm cursor-move select-none relative`}
                style={{
                  minWidth: isMobileLandscape ? 60 : 80,
                  textAlign: 'center',
                  border: `4px solid ${borderColor}`,
                  position: 'absolute',
                  boxSizing: 'border-box',
                  transform: isMobileLandscape ? 'scale(0.3) !important' : 'scale(1)',
                  transformOrigin: 'center',
                }}
              >
                {item.content} <span className="text-xs md:text-xs text-gray-500 inline-flex items-center gap-1">(<CategoryIcon category={item.category as any} retroFormat={retro?.format} />)</span>
              </div>
            );
          })}
        </div>
        {items.map((item: any) => {
          const signature = processedItemGroups[item.id];
          const groupSize = signature ? Object.values(itemGroups).filter((sig: any) => sig === signature).length : 0;
          let borderColor = highContrast ? '#000000' : '#e5e7eb';
          if (!highContrast && signature && groupSize > 1 && signatureColors[signature]) {
            borderColor = signatureColors[signature];
          }
          // Use server-synced positions if available, otherwise use measured layout positions for immediate render
          const pos = itemPositions[item.id] || measuredPositions[item.id];
          if (!pos) return null;
          const isBeingDraggedByOthers = draggingByOthers[item.id];
          const draggingUser = participants.find((p: any) => p.user.id === isBeingDraggedByOthers);
          return (
            <Draggable
              key={item.id}
              position={pos}
              onDrag={(e: any, data: any) => handleDrag(item.id, e, data)}
              onStop={(e: any, data: any) => handleStop(item.id, e, data)}
              bounds="parent"
              disabled={Boolean(isBeingDraggedByOthers && draggingUser && draggingUser.user && draggingUser.user.id !== user?.id)}
            >
              <div
                id={'group-item-' + item.id}
                className={`px-1 md:px-3 py-1 md:py-2 bg-white border rounded shadow text-xs md:text-sm cursor-move select-none relative ${isBeingDraggedByOthers ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
                style={{
                  minWidth: isMobileLandscape ? 60 : 80,
                  textAlign: 'center',
                  zIndex: isBeingDraggedByOthers ? 10 : 2,
                  border: `4px solid ${borderColor}`,
                  transition: 'border-color 0.2s',
                  position: 'absolute',
                  boxSizing: 'border-box',
                  transform: isMobileLandscape ? 'scale(0.3) !important' : 'scale(1)',
                  transformOrigin: 'center',
                }}
              >
                {item.content} <span className="text-xs md:text-xs text-gray-500 inline-flex items-center gap-1">(<CategoryIcon category={item.category as any} retroFormat={retro?.format} />)</span>
                {isBeingDraggedByOthers && draggingUser && (
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {draggingUser.user.name} is dragging
                  </div>
                )}
              </div>
            </Draggable>
          );
        })}
        <div className="h-40" />
      </div>
      
      {/* Footer di luar container yang di-scale */}
      <div className={showLandscapeWarning ? 'pointer-events-none opacity-50' : ''}>
        <RetroFooter
          left={
            <>
              <div className="flex flex-col items-start text-left md:hidden">
                <div className="text-xs md:text-lg font-semibold">Grouping</div>
                <div className="text-[10px] text-gray-500">
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
                  className="flex items-center px-1 py-0.5 text-[10px] md:px-8 md:py-2 md:text-base font-semibold"
                  variant="phasePrimary"
                >
                  Labelling <span className="ml-0.5 md:ml-2">&#8594;</span>
                </Button>
                <PhaseConfirmModal
                  open={showConfirm}
                  onOpenChange={setShowConfirm}
                  title="Has your team finished grouping the ideas?"
                  onConfirm={async () => {
                    setIsLoading(true);
                    try {
                    const sigCount: { [sig: string]: number } = {};
                    (Object.values(itemGroups || {}) as string[]).forEach((sig: string) => { 
                      sigCount[sig] = (sigCount[sig] || 0) + 1; 
                    });

                    if (typeof broadcastPhaseChange === "function") broadcastPhaseChange("labelling");
                    else if (typeof setPhase === "function") setPhase("labelling");
                  } finally {
                    setIsLoading(false); 
                  }
                }}
                  onCancel={() => {}}
                  confirmLabel='Yes'
                  cancelLabel="No"
                />
              {isLoading && (
                <div className="fixed inset-0 bg-black/40 flex flex-col items-center justify-center z-[9999]">
                  <Loader2 className="animate-spin w-10 h-10 text-white" />
                  <span className="mt-2 text-white text-lg">Processing...</span>
                </div>
              )}
              </>
            )
          }
          // participants={participants}
          isCurrentFacilitator={isCurrentFacilitator}
          user={user}
          setShowRoleModal={setShowRoleModal}
          setSelectedParticipant={setSelectedParticipant}
        />
      </div>
    </div>
  );
} 