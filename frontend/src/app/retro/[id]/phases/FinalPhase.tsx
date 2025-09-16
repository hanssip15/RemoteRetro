import { useEffect, useState } from 'react';
import RetroFooter from './RetroFooter';
import { Button } from '@/components/ui/button';
import RetroHeader from '../RetroHeader';
import useEnterToCloseModal from "@/hooks/useEnterToCloseModal";
import { PhaseModal, LabellingItemsDisplay, ActionItemsDisplay } from '@/components/shared';


export default function FinalPhase({
  retro,
  participants,
  user,
  currentUserRole,
  showShareModal,
  setShowShareModal,
  handleLogout,
  actionItems,
  typingParticipants,
  isCurrentFacilitator,
  setShowRoleModal,
  setSelectedParticipant,
  labellingItems
}: any) {
  // Tambahkan state modal
  const [showModal, setShowModal] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    setShowModal(true);
  }, []);

  useEnterToCloseModal(showModal, () => setShowModal(false));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Modal Stage Change Final/Closed */}
      <PhaseModal
        isVisible={showModal}
        onClose={() => setShowModal(false)}
        title="The Retrospective Has Been Closed!"
      >
        <p className="text-center">
          The facilitator has closed the retro and distributed the action items via email. You can stick around and review the board, or revisit this retro and all action items generated via your{' '}
          <a href="/dashboard" className="text-blue-600 underline">retro dashboard</a>.
        </p>
      </PhaseModal>
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
        isSidebarCollapsed ? 'flex-col md:grid md:grid-cols-[1fr_400px]' : 'flex-row md:grid md:grid-cols-[1fr_400px]'
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
                title={isSidebarCollapsed ? "Show items sidebar" : "Hide items sidebar"}
              >
                {isSidebarCollapsed ? (
                  <span className="text-gray-600">▶</span>
                ) : (
                  <span className="text-gray-600">◀</span>
                )}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[calc(85vh-280px)] p-4">
              <ActionItemsDisplay
                actionItems={actionItems}
                isMobile={true}
                isEditable={false}
              />
            </div>
          </div>

          {/* Desktop: Labelling Items */}
          <div className="hidden md:block">
            <div className="flex-1 overflow-y-auto max-h-[calc(100vh-240px)] flex flex-row flex-wrap gap-8 p-8 w-full justify-center">
              <LabellingItemsDisplay
                labellingItems={labellingItems}
                retro={retro}
                isMobile={false}
                showVotes={true}
              />
            </div>
          </div>
        </div>

        {/* Panel kanan - Mobile: Labelling Items (Sidebar), Desktop: Action Items */}
        {(!isSidebarCollapsed || window.innerWidth >= 768) && (
          <div className={`bg-white flex flex-col h-full overflow-hidden min-h-0 md:w-[400px] transition-all duration-300 ${
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
                    <LabellingItemsDisplay
                      labellingItems={labellingItems}
                      retro={retro}
                      isMobile={true}
                      showVotes={true}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Desktop: Action Items */}
            <div className="hidden md:block">
              <div className="flex items-center gap-2 mb-2 sticky top-0 z-10 bg-white">
                <span className="text-2xl">🚀</span>
                <span className="text-xl font-semibold">Action Items</span>
              </div>
              <hr className="mb-4" />
              <div className="flex-1 overflow-y-auto max-h-[calc(95vh-260px)]">
                <ActionItemsDisplay
                  actionItems={actionItems}
                  isMobile={false}
                  isEditable={false}
                />
              </div>
            </div>
          </div>
        )}
      </div>
      <RetroFooter
        left={<div className="text-xl font-semibold text-left">This retro is all wrapped up!</div>}
        title={null}
        center={<div className="hidden md:text-gray-600">Contents are read-only.</div>}
        right={<div className="flex flex-row items-center gap-2">
          <Button className="flex items-center px-1 py-1 text-xs md:px-8 md:py-2 md:text-base font-semibold" style={{ minWidth: 160 }} onClick={() => window.location.href = '/dashboard'} variant="phasePrimary">Dashboard <span className="ml-2">&rarr;</span></Button>
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