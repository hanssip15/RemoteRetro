"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, Circle, ArrowRight, Users, MessageSquare, Group, Vote, Trophy } from "lucide-react"

interface Session {
  id: number
  name: string
  description: string
  icon: React.ReactNode
  duration: number
  completed: boolean
}

interface SessionManagerProps {
  currentSession: number
  isFacilitator: boolean
  onSessionChange: (sessionId: number) => void
  participantCount: number
}

export function SessionManager({
  currentSession,
  isFacilitator,
  onSessionChange,
  participantCount,
}: SessionManagerProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [nextSession, setNextSession] = useState<number | null>(null)

  const sessions: Session[] = [
    {
      id: 1,
      name: "What Went Well",
      description: "Share positive feedback and successes",
      icon: <MessageSquare className="h-4 w-4" />,
      duration: 10,
      completed: currentSession > 1,
    },
    {
      id: 2,
      name: "What Could Improve",
      description: "Identify areas for improvement",
      icon: <MessageSquare className="h-4 w-4" />,
      duration: 10,
      completed: currentSession > 2,
    },
    {
      id: 3,
      name: "Grouping",
      description: "Group related feedback together",
      icon: <Group className="h-4 w-4" />,
      duration: 8,
      completed: currentSession > 3,
    },
    {
      id: 4,
      name: "Voting",
      description: "Vote on most important groups (3 votes max)",
      icon: <Vote className="h-4 w-4" />,
      duration: 5,
      completed: currentSession > 4,
    },
    {
      id: 5,
      name: "Results & Actions",
      description: "Review results and assign action items",
      icon: <Trophy className="h-4 w-4" />,
      duration: 12,
      completed: currentSession > 5,
    },
  ]

  const currentSessionData = sessions.find((s) => s.id === currentSession)
  const progress = ((currentSession - 1) / sessions.length) * 100

  const handleNextSession = () => {
    if (currentSession < sessions.length) {
      setNextSession(currentSession + 1)
      setShowConfirmModal(true)
    }
  }

  const confirmSessionChange = () => {
    if (nextSession) {
      onSessionChange(nextSession)
      setShowConfirmModal(false)
      setNextSession(null)
    }
  }

  const getSessionStatus = (session: Session) => {
    if (session.completed) return "completed"
    if (session.id === currentSession) return "current"
    return "pending"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-50 border-green-200"
      case "current":
        return "text-blue-600 bg-blue-50 border-blue-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Session Progress</CardTitle>
            <Badge variant="outline" className="flex items-center space-x-1">
              <Users className="h-3 w-3" />
              <span>{participantCount}</span>
            </Badge>
          </div>
          <Progress value={progress} className="mt-2" />
        </CardHeader>
        <CardContent className="space-y-3">
          {sessions.map((session) => {
            const status = getSessionStatus(session)
            return (
              <div
                key={session.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${getStatusColor(status)}`}
              >
                <div className="flex items-center space-x-3">
                  {session.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : session.id === currentSession ? (
                    <Circle className="h-5 w-5 text-blue-600 fill-current" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400" />
                  )}
                  <div className="flex items-center space-x-2">
                    {session.icon}
                    <div>
                      <div className="font-medium">{session.name}</div>
                      <div className="text-sm opacity-75">{session.description}</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {session.duration}min
                  </Badge>
                  {session.id === currentSession && (
                    <Badge className="bg-blue-100 text-blue-800 text-xs">Current</Badge>
                  )}
                </div>
              </div>
            )
          })}

          {isFacilitator && currentSession < sessions.length && (
            <Button onClick={handleNextSession} className="w-full mt-4">
              Next Session: {sessions[currentSession]?.name}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}

          {currentSession === sessions.length && (
            <div className="text-center py-4">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-green-600 font-medium">Retrospective Completed!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Change Confirmation Modal */}
      {showConfirmModal && nextSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Move to Next Session?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-lg font-medium mb-2">
                  {currentSessionData?.name} → {sessions.find((s) => s.id === nextSession)?.name}
                </div>
                <p className="text-sm text-gray-600">
                  Are you sure you want to move to the next session? This action cannot be undone.
                </p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setShowConfirmModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={confirmSessionChange} className="flex-1">
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
