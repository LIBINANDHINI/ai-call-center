import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("=== Outbound TwiML Route ===")

    // Log the incoming request
    const formData = await request.formData()
    console.log("Outbound call webhook received:", {
      CallSid: formData.get("CallSid"),
      From: formData.get("From"),
      To: formData.get("To"),
      CallStatus: formData.get("CallStatus"),
    })

    // Create simple TwiML response
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Hello! This is a test call from our AI call center. Thank you for testing our system. This call will now end. Goodbye!</Say>
    <Pause length="1"/>
    <Hangup/>
</Response>`

    console.log("Returning TwiML:", twimlResponse)

    return new NextResponse(twimlResponse, {
      headers: {
        "Content-Type": "text/xml",
      },
    })
  } catch (error) {
    console.error("Error in outbound TwiML route:", error)

    // Return a simple error TwiML
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Sorry, there was an error processing your call. Goodbye.</Say>
    <Hangup/>
</Response>`

    return new NextResponse(errorTwiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    })
  }
}
