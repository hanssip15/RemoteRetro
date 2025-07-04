"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"

interface AddFeedbackFormProps {
  type: string
  onAdd: (content: string, author: string) => void
}

export function AddFeedbackForm({ type, onAdd }: AddFeedbackFormProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [content, setContent] = useState("")
  const [author, setAuthor] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (content.trim() && author.trim()) {
      onAdd(content.trim(), author.trim())
      setContent("")
      setAuthor("")
      setIsAdding(false)
    }
  }

  const handleCancel = () => {
    setContent("")
    setAuthor("")
    setIsAdding(false)
  }

  if (!isAdding) {
    return (
      <Button
        variant="outline"
        className="w-full border-dashed border-2 py-8 text-gray-500 hover:text-gray-700 bg-transparent"
        onClick={() => setIsAdding(true)}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add feedback
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 border-2 border-dashed rounded-lg">
      <Input
        placeholder="Your feedback..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
        autoFocus
      />
      <Input placeholder="Your name" value={author} onChange={(e) => setAuthor(e.target.value)} required />
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm">
          Add
        </Button>
      </div>
    </form>
  )
}
