import { useEffect, useState } from 'react';
import RetroFooter from './RetroFooter';
import { Button } from '@/components/ui/button';
import RetroHeader from '../RetroHeader';
import { getCategoryEmoji } from '@/lib/utils';
import useEnterToCloseModal from "@/hooks/useEnterToCloseModal";
import { ChevronLeft, ChevronRight } from 'lucide-react';


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
                  <ChevronRight className="h-5 w-5 text-gray-600" />
                ) : (
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                )}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[calc(85vh-280px)] p-4">
              <div className="flex flex-col gap-2">
                {actionItems.length === 0 && <span className="text-gray-400 text-sm">No action items yet.</span>}
                {actionItems.map((item: any, idx: number) => (
                  <div key={idx} className="bg-gray-50 border rounded px-3 py-2 text-sm flex items-center justify-between gap-2">
                    <div className="flex-1 flex flex-col">
                      <span>
                        {item.task} <span className="text-gray-700">({item.assigneeName})</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop: Labelling Items */}
          <div className="hidden md:block">
            <div className="flex-1 overflow-y-auto max-h-[calc(100vh-240px)] flex flex-row flex-wrap gap-8 p-8 w-full justify-center">
              {labellingItems && labellingItems.length > 0 ? (
                labellingItems.sort((a: any, b: any) => b.votes - a.votes).map((group: any) => (
                  <div key={group.id} className="bg-white border rounded-lg shadow-sm w-full sm:max-w-[350px] px-4 py-3">
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
                        <div key={idx} className="bg-gray-50 border rounded px-3 py-2 text-sm">
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 flex-shrink-0">{item.item ? getCategoryEmoji(item.item.format_type, retro.format) : null}</span>
                            <span className="break-words flex-1">{item.item ? item.item.content : 'No item'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-400 text-sm">No items to display.</div>
              )}
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
                    <div className="flex flex-col gap-2">
                      {labellingItems && labellingItems.length > 0 ? (
                        labellingItems.sort((a: any, b: any) => b.votes - a.votes).map((group: any) => (
                          <div key={group.id} className="bg-white border rounded-lg shadow-sm p-3">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-sm font-semibold text-gray-400">{group.label || 'Unlabeled'}</span>
                              <div className="bg-gray-100 text-gray-700 font-bold px-2 py-1 rounded text-xs">
                                {group.votes || 0}
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              {group.group_items.map((item: any, idx: number) => (
                                <div key={idx} className="bg-gray-50 border rounded px-2 py-1 text-xs">
                                  <div className="flex items-start gap-2">
                                    <span className="mt-0.5 flex-shrink-0 text-xs">{getCategoryEmoji(item.item.format_type, retro.format)}</span>
                                    <span className="break-words flex-1">{item.item.content}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-400 text-sm text-center py-4">
                          <p>No labelling items available</p>
                        </div>
                      )}
                    </div>
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
                <div className="flex flex-col gap-2">
                  {actionItems.length === 0 && <span className="text-gray-400 text-sm">No action items yet.</span>}
                  {actionItems.map((item: any, idx: number) => (
                    <div key={idx} className="bg-gray-50 border rounded px-3 py-2 text-sm flex items-center justify-between gap-2">
                      <div className="flex-1 flex flex-col">
                        <span>
                          {item.task} <span className="text-gray-700">({item.assigneeName})</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
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