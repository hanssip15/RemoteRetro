"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { FeedbackCardV2 } from "./feedback-card-v2"
import { Plus, Group, Trash2 } from "lucide-react"

interface FeedbackItem {
  id: number
  content: string
  session_phase: number
  group_id?: number
  created_at: string
  edited_at?: string
}

interface FeedbackGroup {
  id: number
  title: string
  description: string
  session_sources: string[]
  items: FeedbackItem[]
}

interface GroupingInterfaceProps {
  retroId: string
  feedbackItems: FeedbackItem[]
  onGroupingComplete: () => void
  isFacilitator: boolean
}

export function GroupingInterface({
  retroId,
  onGroupingComplete,
  isFacilitator,
}: GroupingInterfaceProps) {
  const [groups, setGroups] = useState<FeedbackGroup[]>([])
  const [ungroupedItems, setUngroupedItems] = useState<FeedbackItem[]>([])
  const [newGroupTitle, setNewGroupTitle] = useState("")
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)



  const createGroup = async () => {
    if (!newGroupTitle.trim()) return

    try {
      const response = await fetch(`/api/retros/${retroId}/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newGroupTitle.trim(),
          description: "",
        }),
      })

      if (response.ok) {
        const newGroup = await response.json()
        setGroups((prev) => [...prev, { ...newGroup, items: [] }])
        setNewGroupTitle("")
        setIsCreatingGroup(false)
      }
    } catch (error) {
      console.error("Error creating group:", error)
    }
  }

  const addItemToGroup = async (itemId: number, groupId: number) => {
    try {
      const response = await fetch(`/api/retros/${retroId}/items/${itemId}/group`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId }),
      })

      if (response.ok) {
        // Move item from ungrouped to group
        const item = ungroupedItems.find((i) => i.id === itemId)
        if (item) {
          setUngroupedItems((prev) => prev.filter((i) => i.id !== itemId))
          setGroups((prev) =>
            prev.map((group) =>
              group.id === groupId ? { ...group, items: [...group.items, { ...item, group_id: groupId }] } : group,
            ),
          )
        }
      }
    } catch (error) {
      console.error("Error adding item to group:", error)
    }
  }

  const removeItemFromGroup = async (itemId: number, groupId: number) => {
    try {
      const response = await fetch(`/api/retros/${retroId}/items/${itemId}/group`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: null }),
      })

      if (response.ok) {
        // Move item from group to ungrouped
        const group = groups.find((g) => g.id === groupId)
        const item = group?.items.find((i) => i.id === itemId)
        if (item) {
          setGroups((prev) =>
            prev.map((g) => (g.id === groupId ? { ...g, items: g.items.filter((i) => i.id !== itemId) } : g)),
          )
          setUngroupedItems((prev) => [...prev, { ...item, group_id: undefined }])
        }
      }
    } catch (error) {
      console.error("Error removing item from group:", error)
    }
  }

  const deleteGroup = async (groupId: number) => {
    try {
      const response = await fetch(`/api/retros/${retroId}/groups/${groupId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        // Move all items back to ungrouped
        const group = groups.find((g) => g.id === groupId)
        if (group) {
          const itemsToMove = group.items.map((item) => ({ ...item, group_id: undefined }))
          setUngroupedItems((prev) => [...prev, ...itemsToMove])
          setGroups((prev) => prev.filter((g) => g.id !== groupId))
        }
      }
    } catch (error) {
      console.error("Error deleting group:", error)
    }
  }

  const getSessionSources = (items: FeedbackItem[]) => {
    const sources = new Set(items.map((item) => `session_${item.session_phase}`))
    return Array.from(sources)
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Group className="h-5 w-5" />
            <span>Grouping Session</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Group related feedback items together. Drag items into groups or create new groups as needed. Each group
            will show which sessions contributed to it.
          </p>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Ungrouped Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Ungrouped Items
              <Badge variant="secondary">{ungroupedItems.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ungroupedItems.map((item) => (
              <div key={item.id} className="relative">
                <FeedbackCardV2
                  item={{
                    ...item,
                    votes: 0,
                    type: "",
                    session_phase: item.session_phase ?? 0,
                    created_at: item.created_at ?? "",
                  }}
                  onUpdate={() => {}} // Read-only during grouping
                  onDelete={() => {}} // Read-only during grouping
                  showSessionBadge={true}
                  isEditable={false}
                />
                {isFacilitator && (
                  <div className="absolute top-2 right-2">
                    <select
                      className="text-xs border rounded px-2 py-1"
                      onChange={(e) => {
                        const groupId = Number.parseInt(e.target.value)
                        if (groupId) addItemToGroup(item.id, groupId)
                      }}
                      defaultValue=""
                    >
                      <option value="">Add to group...</option>
                      {groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ))}
            {ungroupedItems.length === 0 && (
              <p className="text-center text-gray-500 py-4">All items have been grouped</p>
            )}
          </CardContent>
        </Card>

        {/* Groups */}
        <div className="space-y-4">
          {/* Create New Group */}
          {isFacilitator && (
            <Card>
              <CardContent className="p-4">
                {isCreatingGroup ? (
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Group title..."
                      value={newGroupTitle}
                      onChange={(e) => setNewGroupTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && createGroup()}
                      autoFocus
                    />
                    <Button onClick={createGroup} size="sm">
                      Create
                    </Button>
                    <Button variant="outline" onClick={() => setIsCreatingGroup(false)} size="sm">
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" onClick={() => setIsCreatingGroup(true)} className="w-full border-dashed">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Group
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Existing Groups */}
          {groups.map((group) => (
            <Card key={group.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{group.title}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">{group.items.length} items</Badge>
                    {isFacilitator && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteGroup(group.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex space-x-1">
                  {getSessionSources(group.items).map((source) => (
                    <Badge key={source} variant="outline" className="text-xs">
                      {source.replace("session_", "Session ")}
                    </Badge>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {group.items.map((item) => (
                  <div key={item.id} className="relative">
                    <FeedbackCardV2
                      item={{
                        ...item,
                        votes: 0,
                        type: "",
                        session_phase: item.session_phase ?? 0,
                        created_at: item.created_at ?? "",
                      }}
                      onUpdate={() => {}}
                      onDelete={() => {}}
                      showSessionBadge={true}
                      isEditable={false}
                    />
                    {isFacilitator && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItemFromGroup(item.id, group.id)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
                {group.items.length === 0 && (
                  <p className="text-center text-gray-500 py-4 text-sm">No items in this group yet</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {isFacilitator && (
        <div className="flex justify-end">
          <Button onClick={onGroupingComplete} size="lg">
            Complete Grouping & Continue to Voting
          </Button>
        </div>
      )}
    </div>
  )
}
