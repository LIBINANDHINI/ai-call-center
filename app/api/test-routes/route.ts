import { NextResponse } from "next/server"

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: "API routes are working correctly",
      timestamp: new Date().toISOString(),
      routes: {
        "GET /api/test-routes": "✅ Working",
        "POST /api/twilio/make-call": "Available",
        "GET /api/twilio/test": "Available",
        "POST /api/twilio/verify-simple": "Available",
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Test route failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
