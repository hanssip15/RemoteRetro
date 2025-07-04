import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(request: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  try {
    const { itemId } = params

    // Validate that itemId is a number
    const numericItemId = Number.parseInt(itemId, 10)
    if (isNaN(numericItemId)) {
      return NextResponse.json({ error: "Invalid item ID" }, { status: 400 })
    }

    const body = await request.json()
    const { content } = body

    const [item] = await sql`
      UPDATE retro_items 
      SET content = ${content}
      WHERE id = ${numericItemId}
      RETURNING *
    `

    return NextResponse.json(item)
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  try {
    const { itemId } = params

    // Validate that itemId is a number
    const numericItemId = Number.parseInt(itemId, 10)
    if (isNaN(numericItemId)) {
      return NextResponse.json({ error: "Invalid item ID" }, { status: 400 })
    }

    await sql`
      DELETE FROM retro_items WHERE id = ${numericItemId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 })
  }
}
