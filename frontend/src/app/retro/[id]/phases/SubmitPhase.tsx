import React from 'react';
import { Button } from '@/components/ui/button';
import RetroFooter from './RetroFooter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FeedbackCard } from '@/components/feedback-card';
import { ArrowLeft, Users, Clock, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import RetroHeader from '../RetroHeader';

export default function SubmitPhase(props: any) {
  const {
    retro, participants, user, currentUserRole, showShareModal, setShowShareModal, handleLogout,
    isCurrentFacilitator, setPhase, broadcastPhaseChange,
    currentUserParticipant, inputCategory, setInputCategory, inputText, handleInputTextChange,
    handleKeyDown, isAddingItem, handleAdd, items, getCategoryDisplayName, typingParticipants,
    setShowRoleModal, setSelectedParticipant, updatingItemId, handleUpdateItem, handleDeleteItem
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
      {/* Board */}
      <div className="container mx-auto px-4 py-8 flex-1 pb-56">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Card per kategori */}
          {[0,1,2].map(idx => (
            <Card className="h-fit" key={idx}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {/* Emoji sesuai kategori */}
                  <span role="img" aria-label="cat">{idx === 0 ? '😀' : idx === 1 ? '😢' : '🤔'}</span> {getCategoryDisplayName(`format_${idx+1}`)}
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
        {/* Hanya form input yang putih, tanpa sisa putih di atas */}
        <div className="container mx-auto px-4 pt-7 pb-4 flex flex-row items-center gap-2 bg-white">
          {/* Dropdown assignee */}
          <div className="flex items-center gap-2">
            <label className="font-medium mr-2 mb-1">Category:</label>
            <select
              className="w-32 px-3 pr-8 py-2 rounded-md border text-base"
              value={inputCategory}
              onChange={e => setInputCategory(e.target.value)}
              disabled={isAddingItem}
            >
              <option value="format_1">{getCategoryDisplayName("format_1")}</option>
              <option value="format_2">{getCategoryDisplayName("format_2")}</option>
              <option value="format_3">{getCategoryDisplayName("format_3")}</option>
            </select>
          </div>
          <input
            type="text"
            placeholder="Ex. we have a linter!"
            className="border rounded px-2 py-1 flex-1"
            value={inputText}
            onChange={handleInputTextChange}
            onKeyDown={handleKeyDown}
            disabled={isAddingItem}
          />
          <Button
            onClick={handleAdd}
            disabled={isAddingItem || !inputText.trim()}
            className="px-4 py-1"
            type="submit"
          >
            {isAddingItem ? "Adding..." : "Submit"}
          </Button>
          {isCurrentFacilitator && (
            <Button
              onClick={() => broadcastPhaseChange ? broadcastPhaseChange('grouping') : setPhase && setPhase('grouping')}
              className="px-4 py-1"
              variant="secondary"
            >
              Grouping
            </Button>
          )}
        </div>
      </RetroFooter>
    </div>
  );
} 