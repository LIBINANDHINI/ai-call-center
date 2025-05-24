import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  console.log("=== Call Status Webhook ===")

  try {
    const formData = await request.formData()
    const callSid = formData.get("CallSid")
    const callStatus = formData.get("CallStatus")
    const from = formData.get("From")
    const to = formData.get("To")

    console.log("Call status update:", {
      callSid,
      callStatus,
      from,
      to,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Status webhook error:", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
