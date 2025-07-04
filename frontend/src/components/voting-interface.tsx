"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Vote, Heart } from "lucide-react"

interface FeedbackGroup {
  id: number
  title: string
  description: string
  session_sources: string[]
  items_count: number
  total_votes: number
  user_votes: number
}

interface VotingInterfaceProps {
  retroId: string
  userName: string
  onVotingComplete: () => void
  isFacilitator: boolean
}

export function VotingInterface({ retroId, userName, onVotingComplete, isFacilitator }: VotingInterfaceProps) {
  const [groups, setGroups] = useState<FeedbackGroup[]>([])
  const [userVotesRemaining, setUserVotesRemaining] = useState(3)
  const [totalVotesCast, setTotalVotesCast] = useState(0)

  useEffect(() => {
    fetchGroupsWithVotes()
  }, [])

  const fetchGroupsWithVotes = async () => {
    try {
      const response = await fetch(`/api/retros/${retroId}/voting?user=${userName}`)
      if (response.ok) {
        const data = await response.json()
        setGroups(data.groups)
        setUserVotesRemaining(data.userVotesRemaining)
        setTotalVotesCast(data.totalVotesCast)
      }
    } catch (error) {
      console.error("Error fetching voting data:", error)
    }
  }

  const castVote = async (groupId: number) => {
    if (userVotesRemaining <= 0) return

    try {
      const response = await fetch(`/api/retros/${retroId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          participantName: userName,
        }),
      })

      if (response.ok) {
        // Update local state
        setGroups((prev) =>
          prev.map((group) =>
            group.id === groupId
              ? {
                  ...group,
                  total_votes: group.total_votes + 1,
                  user_votes: group.user_votes + 1,
                }
              : group,
          ),
        )
        setUserVotesRemaining((prev) => prev - 1)
        setTotalVotesCast((prev) => prev + 1)
      }
    } catch (error) {
      console.error("Error casting vote:", error)
    }
  }

  const removeVote = async (groupId: number) => {
    const group = groups.find((g) => g.id === groupId)
    if (!group || group.user_votes <= 0) return

    try {
      const response = await fetch(`/api/retros/${retroId}/vote`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          participantName: userName,
        }),
      })

      if (response.ok) {
        // Update local state
        setGroups((prev) =>
          prev.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  total_votes: g.total_votes - 1,
                  user_votes: g.user_votes - 1,
                }
              : g,
          ),
        )
        setUserVotesRemaining((prev) => prev + 1)
        setTotalVotesCast((prev) => prev - 1)
      }
    } catch (error) {
      console.error("Error removing vote:", error)
    }
  }

  const getVotePercentage = (votes: number) => {
    if (totalVotesCast === 0) return 0
    return (votes / totalVotesCast) * 100
  }

  const sortedGroups = [...groups].sort((a, b) => b.total_votes - a.total_votes)

  return (
    <div className="space-y-6">
      {/* Instructions & Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Vote className="h-5 w-5" />
            <span>Voting Session</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{userVotesRemaining}</div>
              <div className="text-sm text-gray-600">Votes Remaining</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{totalVotesCast}</div>
              <div className="text-sm text-gray-600">Total Votes Cast</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{groups.length}</div>
              <div className="text-sm text-gray-600">Groups to Vote On</div>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Vote on the most important groups. You have <strong>3 votes maximum</strong>. You can use all votes on one
            group or distribute them across multiple groups.
          </p>
        </CardContent>
      </Card>

      {/* Voting Groups */}
      <div className="grid gap-4">
        {sortedGroups.map((group, index) => (
          <Card key={group.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold">{group.title}</h3>
                    {index < 3 && (
                      <Badge variant="secondary" className="text-xs">
                        Top {index + 1}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Badge variant="outline" className="text-xs">
                      {group.items_count} items
                    </Badge>
                    {group.session_sources.map((source) => (
                      <Badge key={source} variant="outline" className="text-xs">
                        {source.replace("session_", "Session ")}
                      </Badge>
                    ))}
                  </div>

                  {/* Vote Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Votes received</span>
                      <span className="font-medium">{group.total_votes}</span>
                    </div>
                    <Progress value={getVotePercentage(group.total_votes)} className="h-2" />
                  </div>
                </div>

                {/* Voting Controls */}
                <div className="ml-6 flex flex-col items-center space-y-2">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeVote(group.id)}
                      disabled={group.user_votes <= 0}
                      className="w-8 h-8 p-0"
                    >
                      -
                    </Button>
                    <div className="flex items-center space-x-1 min-w-[60px] justify-center">
                      <Heart className="h-4 w-4 text-red-500" />
                      <span className="font-medium">{group.user_votes}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => castVote(group.id)}
                      disabled={userVotesRemaining <= 0}
                      className="w-8 h-8 p-0"
                    >
                      +
                    </Button>
                  </div>
                  <div className="text-xs text-gray-500 text-center">Your votes</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isFacilitator && (
        <div className="flex justify-end">
          <Button onClick={onVotingComplete} size="lg">
            Complete Voting & View Results
          </Button>
        </div>
      )}
    </div>
  )
}
