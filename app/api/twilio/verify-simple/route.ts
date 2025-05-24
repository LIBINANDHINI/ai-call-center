import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("=== Simple Credential Verification ===")

    const body = await request.json()
    const { accountSid, authToken, phoneNumber } = body

    // Clean credentials (remove any whitespace)
    const cleanAccountSid = accountSid?.trim() || ""
    const cleanAuthToken = authToken?.trim() || ""
    const cleanPhoneNumber = phoneNumber?.trim() || ""

    console.log("Testing credentials:", {
      accountSidLength: cleanAccountSid.length,
      authTokenLength: cleanAuthToken.length,
      accountSidPrefix: cleanAccountSid.substring(0, 8),
      phoneNumber: cleanPhoneNumber,
    })

    if (!cleanAccountSid || !cleanAuthToken) {
      return NextResponse.json({ error: "Account SID and Auth Token are required" }, { status: 400 })
    }

    // Create basic auth
    const credentials = Buffer.from(`${cleanAccountSid}:${cleanAuthToken}`).toString("base64")

    // Test the credentials
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${cleanAccountSid}.json`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
        "User-Agent": "TwilioTest/1.0",
      },
    })

    const responseText = await response.text()
    console.log("Twilio response:", response.status, responseText)

    if (response.ok) {
      const accountData = JSON.parse(responseText)
      return NextResponse.json({
        success: true,
        valid: true,
        account: {
          sid: accountData.sid,
          name: accountData.friendly_name,
          status: accountData.status,
        },
      })
    } else {
      let errorData
      try {
        errorData = JSON.parse(responseText)
      } catch {
        errorData = { message: responseText, code: response.status }
      }

      return NextResponse.json({
        success: true,
        valid: false,
        error: errorData.message,
        code: errorData.code,
        httpStatus: response.status,
      })
    }
  } catch (error) {
    console.error("Verification error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Verification failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
