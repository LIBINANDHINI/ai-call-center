import { type NextRequest, NextResponse } from "next/server"
import twilio from "twilio"

const VoiceResponse = twilio.twiml.VoiceResponse
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

// In production, this would be stored in a database
const agents = [
  { id: "1", name: "Sarah Johnson", phone: "+1234567890", available: true },
  { id: "2", name: "Mike Chen", phone: "+1234567891", available: true },
  { id: "3", name: "Emily Rodriguez", phone: "+1234567892", available: false },
  { id: "4", name: "David Kim", phone: "+1234567893", available: true },
]

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const callSid = formData.get("CallSid") as string
  const from = formData.get("From") as string

  const url = new URL(request.url)
  const name = url.searchParams.get("name") || "Unknown"
  const age = url.searchParams.get("age") || "Unknown"

  console.log(`Assigning agent for ${name}, age ${age}, call ${callSid}`)

  const twiml = new VoiceResponse()

  // Find available agent
  const availableAgent = agents.find((agent) => agent.available)

  if (!availableAgent) {
    twiml.say(
      {
        voice: "alice",
      },
      "I apologize, but all our agents are currently busy. Please hold while we find someone to assist you.",
    )

    twiml.play("http://com.twilio.music.classical.s3.amazonaws.com/BusyStrings.wav")

    // In production, implement queue logic here
    twiml.redirect("/api/twilio/assign-agent")
  } else {
    // Mark agent as busy (in production, update database)
    availableAgent.available = false

    twiml.say(
      {
        voice: "alice",
      },
      `Perfect! I'm now connecting you to ${availableAgent.name}. Please hold for a moment.`,
    )

    // Log the call (in production, save to database)
    const callLog = {
      id: Date.now().toString(),
      callerName: name,
      age: age,
      phone: from,
      timestamp: new Date().toISOString(),
      assignedAgent: availableAgent.name,
      callSid: callSid,
      status: "in-progress",
    }

    console.log("Call logged:", callLog)

    // Conference the caller with the agent
    const dial = twiml.dial({
      action: "/api/twilio/call-complete",
      method: "POST",
    })

    dial.conference(`call-${callSid}`, {
      startConferenceOnEnter: true,
      endConferenceOnExit: true,
    })

    // Simultaneously call the agent
    try {
      await client.calls.create({
        url: `/api/twilio/agent-connect?conference=call-${callSid}&agent=${availableAgent.id}`,
        to: availableAgent.phone,
        from: process.env.TWILIO_PHONE_NUMBER!,
      })
    } catch (error) {
      console.error("Error calling agent:", error)
      twiml.say("Sorry, we couldn't connect you to an agent right now. Please try again later.")
      twiml.hangup()
    }
  }

  return new NextResponse(twiml.toString(), {
    headers: {
      "Content-Type": "text/xml",
    },
  })
}
