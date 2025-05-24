import { type NextRequest, NextResponse } from "next/server"
import twilio from "twilio"

const VoiceResponse = twilio.twiml.VoiceResponse

export async function POST(request: NextRequest) {
  const url = new URL(request.url)
  const conference = url.searchParams.get("conference")
  const agentId = url.searchParams.get("agent")

  console.log(`Agent ${agentId} accepted call, joining conference ${conference}`)

  const twiml = new VoiceResponse()

  twiml.say(
    {
      voice: "alice",
    },
    "Connecting you now.",
  )

  twiml.dial().conference(conference!, {
    startConferenceOnEnter: false,
    endConferenceOnExit: true,
  })

  return new NextResponse(twiml.toString(), {
    headers: {
      "Content-Type": "text/xml",
    },
  })
}
