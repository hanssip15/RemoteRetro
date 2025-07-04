import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const retroId = params.id

    if (retroId === "new") {
      return NextResponse.json({ error: "Invalid route" }, { status: 400 })
    }

    const numericRetroId = Number.parseInt(retroId, 10)
    if (isNaN(numericRetroId)) {
      return NextResponse.json({ error: "Invalid retro ID" }, { status: 400 })
    }

    // Get retro details
    const [retro] = await sql`
      SELECT * FROM retros WHERE id = ${numericRetroId}
    `

    if (!retro) {
      return NextResponse.json({ error: "Retro not found" }, { status: 404 })
    }

    // Check if role column exists
    const roleColumnExists = await sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'participants' AND column_name = 'role'
      ) as has_role_column
    `

    let participants

    if (roleColumnExists[0]?.has_role_column) {
      // Role column exists, select it
      participants = await sql`
        SELECT id, name, role, joined_at 
        FROM participants 
        WHERE retro_id = ${numericRetroId}
        ORDER BY joined_at ASC
      `
    } else {
      // Role column doesn't exist, select without it and add default
      participants = await sql`
        SELECT id, name, joined_at 
        FROM participants 
        WHERE retro_id = ${numericRetroId}
        ORDER BY joined_at ASC
      `
      // Add role property manually (first participant is facilitator)
      participants = participants.map((p, index) => ({
        ...p,
        role: index === 0 ? "facilitator" : "participant",
      }))
    }

    return NextResponse.json({
      retro,
      participants,
    })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to fetch lobby data" }, { status: 500 })
  }
}
