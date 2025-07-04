"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Edit2, Trash2, Check, X, Clock } from "lucide-react"

interface FeedbackCardV2Props {
  item: {
    id: number
    content: string
    votes: number
    type: string
    session_phase: number
    edited_at?: string
    created_at: string
  }
  onUpdate: (id: number, content: string) => void
  onDelete: (id: number) => void
  showSessionBadge?: boolean
  isEditable?: boolean
}

export function FeedbackCardV2({
  item,
  onUpdate,
  onDelete,
  showSessionBadge = false,
  isEditable = true,
}: FeedbackCardV2Props) {
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

  const getSessionBadgeColor = (phase: number) => {
    switch (phase) {
      case 1:
        return "bg-green-100 text-green-800"
      case 2:
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getSessionLabel = (phase: number) => {
    switch (phase) {
      case 1:
        return "Went Well"
      case 2:
        return "Improve"
      default:
        return `Session ${phase}`
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    })
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
            <div className="flex items-start justify-between mb-3">
              <p className="text-sm leading-relaxed flex-1">{item.content}</p>
              {showSessionBadge && (
                <Badge className={`ml-2 text-xs ${getSessionBadgeColor(item.session_phase)}`}>
                  {getSessionLabel(item.session_phase)}
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                {item.edited_at && (
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>Edited {formatTime(item.edited_at)}</span>
                  </div>
                )}
              </div>

              {isEditable && (
                <div className="flex items-center space-x-1">
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
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
