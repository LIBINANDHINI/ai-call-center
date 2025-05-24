import { type NextRequest, NextResponse } from "next/server"
import twilio from "twilio"

const VoiceResponse = twilio.twiml.VoiceResponse

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const speechResult = formData.get("SpeechResult") as string
  const callSid = formData.get("CallSid") as string
  const from = formData.get("From") as string

  console.log(`Name gathered: ${speechResult} from call ${callSid}`)

  const twiml = new VoiceResponse()

  if (speechResult) {
    // Store the name and ask for age
    twiml.say(
      {
        voice: "alice",
      },
      `Great ${speechResult}! Now, could you please tell me your age?`,
    )

    const gather = twiml.gather({
      input: "speech",
      action: `/api/twilio/gather-age?name=${encodeURIComponent(speechResult)}&from=${encodeURIComponent(from)}`,
      method: "POST",
      speechTimeout: "auto",
      language: "en-US",
    })

    gather.say(
      {
        voice: "alice",
      },
      "Please say your age.",
    )
  } else {
    twiml.say("I didn't catch your name. Please try again.")
    twiml.redirect("/api/twilio/incoming")
  }

  return new NextResponse(twiml.toString(), {
    headers: {
      "Content-Type": "text/xml",
    },
  })
}
