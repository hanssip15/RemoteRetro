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

export default function NewRetroPage() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: ""
  })
  

   useEffect(() => {
      if (!api.isAuthenticated()) {
          navigate('/login');
        }
    }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("=== FORM SUBMIT TRIGGERED ===")

    // Check if user is authenticated
    const isAuth = api.isAuthenticated();
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    
    console.log('Is authenticated:', isAuth);
    console.log('Token present:', !!token);
    console.log('User data present:', !!userData);
    console.log('Token preview:', token ? token.substring(0, 50) + '...' : 'No token');

    if (!formData.title.trim()) {
      alert("Please enter a title")
      return
    }

    setIsSubmitting(true)

    try {
      console.log("=== CREATING RETRO ===")
      const userJson = JSON.parse(localStorage.getItem("user_data") || "{}")

      const retro = await apiService.createRetro({
        title: formData.title.trim(),
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
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
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
                    value={formData.title}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                  />
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
