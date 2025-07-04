"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { User } from "lucide-react"

interface JoinNameModalProps {
  onJoin: (name: string) => void
  isJoining: boolean
  error?: string
}

export function JoinNameModal({ onJoin, isJoining, error }: JoinNameModalProps) {
  const [name, setName] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onJoin(name.trim())
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <User className="h-6 w-6 text-indigo-600" />
          </div>
          <CardTitle>Join Retrospective</CardTitle>
          <CardDescription>Enter your name to join the retrospective session</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isJoining}
                autoFocus
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isJoining || !name.trim()}>
              {isJoining ? "Joining..." : "Join Retro"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
