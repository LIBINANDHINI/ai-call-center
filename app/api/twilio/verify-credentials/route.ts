import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    console.log("=== Twilio Credential Verification ===")

    // Get environment variables
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const fromNumber = process.env.TWILIO_PHONE_NUMBER

    // Detailed credential analysis
    const credentialAnalysis = {
      accountSid: {
        present: !!accountSid,
        value: accountSid
          ? `${accountSid.substring(0, 8)}...${accountSid.substring(accountSid.length - 4)}`
          : "missing",
        length: accountSid?.length || 0,
        format: accountSid?.startsWith("AC") || false,
        valid: accountSid?.startsWith("AC") && accountSid.length === 34,
      },
      authToken: {
        present: !!authToken,
        value: authToken ? `${authToken.substring(0, 8)}...${authToken.substring(authToken.length - 4)}` : "missing",
        length: authToken?.length || 0,
        valid: authToken?.length === 32,
      },
      phoneNumber: {
        present: !!fromNumber,
        value: fromNumber || "missing",
        format: fromNumber?.startsWith("+") || false,
        length: fromNumber?.length || 0,
        valid: fromNumber?.startsWith("+") && fromNumber.length >= 10 && fromNumber.length <= 16,
      },
    }

    console.log("Credential analysis:", credentialAnalysis)

    // Test API connection if credentials look valid
    const apiTest = {
      attempted: false,
      successful: false,
      error: null as string | null,
      httpStatus: null as number | null,
      accountInfo: null as any,
      phoneNumbers: [] as any[],
    }

    if (credentialAnalysis.accountSid.valid && credentialAnalysis.authToken.valid) {
      try {
        console.log("Testing API connection...")
        apiTest.attempted = true

        const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64")

        // Test 1: Get account information
        const accountResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
          method: "GET",
          headers: {
            Authorization: `Basic ${credentials}`,
            "User-Agent": "Vercel-Call-Center/1.0",
          },
        })

        apiTest.httpStatus = accountResponse.status
        const accountResponseText = await accountResponse.text()

        console.log("Account API response:", accountResponse.status, accountResponseText)

        if (accountResponse.ok) {
          apiTest.successful = true
          apiTest.accountInfo = JSON.parse(accountResponseText)

          // Test 2: Get phone numbers
          try {
            const phoneResponse = await fetch(
              `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers.json`,
              {
                method: "GET",
                headers: {
                  Authorization: `Basic ${credentials}`,
                  "User-Agent": "Vercel-Call-Center/1.0",
                },
              },
            )

            if (phoneResponse.ok) {
              const phoneData = await phoneResponse.json()
              apiTest.phoneNumbers = phoneData.incoming_phone_numbers || []
              console.log("Found phone numbers:", apiTest.phoneNumbers.length)
            }
          } catch (phoneError) {
            console.log("Phone number fetch failed:", phoneError)
          }
        } else {
          const errorData = JSON.parse(accountResponseText)
          apiTest.error = `${errorData.message} (Code: ${errorData.code})`
        }
      } catch (error: any) {
        apiTest.error = `Connection error: ${error.message}`
        console.error("API test error:", error)
      }
    }

    // Generate recommendations
    const recommendations = []

    if (!credentialAnalysis.accountSid.present) {
      recommendations.push("❌ Add TWILIO_ACCOUNT_SID environment variable")
    } else if (!credentialAnalysis.accountSid.format) {
      recommendations.push("❌ Account SID must start with 'AC'")
    } else if (!credentialAnalysis.accountSid.valid) {
      recommendations.push(`❌ Account SID should be 34 characters (currently ${credentialAnalysis.accountSid.length})`)
    } else {
      recommendations.push("✅ Account SID format is correct")
    }

    if (!credentialAnalysis.authToken.present) {
      recommendations.push("❌ Add TWILIO_AUTH_TOKEN environment variable")
    } else if (!credentialAnalysis.authToken.valid) {
      recommendations.push(`❌ Auth Token must be 32 characters (currently ${credentialAnalysis.authToken.length})`)
    } else {
      recommendations.push("✅ Auth Token format is correct")
    }

    if (!credentialAnalysis.phoneNumber.present) {
      recommendations.push("❌ Add TWILIO_PHONE_NUMBER environment variable")
    } else if (!credentialAnalysis.phoneNumber.format) {
      recommendations.push("❌ Phone number must start with '+' (E.164 format)")
    } else if (!credentialAnalysis.phoneNumber.valid) {
      recommendations.push(`❌ Phone number format invalid (${credentialAnalysis.phoneNumber.length} characters)`)
    } else {
      recommendations.push("✅ Phone number format is correct")
    }

    if (apiTest.attempted) {
      if (apiTest.successful) {
        recommendations.push("✅ API connection successful")
        if (apiTest.accountInfo) {
          recommendations.push(`✅ Account: ${apiTest.accountInfo.friendly_name} (${apiTest.accountInfo.status})`)
        }
        if (apiTest.phoneNumbers.length > 0) {
          recommendations.push(`✅ Found ${apiTest.phoneNumbers.length} phone number(s)`)

          // Check if the configured phone number exists
          const configuredNumber = credentialAnalysis.phoneNumber.value
          const numberExists = apiTest.phoneNumbers.some((phone) => phone.phone_number === configuredNumber)

          if (numberExists) {
            recommendations.push(`✅ Configured phone number ${configuredNumber} found in account`)
          } else {
            recommendations.push(`❌ Configured phone number ${configuredNumber} not found in account`)
            recommendations.push("Available numbers: " + apiTest.phoneNumbers.map((p) => p.phone_number).join(", "))
          }
        } else {
          recommendations.push("⚠️ No phone numbers found in account")
        }
      } else {
        recommendations.push(`❌ API connection failed: ${apiTest.error}`)
      }
    }

    return NextResponse.json({
      success: true,
      credentials: credentialAnalysis,
      api: apiTest,
      recommendations,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Credential verification error:", error)
    return NextResponse.json(
      {
        error: "Verification failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
