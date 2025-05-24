import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  console.log("=== Twilio Webhook Hit ===")

  try {
    const formData = await request.formData()
    const callSid = formData.get("CallSid")
    const from = formData.get("From")
    const to = formData.get("To")

    console.log("Webhook data:", { callSid, from, to })

    // Create TwiML response
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Hello! This is a test call from our AI call center. Thank you for testing our system. This call will now end. Goodbye!</Say>
    <Pause length="1"/>
    <Hangup/>
</Response>`

    console.log("Returning TwiML:", twiml)

    return new NextResponse(twiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    })
  } catch (error) {
    console.error("Webhook error:", error)

    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Sorry, there was an error. Goodbye.</Say>
    <Hangup/>
</Response>`

    return new NextResponse(errorTwiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    })
  }
}
