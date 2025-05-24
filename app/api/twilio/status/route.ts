import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("=== Status Webhook ===")

    const formData = await request.formData()
    const statusData = {
      CallSid: formData.get("CallSid"),
      CallStatus: formData.get("CallStatus"),
      From: formData.get("From"),
      To: formData.get("To"),
      CallDuration: formData.get("CallDuration"),
      Timestamp: new Date().toISOString(),
    }

    console.log("Call status update:", statusData)

    // In a real application, you would save this to a database
    // For now, just log it

    return new NextResponse("OK", { status: 200 })
  } catch (error) {
    console.error("Error in status webhook:", error)
    return new NextResponse("Error", { status: 500 })
  }
}
