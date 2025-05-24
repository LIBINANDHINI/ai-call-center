import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("=== Testing Custom Credentials ===")

    const body = await request.json()
    const { accountSid, authToken, phoneNumber } = body

    if (!accountSid || !authToken || !phoneNumber) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 })
    }

    // Validate credential formats
    const credentialAnalysis = {
      accountSid: {
        present: !!accountSid,
        value: accountSid,
        length: accountSid.length,
        format: accountSid.startsWith("AC"),
        valid: accountSid.startsWith("AC") && accountSid.length === 34,
      },
      authToken: {
        present: !!authToken,
        value: `${authToken.substring(0, 8)}...${authToken.substring(authToken.length - 4)}`,
        length: authToken.length,
        valid: authToken.length === 32,
      },
      phoneNumber: {
        present: !!phoneNumber,
        value: phoneNumber,
        length: phoneNumber.length,
        format: phoneNumber.startsWith("+"),
        valid: phoneNumber.startsWith("+") && phoneNumber.length >= 10 && phoneNumber.length <= 16,
      },
    }

    // Test API connection
    const apiTest = {
      attempted: true,
      successful: false,
      error: null as string | null,
      httpStatus: null as number | null,
      accountInfo: null as any,
      phoneNumbers: [] as any[],
    }

    try {
      console.log("Testing custom credentials with detailed logging...")

      // Trim any whitespace from credentials
      const cleanAccountSid = accountSid.trim()
      const cleanAuthToken = authToken.trim()
      const cleanPhoneNumber = phoneNumber.trim()

      console.log("Cleaned credentials:", {
        accountSidLength: cleanAccountSid.length,
        authTokenLength: cleanAuthToken.length,
        phoneNumberLength: cleanPhoneNumber.length,
        accountSidPrefix: cleanAccountSid.substring(0, 8),
        phoneNumber: cleanPhoneNumber,
      })

      const credentials = Buffer.from(`${cleanAccountSid}:${cleanAuthToken}`).toString("base64")
      console.log("Generated credentials string length:", credentials.length)

      // Test account access with more detailed headers
      const accountResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${cleanAccountSid}.json`, {
        method: "GET",
        headers: {
          Authorization: `Basic ${credentials}`,
          "User-Agent": "Vercel-Call-Center/1.0",
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      })

      apiTest.httpStatus = accountResponse.status
      const accountResponseText = await accountResponse.text()

      console.log("Custom credentials test response:", {
        status: accountResponse.status,
        statusText: accountResponse.statusText,
        headers: Object.fromEntries(accountResponse.headers.entries()),
        bodyLength: accountResponseText.length,
        bodyPreview: accountResponseText.substring(0, 200),
      })

      if (accountResponse.ok) {
        apiTest.successful = true
        apiTest.accountInfo = JSON.parse(accountResponseText)

        // Get phone numbers with the cleaned credentials
        try {
          const phoneResponse = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${cleanAccountSid}/IncomingPhoneNumbers.json`,
            {
              method: "GET",
              headers: {
                Authorization: `Basic ${credentials}`,
                "User-Agent": "Vercel-Call-Center/1.0",
                Accept: "application/json",
              },
            },
          )

          if (phoneResponse.ok) {
            const phoneData = await phoneResponse.json()
            apiTest.phoneNumbers = phoneData.incoming_phone_numbers || []
          }
        } catch (phoneError) {
          console.log("Phone number fetch failed:", phoneError)
        }
      } else {
        let errorData
        try {
          errorData = JSON.parse(accountResponseText)
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError)
          errorData = {
            message: accountResponseText || "Unknown error",
            code: accountResponse.status,
          }
        }
        apiTest.error = `${errorData.message} (Code: ${errorData.code})`

        // Add specific debugging for 401 errors
        if (accountResponse.status === 401) {
          console.error("401 Authentication Error Details:", {
            accountSidValid: cleanAccountSid.startsWith("AC") && cleanAccountSid.length === 34,
            authTokenValid: cleanAuthToken.length === 32,
            credentialsEncoding: credentials.substring(0, 20) + "...",
            possibleIssues: [
              "Account SID or Auth Token is incorrect",
              "Auth Token may have been regenerated",
              "Account may be suspended",
              "Credentials may have extra whitespace",
            ],
          })
        }
      }
    } catch (error: any) {
      apiTest.error = `Connection error: ${error.message}`
      console.error("Custom credentials test error:", error)
    }

    // Generate recommendations
    const recommendations = []

    if (!credentialAnalysis.accountSid.valid) {
      recommendations.push("❌ Account SID must start with 'AC' and be 34 characters")
    } else {
      recommendations.push("✅ Account SID format is correct")
    }

    if (!credentialAnalysis.authToken.valid) {
      recommendations.push("❌ Auth Token must be exactly 32 characters")
    } else {
      recommendations.push("✅ Auth Token format is correct")
    }

    if (!credentialAnalysis.phoneNumber.valid) {
      recommendations.push("❌ Phone number must start with '+' and be 10-16 characters")
    } else {
      recommendations.push("✅ Phone number format is correct")
    }

    if (apiTest.successful) {
      recommendations.push("✅ Custom credentials work! API connection successful")

      // Check if phone number exists in account
      const numberExists = apiTest.phoneNumbers.some((phone) => phone.phone_number === phoneNumber)
      if (numberExists) {
        recommendations.push(`✅ Phone number ${phoneNumber} found in account`)
      } else {
        recommendations.push(`❌ Phone number ${phoneNumber} not found in account`)
        if (apiTest.phoneNumbers.length > 0) {
          recommendations.push("Available numbers: " + apiTest.phoneNumbers.map((p) => p.phone_number).join(", "))
        }
      }
    } else {
      recommendations.push(`❌ API connection failed: ${apiTest.error}`)
    }

    return NextResponse.json({
      success: true,
      credentials: credentialAnalysis,
      api: apiTest,
      recommendations,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Custom credential test error:", error)
    return NextResponse.json(
      {
        error: "Test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
