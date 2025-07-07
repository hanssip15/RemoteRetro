"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { api, apiService } from "@/services/api"

const RETRO_FORMATS = [
  {
    key: "happy_sad_confused",
    label: "Happy/Sad/Confused",
    description:
      "Standard retro, corresponding for teams new to retrospectives. Ideal for sharing wins, emotions, and pain points to build a growth mindset within the team and drive improvement. Suggested time allotment: 1 hour.",
    icon: "😊",
    suggestedTime: "1 hour",
  },
  {
    key: "start_stop_continue",
    label: "Start/Stop/Continue",
    description:
      "A format focused on the positive brainstorming of possible action items, and honing in on the most key plans to drive change in the team. Suggested time allotment: 45 - 60 minutes.",
    icon: "🚦",
    suggestedTime: "45 - 60 minutes",
  },
]

export default function NewRetroPage() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState("")
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("=== FORM SUBMIT TRIGGERED ===")

    if (!title.trim() || !selectedFormat) {
      alert("Please enter a title and select a format")
      return
    }

    setIsSubmitting(true)

    try {
      console.log("=== CREATING RETRO ===")

      const retro = await apiService.createRetro({
        title: title.trim(),
        // format: selectedFormat,
      })

      console.log("=== RETRO CREATED ===", retro)

      if (!retro || !retro.id) {
        throw new Error("No retro ID returned from API")
      }

      // Generate a facilitator name (could be improved with actual user input)
      const facilitatorName = "Facilitator"

      // Set creator as facilitator in localStorage
      localStorage.setItem(`retro_${retro.id}_user`, facilitatorName)
      localStorage.setItem(`retro_${retro.id}_role`, "facilitator")


      console.log("=== REDIRECTING TO LOBBY ===")
      navigate(`/retro/${retro.id}/lobby`)
    } catch (error) {
      console.error("=== CATCH ERROR ===", error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Error creating retro: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setTitle(e.target.value)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center space-x-4 mb-8">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Create New Retrospective</CardTitle>
              <CardDescription>Set up a new retrospective session for your team</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Retrospective Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g., Sprint 24 Retrospective"
                    value={title}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="mb-6">
                  <Label htmlFor="format">Select Format *</Label>
                  <div className="space-y-4">
                    {RETRO_FORMATS.map((format) => (
                      <div
                        key={format.key}
                        className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all duration-150 ${
                          selectedFormat === format.key
                            ? "border-blue-500 bg-blue-50 shadow"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                        onClick={() => setSelectedFormat(format.key)}
                      >
                        <span className="text-3xl mr-4">{format.icon}</span>
                        <div>
                          <div className="font-semibold">{format.label}</div>
                          <div className="text-gray-500 text-sm">{format.description}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            Suggested time: {format.suggestedTime}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-6">
                  <Link to="/dashboard">
                    <Button variant="outline" disabled={isSubmitting}>
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Retrospective"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
