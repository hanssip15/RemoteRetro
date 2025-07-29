"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { api, apiService, User } from "@/services/api"

const RETRO_FORMATS = [
  {
    key: "happy_sad_confused",
    label: "Happy/Sad/Confused",
    description:
      "Standard retro, corresponding for teams new to retrospectives. Ideal for sharing wins, emotions, and pain points to build a growth mindset within the team and drive improvement. Suggested time allotment: 1 hour.",
    icon: "😊",
    suggestedTime: "1 hour",
    value: "happy_sad_confused",
  },
  {
    key: "start_stop_continue",
    label: "Start/Stop/Continue",
    description:
      "A format focused on the positive brainstorming of possible action items, and honing in on the most key plans to drive change in the team. Suggested time allotment: 45 - 60 minutes.",
    icon: "🚦",
    suggestedTime: "45 - 60 minutes",
    value: "start_stop_continue",
  },
]

export default function NewRetroPage() {
  
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState("")
  const [selectedFormat, setSelectedFormat] = useState<string>("happy_sad_confused")
  const [user, setUser] = useState<User>()

   useEffect(() => {
  const fetchUser = async () => {
    try {
        const userData = await api.getCurrentUser();
        if (!userData) {
          api.removeAuthToken(); // optional logout
          navigate('/login');
        return;
        }

        setUser(userData);

    } catch (err) {
      console.error(err);
      // setError('Failed to fetch user. Please try again.');
      await api.removeAuthToken();
      navigate('/login');
    }
  };

  fetchUser();
}, []);

  useEffect(() => {
    const authStatus = api.isAuthenticated()

    if (!authStatus) {
      navigate('/login')
    }
  }, []) // Remove navigate dependency to prevent re-runs

  // Prevent unwanted navigation during form submission
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSubmitting) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isSubmitting])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()


    // Jika title kosong, isi dengan tanggal
    let finalTitle = title.trim();
    if (!finalTitle) {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      finalTitle = `Retro ${yyyy}-${mm}-${dd}`;
    }

    // Check if format is valid (not just default)
    const validFormats = ['happy_sad_confused', 'start_stop_continue']
    const isValidFormat = selectedFormat && validFormats.includes(selectedFormat)
    if (!isValidFormat) {
      alert("Please select a valid format")
      return
    }


    setIsSubmitting(true)

    try {

      if (!user) {
        throw new Error("User data not found. Please login again.")
      } 

      const retro = await apiService.createRetro({
        title: finalTitle,
        format: selectedFormat,
        createdBy: user.id,
        facilitator: user.id 
      })

      if (!retro || !retro.id) {
        throw new Error("No retro ID returned from API")
      }
      

      await apiService.addParticipant(retro.id, { 
        userId: user.id,
        role: true,
        isActive: true
      });

      navigate(`/retro/${retro.id}`)
    } catch (error) {

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Error creating retro: ${errorMessage}`)
      // Don't redirect on error, let user stay on the form
    } finally {

      setIsSubmitting(false)
    }
  }

  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };
  

  const handleFormatSelect = (key: string) => {

    setSelectedFormat(key);
  };


   return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-full sm:max-w-2xl mx-auto">
          <div className="flex items-center space-x-2 sm:space-x-4 mb-6 sm:mb-8">
            <Link to="/dashboard" onClick={(e) => {
              if (isSubmitting) {
                e.preventDefault()
                return
              }
            }}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">Create New Retrospective</CardTitle>
              <CardDescription className="text-sm sm:text-base">Set up a new retrospective session for your team</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6" noValidate>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="title" className="text-sm sm:text-base">Retrospective Title (optional)</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g., Sprint 24 Retrospective (optional - press Enter to submit)"
                    value={title}
                    onChange={handleTitleChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        e.stopPropagation()
                        // Check if format is selected and not submitting
                        const validFormats = ['happy_sad_confused', 'start_stop_continue']
                        const isValidFormat = selectedFormat && validFormats.includes(selectedFormat)
                        if (isValidFormat && !isSubmitting) {
                          // Trigger form submission by clicking the submit button
                          const submitButton = e.currentTarget.closest('form')?.querySelector('button[type="submit"]') as HTMLButtonElement
                          if (submitButton && !submitButton.disabled) {
                            submitButton.click()
                          }
                        } else {
                          // Show validation message
                          if (!isValidFormat) {
                            alert("Please select a valid format")
                          } else if (isSubmitting) {
                            alert("Please wait, form is being submitted")
                          }
                        }
                      }
                    }}
                    required
                    disabled={isSubmitting}
                    className="text-sm sm:text-base px-2 sm:px-4 py-2 sm:py-2"
                  />
                  {selectedFormat && ['happy_sad_confused', 'start_stop_continue'].includes(selectedFormat) && !title.trim() && (
                    <div className="text-xs sm:text-sm text-gray-500">
                      Title will be auto-generated if empty
                    </div>
                  )}
                </div>

                <div className="mb-4 sm:mb-6">
                  <Label htmlFor="format" className="text-sm sm:text-base">Select Format *</Label>
                  <div className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2">
                    {selectedFormat ? `Selected: ${RETRO_FORMATS.find(f => f.key === selectedFormat)?.label}` : "Please select a format"}
                  </div>
                  <div className="space-y-2 sm:space-y-4">
                    {RETRO_FORMATS.map((format) => (
                      <div
                        key={format.key}
                        className={`flex items-center p-2 sm:p-4 rounded-lg border cursor-pointer transition-all duration-150 ${
                          selectedFormat === format.key
                            ? "border-blue-500 bg-blue-50 shadow"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                        onClick={() => handleFormatSelect(format.key)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            handleFormatSelect(format.key)
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label={`Select ${format.label} format`}
                      >
                        <span className="text-xl sm:text-3xl mr-2 sm:mr-4">{format.icon}</span>
                        <div>
                          <div className="font-semibold text-sm sm:text-base">{format.label}</div>
                          <div className="text-xs sm:text-sm text-gray-500 max-w-[220px] sm:max-w-full">{format.description}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            Suggested time: {format.suggestedTime}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-4 pt-4 sm:pt-6 items-center sm:items-end w-full">
                  <Link to="/dashboard" onClick={(e) => {
                    if (isSubmitting) {
                      e.preventDefault()
                      return
                    }
                  }} className="w-full sm:w-auto">
                    <Button 
                      variant="outline" 
                      disabled={isSubmitting}
                      className="w-full sm:w-auto"
                      onClick={(e) => {
                        if (isSubmitting) {
                          e.preventDefault()
                          return
                        }
                      }}
                    >
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
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

