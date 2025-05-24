import { type NextRequest, NextResponse } from "next/server"
import { setCustomCredentials } from "../make-call/route"

// In-memory storage for custom credentials (shared across routes)
let customCredentials: {
  accountSid?: string
  authToken?: string
  phoneNumber?: string
} = {}

export async function POST(request: NextRequest) {
  try {
    console.log("=== Updating Custom Credentials ===")

    const body = await request.json()
    const { accountSid, authToken, phoneNumber } = body

    if (!accountSid || !authToken || !phoneNumber) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 })
    }

    // Validate formats
    if (!accountSid.startsWith("AC") || accountSid.length !== 34) {
      return NextResponse.json({ error: "Invalid Account SID format" }, { status: 400 })
    }

    if (authToken.length !== 32) {
      return NextResponse.json({ error: "Invalid Auth Token format" }, { status: 400 })
    }

    if (!phoneNumber.startsWith("+") || phoneNumber.length < 10 || phoneNumber.length > 16) {
      return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 })
    }

    // Store credentials in shared storage
    customCredentials = {
      accountSid,
      authToken,
      phoneNumber,
    }

    // Also update the make-call route's storage
    try {
      setCustomCredentials(customCredentials)
    } catch (error) {
      console.log("Note: Could not sync with make-call route storage")
    }

    console.log("Custom credentials updated successfully")

    return NextResponse.json({
      success: true,
      message: "Credentials updated successfully",
    })
  } catch (error) {
    console.error("Error updating credentials:", error)
    return NextResponse.json(
      {
        error: "Failed to update credentials",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    credentials: customCredentials,
  })
}
