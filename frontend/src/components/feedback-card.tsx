"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Heart, Edit2, Trash2, Check, X } from "lucide-react"

interface FeedbackCardProps {
  item: {
    id: string
    content: string
    author: string
    category: string
    createdBy?: string
  }
  currentUser: {
    id: string
    name: string
    email: string
  } | null
  userRole: boolean // true for facilitator, false for regular participant
  onUpdate: (id: string, content: string) => void
  onDelete: (id: string) => void
}

export function FeedbackCard({ 
  item, 
  currentUser, 
  userRole, 
  onUpdate, 
  onDelete, 
}: FeedbackCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(item.content)

  // Check if user can edit this item
  const canEdit = userRole || (currentUser && item.createdBy === currentUser.id)

  // Check if user can delete this item
  const canDelete = userRole || (currentUser && item.createdBy === currentUser.id)

  const handleSave = () => {
    if (editContent.trim()) {
      onUpdate(item.id.toString(), editContent.trim())
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
              <div className="flex items-center space-x-1">
                {canEdit && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => setIsEditing(true)} 
                    className="p-1"
                    title="Edit item"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                )}
                {canDelete && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(item.id)}
                    className="p-1 text-red-500 hover:text-red-600"
                    title="Delete item"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
