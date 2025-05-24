import { type NextRequest, NextResponse } from "next/server"

// In-memory storage for custom credentials (shared across routes)
let customCredentials: {
  accountSid?: string
  authToken?: string
  phoneNumber?: string
} = {}

export async function POST(request: NextRequest) {
  console.log("=== Make Call API Route Started ===")

  try {
    // Parse request body
    const body = await request.json()
    console.log("Request body:", body)

    const { to } = body
    if (!to) {
      return NextResponse.json(
        {
          success: false,
          error: "Phone number is required",
        },
        { status: 400 },
      )
    }

    // Get credentials from environment or custom credentials
    let accountSid = process.env.TWILIO_ACCOUNT_SID
    let authToken = process.env.TWILIO_AUTH_TOKEN
    let fromNumber = process.env.TWILIO_PHONE_NUMBER
    let credentialSource = "environment"

    if (customCredentials.accountSid && customCredentials.authToken && customCredentials.phoneNumber) {
      accountSid = customCredentials.accountSid
      authToken = customCredentials.authToken
      fromNumber = customCredentials.phoneNumber
      credentialSource = "custom"
      console.log("Using custom credentials")
    } else {
      console.log("Using environment credentials")
    }

    console.log("Credentials check:", {
      hasAccountSid: !!accountSid,
      hasAuthToken: !!authToken,
      hasFromNumber: !!fromNumber,
      credentialSource: credentialSource,
    })

    if (!accountSid || !authToken || !fromNumber) {
      return NextResponse.json(
        {
          success: false,
          error: "Twilio credentials not configured",
          details: "Missing environment variables: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_PHONE_NUMBER",
          suggestion: "Add these environment variables to your Vercel project",
        },
        { status: 500 },
      )
    }

    // Validate credential formats
    if (!accountSid.startsWith("AC") || accountSid.length !== 34) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid Account SID format",
          details: "Account SID must start with 'AC' and be 34 characters long",
        },
        { status: 500 },
      )
    }

    if (authToken.length !== 32) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid Auth Token format",
          details: `Auth Token must be exactly 32 characters, got ${authToken.length}`,
        },
        { status: 500 },
      )
    }

    if (!fromNumber.startsWith("+")) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid phone number format",
          details: "Phone number must start with '+' (E.164 format)",
        },
        { status: 500 },
      )
    }

    // Test authentication first
    console.log("Testing Twilio authentication...")
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64")

    const authTestResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
        "User-Agent": "TwilioCallCenter/1.0",
      },
    })

    if (!authTestResponse.ok) {
      const errorText = await authTestResponse.text()
      console.error("Authentication failed:", errorText)

      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText }
      }

      return NextResponse.json(
        {
          success: false,
          error: "Twilio authentication failed",
          details: errorData.message || "Invalid credentials",
          code: errorData.code,
          twilioStatus: authTestResponse.status,
          suggestion: "Check your Account SID and Auth Token in the Twilio Console",
        },
        { status: 401 },
      )
    }

    console.log("Authentication successful")

    // Get webhook URLs
    const host = request.headers.get("host")
    const protocol = request.headers.get("x-forwarded-proto") || "https"
    const baseUrl = `${protocol}://${host}`

    // Make the call
    console.log("Creating Twilio call...")
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`

    const formData = new URLSearchParams()
    formData.append("To", to)
    formData.append("From", fromNumber)
    formData.append("Url", `${baseUrl}/api/twilio/outbound`)
    formData.append("StatusCallback", `${baseUrl}/api/twilio/status`)

    const callResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    })

    const responseText = await callResponse.text()
    console.log("Twilio call response:", callResponse.status, responseText)

    if (!callResponse.ok) {
      let errorData
      try {
        errorData = JSON.parse(responseText)
      } catch {
        errorData = { message: responseText }
      }

      return NextResponse.json(
        {
          success: false,
          error: "Twilio call creation failed",
          details: errorData.message || "Unknown Twilio error",
          code: errorData.code,
          status: callResponse.status,
        },
        { status: 400 },
      )
    }

    // Parse successful response
    const callData = JSON.parse(responseText)
    console.log("Call created successfully:", callData.sid)

    return NextResponse.json({
      success: true,
      callSid: callData.sid,
      status: callData.status,
      to: callData.to,
      from: callData.from,
      message: "Call initiated successfully",
      credentialSource: credentialSource,
    })
  } catch (error) {
    console.error("Unexpected error in make-call route:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}

export function setCustomCredentials(credentials: { accountSid?: string; authToken?: string; phoneNumber?: string }) {
  customCredentials = credentials
  console.log("Custom credentials set:", customCredentials)
}
