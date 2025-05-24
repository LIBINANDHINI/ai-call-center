import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    console.log("=== Testing Webhook URL Construction ===")

    // Get all possible host headers
    const host = request.headers.get("host")
    const forwardedHost = request.headers.get("x-forwarded-host")
    const forwardedProto = request.headers.get("x-forwarded-proto")
    const protocol = forwardedProto || (request.nextUrl.protocol === "https:" ? "https" : "http")

    const debugInfo = {
      host,
      forwardedHost,
      forwardedProto,
      protocol,
      nextUrlOrigin: request.nextUrl.origin,
      nextUrlHost: request.nextUrl.hostname,
      nextUrlProtocol: request.nextUrl.protocol,
      allHeaders: Object.fromEntries(request.headers.entries()),
    }

    console.log("URL construction debug:", debugInfo)

    // Try to construct webhook URLs
    const finalHost = forwardedHost || host || request.nextUrl.hostname
    let webhookUrl = null
    let statusCallbackUrl = null
    let constructionSuccess = false

    if (finalHost && finalHost !== "null" && finalHost !== "localhost") {
      const baseUrl = `${protocol}://${finalHost}`
      webhookUrl = `${baseUrl}/api/twilio-webhook`
      statusCallbackUrl = `${baseUrl}/api/call-status`
      constructionSuccess = true
    }

    return NextResponse.json({
      success: true,
      debugInfo,
      webhookConstruction: {
        success: constructionSuccess,
        finalHost,
        webhookUrl,
        statusCallbackUrl,
        recommendation: constructionSuccess
          ? "Webhook URLs can be constructed successfully"
          : "Webhook URLs cannot be constructed - will use inline TwiML",
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
