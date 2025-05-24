import { type NextRequest, NextResponse } from "next/server"
import twilio from "twilio"

const VoiceResponse = twilio.twiml.VoiceResponse

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const from = formData.get("From") as string
  const to = formData.get("To") as string
  const callSid = formData.get("CallSid") as string

  console.log(`Incoming call from ${from} to ${to}, CallSid: ${callSid}`)

  const twiml = new VoiceResponse()

  // AI greeting with gather for caller name
  const gather = twiml.gather({
    input: "speech",
    action: "/api/twilio/gather-name",
    method: "POST",
    speechTimeout: "auto",
    language: "en-US",
  })

  gather.say(
    {
      voice: "alice",
    },
    "Hello! Welcome to our AI call center. Please tell me your name.",
  )

  // Fallback if no input
  twiml.say("I didn't catch that. Please call back and try again.")
  twiml.hangup()

  return new NextResponse(twiml.toString(), {
    headers: {
      "Content-Type": "text/xml",
    },
  })
}
