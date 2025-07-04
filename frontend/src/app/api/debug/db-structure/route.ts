import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    // Check tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `

    // Check participants table structure
    const participantsColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'participants' 
      ORDER BY ordinal_position
    `

    // Check constraints
    const constraints = await sql`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints 
      WHERE table_name = 'participants'
    `

    // Sample participants data
    const sampleParticipants = await sql`
      SELECT * FROM participants LIMIT 5
    `

    return NextResponse.json({
      tables: tables.map((t) => t.table_name),
      participantsColumns,
      constraints,
      sampleParticipants,
      status: "Database structure check completed",
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
