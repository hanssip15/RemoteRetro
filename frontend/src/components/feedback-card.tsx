"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Heart, Edit2, Trash2, Check, X } from "lucide-react"

interface FeedbackCardProps {
  item: {
    id: number
    content: string
    author: string
    votes: number
    category: string
  }
  onUpdate: (id: number, content: string) => void
  onDelete: (id: number) => void
  onVote: (id: number) => void
}

export function FeedbackCard({ item, onUpdate, onDelete, onVote }: FeedbackCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(item.content)

  const handleSave = () => {
    if (editContent.trim()) {
      onUpdate(item.id, editContent.trim())
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setEditContent(item.content)
    setIsEditing(false)
  }

  return (
    <Card className="mb-3 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {isEditing ? (
          <div className="space-y-3">
            <Input
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave()
                if (e.key === "Escape") handleCancel()
              }}
            />
            <div className="flex justify-end space-x-2">
              <Button size="sm" variant="outline" onClick={handleCancel}>
                <X className="h-3 w-3" />
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Check className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm mb-3 leading-relaxed">{item.content}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">by {item.author}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onVote(item.id)}
                  className="flex items-center space-x-1 text-red-500 hover:text-red-600"
                >
                  <Heart className="h-3 w-3" />
                  <span className="text-xs">{item.votes}</span>
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)} className="p-1">
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(item.id)}
                  className="p-1 text-red-500 hover:text-red-600"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
