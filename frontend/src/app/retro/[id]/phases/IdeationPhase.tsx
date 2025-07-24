import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import RetroFooter from './RetroFooter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FeedbackCard } from '@/components/feedback-card';
import RetroHeader from '../RetroHeader';
import { PhaseConfirmModal } from '@/components/ui/dialog';
import useEnterToCloseModal from "@/hooks/useEnterToCloseModal";

export default function IdeationPhase(props: any) {
  const {
    retro, participants, user, currentUserRole, showShareModal, setShowShareModal, handleLogout,
    isCurrentFacilitator, setPhase, broadcastPhaseChange,
    inputCategory, setInputCategory, inputText, handleInputTextChange,
    isAddingItem, items, getCategoryDisplayName, typingParticipants,
    setShowRoleModal, setSelectedParticipant, updatingItemId, handleUpdateItem, handleDeleteItem
  } = props;

  const [showModal, setShowModal] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeMobileCategory, setActiveMobileCategory] = useState('format_1');

  useEffect(() => {
    setShowModal(true);
  }, []);

  useEffect(() => {
    if (!isAddingItem) {
      inputRef.current?.focus();
    }
  }, [isAddingItem]);

  useEnterToCloseModal(showModal, () => setShowModal(false));

  // Handler submit yang sudah ada
  const handleAddAndFocus = (...args: any[]) => {
    if (props.handleAdd) {
      props.handleAdd(...args);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Modal Stage Change Idea Generation */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-xl w-full p-8">
            <h2 className="text-2xl font-bold mb-2 text-center">Stage Change: Idea Generation!</h2>
            <div className="mb-4">
              <b>Guidance:</b>
              <ul className="list-disc pl-6 mt-2 text-left">
                <li>Reflect on the events of this past sprint.</li>
                <li>Submit items that made you happy, sad, or just plain confused.</li>
                <li>Be thoughtful and blameless with your language; we're all here to improve.</li>
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
      {/* Board */}
      <div className="container mx-auto px-4 py-8 flex-1 pb-56">
        {/* Mobile: Tab emoji dan list filter */}
        <div className="sm:hidden">
          <div className="flex justify-between items-center mb-2 border-b">
            {['format_1', 'format_2', 'format_3'].map((cat, idx) => (
              <button
                key={cat}
                className={`flex-1 py-2 text-2xl border-b-2 transition-colors ${activeMobileCategory === cat ? 'border-blue-500 bg-blue-50' : 'border-transparent'}`}
                onClick={() => setActiveMobileCategory(cat)}
              >
                {retro?.format === "happy_sad_confused"
                  ? (idx === 0 ? '😀' : idx === 1 ? '😢' : '🤔')
                  : (idx === 0 ? '🟢' : idx === 1 ? '🛑' : '🔄')}
              </button>
            ))}
          </div>
          <div className="bg-white rounded-b-lg shadow p-2">
            {items.filter((item:any) => item.category === activeMobileCategory).map((item:any) => (
              <FeedbackCard
                key={`${item.id}-${item.category}`}
                item={{ ...item, author: item.author || "Anonymous" }}
                currentUser={user}
                userRole={currentUserRole}
                onUpdate={handleUpdateItem}
                onDelete={handleDeleteItem}
                getCategoryDisplayName={getCategoryDisplayName}
                isUpdating={updatingItemId === item.id}
              />
            ))}
            {items.filter((item:any) => item.category === activeMobileCategory).length === 0 && (
              <div className="text-center text-gray-400 py-4">No items yet</div>
            )}
          </div>
        </div>
        {/* Desktop: 3 kolom */}
        <div className="hidden sm:grid lg:grid-cols-3 gap-6">
          {[0,1,2].map(idx => (
            <Card className="h-fit" key={idx}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {/* Emoji sesuai kategori */}
                  <span role="img" aria-label="cat">
                    {retro?.format === "happy_sad_confused"
                      ? (idx === 0 ? '😀' : idx === 1 ? '😢' : '🤔')
                      : (idx === 0 ? '🟢' : idx === 1 ? '🛑' : '🔄')}
                  </span> {getCategoryDisplayName(`format_${idx+1}`)}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4 min-h-[200px]">
                {items.filter((item:any) => item.category === `format_${idx+1}`).map((item:any) => (
                  <FeedbackCard
                    key={`${item.id}-${item.category}`}
                    item={{ ...item, author: item.author || "Anonymous" }}
                    currentUser={user}
                    userRole={currentUserRole}
                    onUpdate={handleUpdateItem}
                    onDelete={handleDeleteItem}
                    getCategoryDisplayName={getCategoryDisplayName}
                    isUpdating={updatingItemId === item.id}
                  />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      {/* Footer modular */}
      <RetroFooter
        title={null}
        center={null}
        right={null}
        participants={participants}
        typingParticipants={typingParticipants}
        isCurrentFacilitator={isCurrentFacilitator}
        user={user}
        setShowRoleModal={setShowRoleModal}
        setSelectedParticipant={setSelectedParticipant}
      >
        {/* Footer form: mobile = vertikal, desktop = horizontal */}
        <div className="container mx-auto px-2 sm:px-4 pt-7 pb-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white">
          {/* Dropdown kategori */}
          <div className="flex items-center gap-2 mb-0">
            <label className="font-medium mr-2 mb-1">Category:</label>
            <select
              className="w-28 max-w-[120px] text-sm sm:text-base py-1 sm:py-2 px-2 sm:px-3 pr-6 sm:pr-8 rounded-md border appearance-none"
              style={{ fontSize: '13px', height: '40px' }}
              value={inputCategory}
              onChange={e => setInputCategory(e.target.value)}
              disabled={isAddingItem}
            >
              <option value="format_1">{getCategoryDisplayName("format_1")}</option>
              <option value="format_2">{getCategoryDisplayName("format_2")}</option>
              <option value="format_3">{getCategoryDisplayName("format_3")}</option>
            </select>
          </div>
          {/* Input + Submit */}
          <div className="flex flex-row gap-2 w-full">
            <input
              ref={inputRef}
              type="text"
              placeholder="Ex. we have a linter!"
              className="border rounded px-2 py-1 flex-1"
              value={inputText}
              onChange={handleInputTextChange}
              onKeyDown={e => {
                if (e.key === 'Enter' && !isAddingItem && inputText.trim()) {
                  handleAddAndFocus();
                } else if (props.handleKeyDown) {
                  props.handleKeyDown(e);
                }
              }}
              disabled={isAddingItem}
            />
            <Button
              onClick={handleAddAndFocus}
              disabled={isAddingItem || !inputText.trim()}
              className="px-4 py-1"
              type="submit"
              variant="phaseSecondary"
            >
              {isAddingItem ? "Adding..." : "Submit"}
            </Button>
          </div>
          {/* Tombol Grouping */}
          {isCurrentFacilitator && (
            <>
              <Button
                onClick={() => setShowConfirm(true)}
                className="flex items-center px-8 py-2 text-base font-semibold w-full sm:w-auto"
                variant="phasePrimary"
                disabled={items.length === 0}
              >
                Grouping <span className="ml-2">&#8594;</span>
              </Button>
              <PhaseConfirmModal
                open={showConfirm}
                onOpenChange={setShowConfirm}
                title="Are you sure you would like to proceed to the idea grouping stage?"
                onConfirm={() => {
                  if (broadcastPhaseChange) broadcastPhaseChange('grouping');
                  else if (setPhase) setPhase('grouping');
                }}
                onCancel={() => {}}
                confirmLabel="Yes"
                cancelLabel="No"
              />
            </>
          )}
        </div>
      </RetroFooter>
    </div>
  );
} 