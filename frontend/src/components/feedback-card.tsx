"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Edit2, Trash2, Check, X } from "lucide-react"

interface FeedbackCardProps {
  item: {
    id: string
    content: string
    author: string
    category: string
    createdBy?: string
    isEdited?: boolean
  }
  currentUser: {
    id: string
    name: string
    email: string
  } | null
  userRole: boolean // true for facilitator, false for regular participant
  onUpdate: (id: string, content: string, category: string) => void
  onDelete: (id: string) => void
  getCategoryDisplayName: (category: string) => string
  isUpdating?: boolean
  autoScroll?: boolean
}

export function FeedbackCard({ 
  item, 
  currentUser, 
  userRole, 
  onUpdate, 
  onDelete,
  getCategoryDisplayName,
  isUpdating = false,
  autoScroll = false,
}: FeedbackCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(item.content)
  const [editCategory, setEditCategory] = useState(item.category)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (autoScroll && rootRef.current) {
      try {
        rootRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } catch {}
      return () => {}
    }
  }, [autoScroll])

  // Check if user can edit this item
  const canEdit = userRole || (currentUser && item.createdBy === currentUser.id)

  // Check if user can delete this item
  const canDelete = userRole || (currentUser && item.createdBy === currentUser.id)

  const handleSave = () => {
    const hasChanges = editContent.trim() !== item.content.trim() || editCategory !== item.category
    if (hasChanges && editContent.trim()) {
      onUpdate(item.id.toString(), editContent.trim(), editCategory)
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setEditContent(item.content)
    setEditCategory(item.category)
    setIsEditing(false)
  }

  return (
    <Card ref={rootRef} className={`mb-1 hover:shadow-md transition-all duration-300 ease-in-out ${
      isUpdating ? 'opacity-75 bg-blue-50 border-blue-200' : ''
    }`}>
      <CardContent className="p-2">
        {isEditing ? (
          <div className="space-y-1">
            <div className="flex gap-1">
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="px-1 py-1 border rounded text-xs"
              >
                <option value="format_1">{getCategoryDisplayName("format_1")}</option>
                <option value="format_2">{getCategoryDisplayName("format_2")}</option>
                <option value="format_3">{getCategoryDisplayName("format_3")}</option>
              </select>
            </div>
            <Input
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full h-7 text-xs"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const hasChanges = editContent.trim() !== item.content.trim() || editCategory !== item.category
                  if (hasChanges) {
                    handleSave()
                  } else {
                    e.preventDefault()
                  }
                }
                if (e.key === "Escape") handleCancel()
              }}
            />
            <div className="flex justify-end space-x-1">
              <Button size="icon" variant="outline" className="h-6 w-6 p-0" onClick={handleCancel}>
                <X className="h-3 w-3"/>
              </Button>
              <Button size="icon" className="h-6 w-6 p-0" onClick={handleSave} disabled={editContent.trim() === item.content.trim() && editCategory === item.category}>
                <Check className="h-3 w-3"/>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="min-w-0">
              <div className="text-sm leading-tight break-words flex items-center gap-1 flex-wrap">
                <span>{item.content}</span>
                {item.isEdited && (
                  <span className="text-xs text-gray-500">edited</span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-1 ml-1">
              {canEdit && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsEditing(true)}
                  className="h-6 w-6 p-0"
                  title="Edit item"
                >
                  <Edit2 className="h-3 w-3"/>
                </Button>
              )}
              {canDelete && (
                <Button
                  size="icon"
                  variant="ghost"
                   onClick={() => {
                            if (window.confirm(`Yakin ingin menghapus action item: \"${item.content}\"?`)) {
                              onDelete(item.id);
                            }
                          }}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                  title="Delete item"
                >
                  <Trash2 className="h-3 w-3"/>
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
