import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const retroId = params.id
    const numericRetroId = Number.parseInt(retroId, 10)
    if (isNaN(numericRetroId)) {
      return NextResponse.json({ error: "Invalid retro ID" }, { status: 400 })
    }

    const body = await request.json()
    const { groupId, participantName } = body

    // Check if user has votes remaining
    const [userVotesResult] = await sql`
      SELECT COALESCE(SUM(votes_count), 0) as votes_used
      FROM votes 
      WHERE retro_id = ${numericRetroId} AND participant_name = ${participantName}
    `

    const votesUsed = Number.parseInt(userVotesResult?.votes_used || "0")
    if (votesUsed >= 3) {
      return NextResponse.json({ error: "Maximum votes reached" }, { status: 400 })
    }

    // Add or increment vote
    const [vote] = await sql`
      INSERT INTO votes (retro_id, group_id, participant_name, votes_count, created_at)
      VALUES (${numericRetroId}, ${groupId}, ${participantName}, 1, NOW())
      ON CONFLICT (retro_id, group_id, participant_name)
      DO UPDATE SET votes_count = votes.votes_count + 1
      RETURNING *
    `

    return NextResponse.json(vote)
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to cast vote" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const retroId = params.id
    const numericRetroId = Number.parseInt(retroId, 10)
    if (isNaN(numericRetroId)) {
      return NextResponse.json({ error: "Invalid retro ID" }, { status: 400 })
    }

    const body = await request.json()
    const { groupId, participantName } = body

    // Decrement or remove vote
    const [result] = await sql`
      UPDATE votes 
      SET votes_count = votes_count - 1
      WHERE retro_id = ${numericRetroId} 
        AND group_id = ${groupId} 
        AND participant_name = ${participantName}
        AND votes_count > 0
      RETURNING *
    `

    if (result && result.votes_count <= 0) {
      await sql`
        DELETE FROM votes 
        WHERE retro_id = ${numericRetroId} 
          AND group_id = ${groupId} 
          AND participant_name = ${participantName}
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to remove vote" }, { status: 500 })
  }
}
