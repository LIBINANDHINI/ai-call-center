import { type NextRequest, NextResponse } from "next/server"
import twilio from "twilio"

const VoiceResponse = twilio.twiml.VoiceResponse

export async function POST(request: NextRequest) {
  const url = new URL(request.url)
  const conference = url.searchParams.get("conference")
  const agentId = url.searchParams.get("agent")

  console.log(`Connecting agent ${agentId} to conference ${conference}`)

  const twiml = new VoiceResponse()

  twiml.say(
    {
      voice: "alice",
    },
    "You have an incoming call from a customer. Press any key to accept.",
  )

  const gather = twiml.gather({
    numDigits: 1,
    action: `/api/twilio/agent-accept?conference=${conference}&agent=${agentId}`,
    method: "POST",
  })

  gather.say("Press any key to join the call.")

  // If no response, hang up
  twiml.say("No response received. Call ended.")
  twiml.hangup()

  return new NextResponse(twiml.toString(), {
    headers: {
      "Content-Type": "text/xml",
    },
  })
}
