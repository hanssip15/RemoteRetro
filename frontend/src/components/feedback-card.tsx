"use client"

import { useState } from "react"
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
}

export function FeedbackCard({ 
  item, 
  currentUser, 
  userRole, 
  onUpdate, 
  onDelete,
  getCategoryDisplayName,
  isUpdating = false,
}: FeedbackCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(item.content)
  const [editCategory, setEditCategory] = useState(item.category)

  // Check if user can edit this item
  const canEdit = userRole || (currentUser && item.createdBy === currentUser.id)

  // Check if user can delete this item
  const canDelete = userRole || (currentUser && item.createdBy === currentUser.id)

  const handleSave = () => {
    if (editContent.trim()) {
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
    <Card className={`mb-3 hover:shadow-md transition-all duration-300 ease-in-out ${
      isUpdating ? 'opacity-75 bg-blue-50 border-blue-200' : ''
    }`}>
      <CardContent className="p-4">
        {isEditing ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="px-3 py-2 border rounded text-sm"
              >
                <option value="format_1">{getCategoryDisplayName("format_1")}</option>
                <option value="format_2">{getCategoryDisplayName("format_2")}</option>
                <option value="format_3">{getCategoryDisplayName("format_3")}</option>
              </select>
            </div>
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
          <div className="flex items-start justify-between w-full">
            <div>
              <p className="text-sm leading-relaxed">{item.content}</p>
              {item.isEdited && (
                <span className="text-xs text-gray-500 ml-2 flex-shrink-0">edited</span>
              )}
            </div>
            <div className="flex items-center space-x-1 ml-4">
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
                  onClick={() =>{ 
                    alert(`Yakin ingin menghapus ${item.content}`);
                    onDelete(item.id);
                  }}
                  className="p-1 text-red-500 hover:text-red-600"
                  title="Delete item"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
