import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const callSid = formData.get("CallSid") as string
  const callStatus = formData.get("DialCallStatus") as string
  const callDuration = formData.get("DialCallDuration") as string

  console.log(`Call ${callSid} completed with status: ${callStatus}, duration: ${callDuration}s`)

  // In production, update database with call completion
  // Mark agent as available again
  // Update call logs

  return new NextResponse("OK", { status: 200 })
}
