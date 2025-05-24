import { NextResponse } from "next/server"

export async function GET() {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER

    const hasValidCredentials = !!(
      accountSid?.startsWith("AC") &&
      accountSid.length === 34 &&
      authToken?.length === 32 &&
      phoneNumber?.startsWith("+")
    )

    return NextResponse.json({
      success: true,
      hasValidCredentials,
      details: {
        accountSid: !!accountSid,
        authToken: !!authToken,
        phoneNumber: !!phoneNumber,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check credentials",
      },
      { status: 500 },
    )
  }
}
