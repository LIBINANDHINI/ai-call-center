import { type NextRequest, NextResponse } from "next/server"
import twilio from "twilio"

const VoiceResponse = twilio.twiml.VoiceResponse

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const speechResult = formData.get("SpeechResult") as string
  const callSid = formData.get("CallSid") as string
  const from = formData.get("From") as string

  const url = new URL(request.url)
  const name = url.searchParams.get("name") || "Unknown"

  console.log(`Age gathered: ${speechResult} for ${name} from call ${callSid}`)

  const twiml = new VoiceResponse()

  if (speechResult) {
    // Verify details and transfer to agent
    twiml.say(
      {
        voice: "alice",
      },
      `Thank you ${name}. I have your age as ${speechResult}. Let me verify your details and transfer you to an available agent.`,
    )

    twiml.pause({ length: 2 })

    // Redirect to agent assignment
    twiml.redirect(
      {
        method: "POST",
      },
      `/api/twilio/assign-agent?name=${encodeURIComponent(name)}&age=${encodeURIComponent(speechResult)}&from=${encodeURIComponent(from)}`,
    )
  } else {
    twiml.say("I didn't catch your age. Please try again.")
    const gather = twiml.gather({
      input: "speech",
      action: `/api/twilio/gather-age?name=${encodeURIComponent(name)}&from=${encodeURIComponent(from)}`,
      method: "POST",
      speechTimeout: "auto",
      language: "en-US",
    })
    gather.say("Please say your age.")
  }

  return new NextResponse(twiml.toString(), {
    headers: {
      "Content-Type": "text/xml",
    },
  })
}
