import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const retroId = params.id
    const numericRetroId = Number.parseInt(retroId, 10)
    if (isNaN(numericRetroId)) {
      return NextResponse.json({ error: "Invalid retro ID" }, { status: 400 })
    }

    const groups = await sql`
      SELECT 
        g.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', ri.id,
              'content', ri.content,
              'session_phase', ri.session_phase,
              'created_at', ri.created_at,
              'edited_at', ri.edited_at
            )
          ) FILTER (WHERE ri.id IS NOT NULL), 
          '[]'
        ) as items
      FROM feedback_groups g
      LEFT JOIN retro_items ri ON g.id = ri.group_id
      WHERE g.retro_id = ${numericRetroId}
      GROUP BY g.id
      ORDER BY g.created_at ASC
    `

    return NextResponse.json(groups)
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to fetch groups" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const retroId = params.id
    const numericRetroId = Number.parseInt(retroId, 10)
    if (isNaN(numericRetroId)) {
      return NextResponse.json({ error: "Invalid retro ID" }, { status: 400 })
    }

    const body = await request.json()
    const { title, description } = body

    const [group] = await sql`
      INSERT INTO feedback_groups (retro_id, title, description, session_sources, created_at)
      VALUES (${numericRetroId}, ${title}, ${description || ""}, '{}', NOW())
      RETURNING *
    `

    return NextResponse.json(group, { status: 201 })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to create group" }, { status: 500 })
  }
}
