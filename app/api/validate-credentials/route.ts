import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { accountSid, authToken, phoneNumber } = await request.json()

    // Validate format first
    if (!accountSid?.startsWith("AC") || accountSid.length !== 34) {
      return NextResponse.json({
        success: true,
        valid: false,
        error: "Invalid Account SID format",
      })
    }

    if (!authToken || authToken.length !== 32) {
      return NextResponse.json({
        success: true,
        valid: false,
        error: "Invalid Auth Token format",
      })
    }

    if (!phoneNumber?.startsWith("+")) {
      return NextResponse.json({
        success: true,
        valid: false,
        error: "Invalid phone number format",
      })
    }

    // Test authentication with Twilio
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64")

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
        "User-Agent": "CredentialValidator/1.0",
      },
    })

    if (response.ok) {
      const accountData = await response.json()
      return NextResponse.json({
        success: true,
        valid: true,
        account: {
          sid: accountData.sid,
          name: accountData.friendly_name,
          status: accountData.status,
          type: accountData.type,
        },
      })
    } else {
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText }
      }

      return NextResponse.json({
        success: true,
        valid: false,
        error: errorData.message || "Authentication failed",
        code: errorData.code,
        httpStatus: response.status,
      })
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Validation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
