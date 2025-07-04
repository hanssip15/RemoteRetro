import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  try {
    const { itemId } = params

    // Validate that itemId is a number
    const numericItemId = Number.parseInt(itemId, 10)
    if (isNaN(numericItemId)) {
      return NextResponse.json({ error: "Invalid item ID" }, { status: 400 })
    }

    const [item] = await sql`
      UPDATE retro_items 
      SET votes = votes + 1
      WHERE id = ${numericItemId}
      RETURNING *
    `

    return NextResponse.json(item)
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to vote" }, { status: 500 })
  }
}
