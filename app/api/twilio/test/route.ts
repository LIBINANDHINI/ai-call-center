import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    console.log("=== Twilio Test Endpoint ===")

    // Check environment variables
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const fromNumber = process.env.TWILIO_PHONE_NUMBER

    const envStatus = {
      hasAccountSid: !!accountSid,
      hasAuthToken: !!authToken,
      hasFromNumber: !!fromNumber,
      accountSidFormat: accountSid?.startsWith("AC") || false,
      authTokenLength: authToken?.length || 0,
      authTokenValid: authToken?.length === 32 || false,
      fromNumberFormat: fromNumber?.startsWith("+") || false,
      accountSidValue: accountSid ? `${accountSid.substring(0, 8)}...` : "missing",
      authTokenValue: authToken ? `${authToken.substring(0, 8)}...` : "missing",
      fromNumberValue: fromNumber || "missing",
    }

    console.log("Environment status:", envStatus)

    // Test Twilio API connection directly
    const apiStatus = {
      connectionTest: false,
      error: null as string | null,
      accountInfo: null as any,
      httpStatus: null as number | null,
    }

    if (accountSid && authToken) {
      try {
        console.log("Testing Twilio API connection...")

        const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64")
        console.log("Credentials length:", credentials.length)

        const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
          method: "GET",
          headers: {
            Authorization: `Basic ${credentials}`,
            "User-Agent": "Vercel-Call-Center/1.0",
          },
        })

        apiStatus.httpStatus = response.status
        const responseText = await response.text()
        console.log("API test response status:", response.status)
        console.log("API test response body:", responseText)

        if (response.ok) {
          apiStatus.connectionTest = true
          try {
            apiStatus.accountInfo = JSON.parse(responseText)
            console.log("Twilio API connection successful")
          } catch (parseError) {
            console.error("Failed to parse account info:", parseError)
            apiStatus.error = "Failed to parse account information"
          }
        } else {
          let errorData
          try {
            errorData = JSON.parse(responseText)
          } catch {
            errorData = { message: responseText }
          }
          apiStatus.error = `HTTP ${response.status}: ${errorData.message || "Unknown error"}`
          if (errorData.code) {
            apiStatus.error += ` (Code: ${errorData.code})`
          }
          console.log("Twilio API test failed:", errorData)
        }
      } catch (error: any) {
        apiStatus.error = `Connection error: ${error.message}`
        console.error("Twilio API connection error:", error)
      }
    } else {
      apiStatus.error = "Missing credentials"
    }

    const recommendations = getRecommendations(envStatus, apiStatus)

    return NextResponse.json({
      success: true,
      environment: envStatus,
      api: apiStatus,
      recommendations,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Test endpoint error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Test endpoint failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

function getRecommendations(envStatus: any, apiStatus: any): string[] {
  const recommendations: string[] = []

  if (!envStatus.hasAccountSid) {
    recommendations.push("Add TWILIO_ACCOUNT_SID environment variable")
  } else if (!envStatus.accountSidFormat) {
    recommendations.push("Account SID should start with 'AC'")
  }

  if (!envStatus.hasAuthToken) {
    recommendations.push("Add TWILIO_AUTH_TOKEN environment variable")
  } else if (!envStatus.authTokenValid) {
    recommendations.push(`Auth Token should be 32 characters (currently ${envStatus.authTokenLength})`)
  }

  if (!envStatus.hasFromNumber) {
    recommendations.push("Add TWILIO_PHONE_NUMBER environment variable")
  } else if (!envStatus.fromNumberFormat) {
    recommendations.push("Phone number should start with '+' (E.164 format)")
  }

  if (apiStatus.httpStatus === 401) {
    recommendations.push("Check your Account SID and Auth Token - authentication failed")
  }

  if (apiStatus.httpStatus === 403) {
    recommendations.push("Your Twilio account may be suspended or have insufficient permissions")
  }

  if (recommendations.length === 0 && apiStatus.connectionTest) {
    recommendations.push("✅ All checks passed! Your Twilio setup is working correctly.")
  }

  return recommendations
}
