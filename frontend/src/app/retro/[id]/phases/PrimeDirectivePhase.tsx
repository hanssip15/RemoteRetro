import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import RetroFooter from './RetroFooter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import RetroHeader from '../RetroHeader';
import { PhaseConfirmModal } from '@/components/ui/dialog';
import useEnterToCloseModal from "@/hooks/useEnterToCloseModal";

export default function PrimeDirectivePhase(props: any) {
  const {
    retro, participants, user, currentUserRole, showShareModal, setShowShareModal, handleLogout,
    isCurrentFacilitator, setPhase, broadcastPhaseChange,
    typingParticipants,
    setShowRoleModal, setSelectedParticipant
  } = props;

  const [showModal, setShowModal] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    setShowModal(true);
  }, []);

  useEnterToCloseModal(showModal, () => setShowModal(false));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Modal Stage Change Prime Directive */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-xl w-full p-8">
            <h2 className="text-2xl font-bold mb-2 text-center">Stage Change: The Prime Directive!</h2>
            <p className="mb-4 text-center">
              <a
                href="https://retromat.org/en/?id=prime-directive"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                Norm Kerth's Prime Directive
              </a>{' '}
              sets the stage for every retrospective, such that the time spent is as constructive as possible.
            </p>
            <div className="mb-4">
              <b>Guidance:</b>
              <ul className="list-disc pl-6 mt-2 text-left">
                <li>Solicit a volunteer to read the Prime Directive aloud.</li>
                <li>Ask each member of the team if they can agree to the Prime Directive.</li>
                <li>
                  <b>Note:</b> If someone earnestly <i>cannot</i> agree, there are likely trust issues on the team that should be addressed with a manager.
                </li>
                <li>Once the team has agreed to the Prime Directive, advance to Idea Generation.</li>
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
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 flex-1 flex items-center justify-center">
        <Card className="w-auto max-w-lg px-8 mb-40 mx-auto">
          <CardHeader className="flex flex-col items-center px-0 pt-8 pb-0">
            <CardTitle className="text-center text-2xl w-full mb-8">The Prime Directive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <hr className="mb-8 w-1/2 mx-auto" />
              <div className="text-lg text-gray-800 text-center leading-relaxed" style={{ whiteSpace: 'pre-line' }}>
{`Regardless of what we discover,
we understand and truly believe
that everyone did the best job they could,
given what they knew at the time,
their skills and abilities,
the resources available,
and the situation at hand.`}
              </div>
              <div className="mt-8 text-sm text-gray-600 text-center">
                <p>Take a moment to reflect on this principle before we begin our retrospective.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
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
        <div className="container mx-auto px-3 pt-7 pb-4 flex flex-row items-center justify-center gap-4 bg-white">
          {isCurrentFacilitator && (
            <>
              <Button
                onClick={() => setShowConfirm(true)}
                className="flex items-center px-8 py-2 text-base font-semibold"
                size="lg"
                variant="phasePrimary"
              >
                Begin Ideation Phase <span className="ml-2">&#8594;</span>
              </Button>
              <PhaseConfirmModal
                open={showConfirm}
                onOpenChange={setShowConfirm}
                title="Is everyone ready to begin?"
                onConfirm={() => {
                  if (broadcastPhaseChange) broadcastPhaseChange('ideation');
                  else if (setPhase) setPhase('ideation');
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