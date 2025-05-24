import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  console.log("=== Make Call Route Started ===")

  try {
    const { to } = await request.json()

    if (!to) {
      return NextResponse.json(
        {
          success: false,
          error: "Phone number is required",
        },
        { status: 400 },
      )
    }

    // Get credentials from runtime storage first, then environment
    let accountSid = process.env.TWILIO_ACCOUNT_SID
    let authToken = process.env.TWILIO_AUTH_TOKEN
    let fromNumber = process.env.TWILIO_PHONE_NUMBER
    let credentialSource = "environment"

    try {
      // Check for runtime credentials
      const runtimeResponse = await fetch(`${request.nextUrl.origin}/api/save-credentials`, {
        method: "GET",
      })

      if (runtimeResponse.ok) {
        const runtimeData = await runtimeResponse.json()
        if (runtimeData.hasCredentials) {
          accountSid = runtimeData.credentials.accountSid
          authToken = runtimeData.credentials.authToken
          fromNumber = runtimeData.credentials.phoneNumber
          credentialSource = "runtime"
          console.log("Using runtime credentials")
        }
      }
    } catch (error) {
      console.log("Runtime credentials not available, using environment")
    }

    console.log("Credential source:", credentialSource)
    console.log("Credentials check:", {
      hasAccountSid: !!accountSid,
      hasAuthToken: !!authToken,
      hasFromNumber: !!fromNumber,
      accountSidFormat: accountSid?.startsWith("AC"),
      authTokenLength: authToken?.length,
    })

    if (!accountSid || !authToken || !fromNumber) {
      return NextResponse.json(
        {
          success: false,
          error: "Twilio credentials not configured",
          details: "Please configure credentials using the Credential Manager",
          suggestion: "Use the credential manager to set up your Twilio credentials",
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
          details: "Account SID must start with 'AC' and be 34 characters",
          suggestion: "Check your Account SID in the Twilio Console",
        },
        { status: 500 },
      )
    }

    if (authToken.length !== 32) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid Auth Token format",
          details: `Auth Token must be 32 characters, got ${authToken.length}`,
          suggestion: "Check your Auth Token in the Twilio Console",
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
          suggestion: "Use E.164 format like +1234567890",
        },
        { status: 500 },
      )
    }

    // Test authentication first with detailed error handling
    console.log("Testing Twilio authentication...")
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64")

    try {
      const authResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
        method: "GET",
        headers: {
          Authorization: `Basic ${credentials}`,
          "User-Agent": "CallCenter/1.0",
        },
      })

      console.log("Auth test response:", authResponse.status)

      if (!authResponse.ok) {
        const errorText = await authResponse.text()
        console.log("Auth failed response:", errorText)

        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { message: errorText, code: "PARSE_ERROR" }
        }

        // Provide specific error messages based on Twilio error codes
        let userMessage = "Authentication failed"
        let suggestion = "Check your credentials"

        switch (errorData.code) {
          case 20003:
            userMessage = "Authentication failed - Invalid credentials"
            suggestion = "Double-check your Account SID and Auth Token in the Twilio Console"
            break
          case 20404:
            userMessage = "Account not found"
            suggestion = "Verify your Account SID is correct"
            break
          case 20005:
            userMessage = "Account suspended"
            suggestion = "Check your Twilio account status and billing"
            break
          default:
            userMessage = errorData.message || "Authentication failed"
            suggestion = "Verify your Twilio credentials are correct and active"
        }

        return NextResponse.json(
          {
            success: false,
            error: "Twilio authentication failed",
            details: userMessage,
            code: errorData.code,
            httpStatus: authResponse.status,
            suggestion: suggestion,
            credentialSource: credentialSource,
          },
          { status: 401 },
        )
      }

      console.log("Authentication successful")
    } catch (authError) {
      console.error("Auth test network error:", authError)
      return NextResponse.json(
        {
          success: false,
          error: "Authentication test failed",
          details: "Network error connecting to Twilio",
          suggestion: "Check your internet connection and try again",
        },
        { status: 500 },
      )
    }

    // Construct webhook URLs with better error handling
    let webhookUrl = null
    let statusCallbackUrl = null

    try {
      // Try multiple methods to get the base URL
      const host = request.headers.get("host")
      const forwardedHost = request.headers.get("x-forwarded-host")
      const forwardedProto = request.headers.get("x-forwarded-proto")
      const protocol = forwardedProto || (request.nextUrl.protocol === "https:" ? "https" : "http")

      console.log("URL construction debug:", {
        host,
        forwardedHost,
        forwardedProto,
        protocol,
        nextUrlOrigin: request.nextUrl.origin,
        nextUrlHost: request.nextUrl.hostname,
      })

      // Use the most reliable host available
      const finalHost = forwardedHost || host || request.nextUrl.hostname

      if (finalHost && finalHost !== "null" && finalHost !== "localhost") {
        const baseUrl = `${protocol}://${finalHost}`
        webhookUrl = `${baseUrl}/api/twilio-webhook`
        statusCallbackUrl = `${baseUrl}/api/call-status`
        console.log("Constructed webhook URLs:", { webhookUrl, statusCallbackUrl })
      } else {
        console.log("Could not construct reliable webhook URLs, proceeding without webhooks")
      }
    } catch (urlError) {
      console.error("Error constructing webhook URLs:", urlError)
      console.log("Proceeding without webhooks")
    }

    // Create the call with or without webhooks
    console.log("Creating Twilio call...")
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`

    const formData = new URLSearchParams()
    formData.append("To", to)
    formData.append("From", fromNumber)

    // Only add webhook URLs if they were successfully constructed
    if (webhookUrl && !webhookUrl.includes("null")) {
      formData.append("Url", webhookUrl)
      console.log("Using webhook URL:", webhookUrl)
    } else {
      // Use a simple TwiML that just says hello and hangs up
      formData.append(
        "Twiml",
        `<Response><Say voice="alice">Hello! This is a test call from our AI call center. Thank you for testing our system. Goodbye!</Say><Hangup/></Response>`,
      )
      console.log("Using inline TwiML instead of webhook")
    }

    if (statusCallbackUrl && !statusCallbackUrl.includes("null")) {
      formData.append("StatusCallback", statusCallbackUrl)
      console.log("Using status callback URL:", statusCallbackUrl)
    } else {
      console.log("Skipping status callback due to URL construction issues")
    }

    console.log("Final call parameters:", Object.fromEntries(formData.entries()))

    try {
      const callResponse = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      })

      const responseText = await callResponse.text()
      console.log("Call response:", callResponse.status, responseText)

      if (!callResponse.ok) {
        let errorData
        try {
          errorData = JSON.parse(responseText)
        } catch {
          errorData = { message: responseText, code: "PARSE_ERROR" }
        }

        // Provide specific error messages for common Twilio errors
        let userMessage = errorData.message || "Unknown Twilio error"
        let suggestion = "Check the phone number format and your Twilio account limits"

        switch (errorData.code) {
          case 21205:
            userMessage = "Invalid webhook URL"
            suggestion = "The webhook URL could not be constructed. This is a deployment issue."
            break
          case 21212:
            userMessage = "Invalid phone number"
            suggestion = "Check that the phone number is in E.164 format (+1234567890)"
            break
          case 21214:
            userMessage = "Invalid 'To' phone number"
            suggestion = "The destination phone number is not valid or not reachable"
            break
          case 21215:
            userMessage = "Account not authorized for this phone number"
            suggestion = "Your Twilio account may not be authorized to call this number"
            break
          case 21216:
            userMessage = "Account not authorized for international calls"
            suggestion = "Enable international calling in your Twilio account settings"
            break
          case 21217:
            userMessage = "Phone number not verified"
            suggestion = "For trial accounts, verify the destination phone number in Twilio Console"
            break
          case 21218:
            userMessage = "Invalid application SID"
            suggestion = "Check your TwiML application configuration"
            break
          case 21219:
            userMessage = "Invalid method"
            suggestion = "Check the HTTP method for your webhook URL"
            break
          case 21220:
            userMessage = "Invalid URL"
            suggestion = "The webhook URL is not accessible or invalid"
            break
        }

        return NextResponse.json(
          {
            success: false,
            error: "Call creation failed",
            details: userMessage,
            code: errorData.code,
            httpStatus: callResponse.status,
            suggestion: suggestion,
            webhookInfo: {
              webhookUrl: webhookUrl || "not set",
              statusCallbackUrl: statusCallbackUrl || "not set",
              usingInlineTwiml: !webhookUrl,
            },
          },
          { status: 400 },
        )
      }

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
        webhookInfo: {
          webhookUrl: webhookUrl || "inline TwiML used",
          statusCallbackUrl: statusCallbackUrl || "not set",
          usingInlineTwiml: !webhookUrl,
        },
      })
    } catch (callError) {
      console.error("Call creation network error:", callError)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create call",
          details: "Network error creating call",
          suggestion: "Check your internet connection and try again",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
