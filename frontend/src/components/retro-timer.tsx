"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, Clock } from "lucide-react"

interface RetroTimerProps {
  duration: number // in minutes
  onTimeUp?: () => void
  phase: string
}

export function RetroTimer({ duration, onTimeUp, phase }: RetroTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration * 60) // convert to seconds
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false)
            onTimeUp?.()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [isRunning, timeLeft, onTimeUp])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const resetTimer = () => {
    setTimeLeft(duration * 60)
    setIsRunning(false)
  }

  const getTimerColor = () => {
    const percentage = (timeLeft / (duration * 60)) * 100
    if (percentage > 50) return "text-green-600"
    if (percentage > 20) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center">
          <Clock className="h-4 w-4 mr-2" />
          {phase} Timer
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-center">
          <div className={`text-3xl font-mono font-bold mb-4 ${getTimerColor()}`}>{formatTime(timeLeft)}</div>
          <div className="flex justify-center space-x-2">
            <Button size="sm" variant="outline" onClick={() => setIsRunning(!isRunning)} disabled={timeLeft === 0}>
              {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button size="sm" variant="outline" onClick={resetTimer}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
