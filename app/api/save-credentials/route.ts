import { type NextRequest, NextResponse } from "next/server"

// In-memory storage for runtime credentials
let runtimeCredentials: {
  accountSid?: string
  authToken?: string
  phoneNumber?: string
} = {}

export async function POST(request: NextRequest) {
  try {
    const { accountSid, authToken, phoneNumber } = await request.json()

    // Validate format
    if (!accountSid?.startsWith("AC") || accountSid.length !== 34) {
      return NextResponse.json({ error: "Invalid Account SID" }, { status: 400 })
    }

    if (!authToken || authToken.length !== 32) {
      return NextResponse.json({ error: "Invalid Auth Token" }, { status: 400 })
    }

    if (!phoneNumber?.startsWith("+")) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 })
    }

    // Store in runtime memory
    runtimeCredentials = {
      accountSid,
      authToken,
      phoneNumber,
    }

    console.log("Runtime credentials saved successfully")

    return NextResponse.json({
      success: true,
      message: "Credentials saved for this session",
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to save credentials",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    credentials: runtimeCredentials,
    hasCredentials: !!(runtimeCredentials.accountSid && runtimeCredentials.authToken && runtimeCredentials.phoneNumber),
  })
}

// Export function to get credentials for other routes
export function getRuntimeCredentials() {
  return runtimeCredentials
}
