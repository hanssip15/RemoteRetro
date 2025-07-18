"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Circle, ArrowRight } from "lucide-react"

interface Phase {
  id: string
  name: string
  description: string
  duration: number
  completed: boolean
}

interface PhaseManagerProps {
  isFacilitator: boolean
  onPhaseChange: (phase: Phase) => void
}

export function PhaseManager({ isFacilitator, onPhaseChange }: PhaseManagerProps) {
  const [phases, setPhases] = useState<Phase[]>([
    {
      id: "brainstorm",
      name: "Brainstorming",
      description: "Add your feedback items",
      duration: 10,
      completed: false,
    },
    {
      id: "voting",
      name: "Voting",
      description: "Vote on important items",
      duration: 5,
      completed: false,
    },
    {
      id: "discussion",
      name: "Discussion",
      description: "Discuss top voted items",
      duration: 15,
      completed: false,
    },
    {
      id: "actions",
      name: "Action Items",
      description: "Define next steps",
      duration: 10,
      completed: false,
    },
  ])

  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0)
  // const currentPhase = phases[currentPhaseIndex]

  const moveToNextPhase = () => {
    if (currentPhaseIndex < phases.length - 1) {
      const updatedPhases = [...phases]
      updatedPhases[currentPhaseIndex].completed = true
      setPhases(updatedPhases)

      const nextIndex = currentPhaseIndex + 1
      setCurrentPhaseIndex(nextIndex)
      onPhaseChange(updatedPhases[nextIndex])
    }
  }

  const jumpToPhase = (index: number) => {
    if (isFacilitator) {
      setCurrentPhaseIndex(index)
      onPhaseChange(phases[index])
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Retro Phases</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {phases.map((phase, index) => (
          <div
            key={phase.id}
            className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
              index === currentPhaseIndex
                ? "bg-blue-50 border-blue-200"
                : phase.completed
                  ? "bg-green-50 border-green-200"
                  : "bg-gray-50 border-gray-200"
            } ${isFacilitator ? "cursor-pointer hover:bg-opacity-80" : ""}`}
            onClick={() => jumpToPhase(index)}
          >
            <div className="flex items-center space-x-3">
              {phase.completed ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : index === currentPhaseIndex ? (
                <Circle className="h-5 w-5 text-blue-600 fill-current" />
              ) : (
                <Circle className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <div className="font-medium">{phase.name}</div>
                <div className="text-sm text-gray-600">{phase.description}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">{phase.duration}min</Badge>
              {index === currentPhaseIndex && <Badge className="bg-blue-100 text-blue-800">Current</Badge>}
            </div>
          </div>
        ))}

        {isFacilitator && currentPhaseIndex < phases.length - 1 && (
          <Button onClick={moveToNextPhase} className="w-full mt-4">
            Next Phase
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
