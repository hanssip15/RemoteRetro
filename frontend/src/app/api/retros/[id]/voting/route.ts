import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const retroId = params.id
    const { searchParams } = new URL(request.url)
    const userName = searchParams.get("user")

    const numericRetroId = Number.parseInt(retroId, 10)
    if (isNaN(numericRetroId)) {
      return NextResponse.json({ error: "Invalid retro ID" }, { status: 400 })
    }

    // Get groups with vote counts
    const groups = await sql`
      SELECT 
        g.id,
        g.title,
        g.description,
        g.session_sources,
        COUNT(ri.id) as items_count,
        COALESCE(SUM(v.votes_count), 0) as total_votes,
        COALESCE(
          (SELECT SUM(votes_count) FROM votes WHERE group_id = g.id AND participant_name = ${userName}),
          0
        ) as user_votes
      FROM feedback_groups g
      LEFT JOIN retro_items ri ON g.id = ri.group_id
      LEFT JOIN votes v ON g.id = v.group_id
      WHERE g.retro_id = ${numericRetroId}
      GROUP BY g.id
      ORDER BY total_votes DESC, g.created_at ASC
    `

    // Calculate user's remaining votes
    const [userVotesResult] = await sql`
      SELECT COALESCE(SUM(votes_count), 0) as votes_used
      FROM votes 
      WHERE retro_id = ${numericRetroId} AND participant_name = ${userName}
    `

    const votesUsed = Number.parseInt(userVotesResult?.votes_used || "0")
    const userVotesRemaining = Math.max(0, 3 - votesUsed)

    // Get total votes cast
    const [totalVotesResult] = await sql`
      SELECT COALESCE(SUM(votes_count), 0) as total_votes
      FROM votes 
      WHERE retro_id = ${numericRetroId}
    `
    const totalVotesCast = Number.parseInt(totalVotesResult?.total_votes || "0")

    return NextResponse.json({
      groups,
      userVotesRemaining,
      totalVotesCast,
    })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to fetch voting data" }, { status: 500 })
  }
}
