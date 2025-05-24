"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Phone, PhoneCall, Users, Clock, FileAudio, Loader2, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CredentialManager } from "./components/credential-manager"

interface Agent {
  id: string
  name: string
  available: boolean
  currentCall?: string
}

interface CallLog {
  id: string
  callerName: string
  age: string
  timestamp: string
  assignedAgent: string
  status: "completed" | "in-progress"
}

interface CallState {
  step: "idle" | "greeting" | "name" | "age" | "verifying" | "transferring" | "connected"
  callerName: string
  age: string
  isLoading: boolean
  message: string
}

export default function CallCenterSimulation() {
  const [agents, setAgents] = useState<Agent[]>([
    { id: "1", name: "Sarah Johnson", available: true },
    { id: "2", name: "Mike Chen", available: true },
    { id: "3", name: "Emily Rodriguez", available: false },
    { id: "4", name: "Sam", available: true },
    { id: "5", name: "Shiv", available: true },
    { id: "6", name: "Zara", available: true },
    { id: "7", name: "Dheeksha", available: true },
    { id: "8", name: "Kennedy", available: false },
    { id: "9", name: "John", available: true },
    { id: "10", name: "Arvind", available: true },
    { id: "11", name: "Shophia", available: false },
    { id: "12", name: "Jency", available: true },
    { id: "13", name: "Nickson", available: false },
    { id: "14", name: "Karun", available: true },
    { id: "15", name: "Shahir", available: true },
    { id: "16", name: "Alia", available: true },
    { id: "17", name: "Dhanveer", available: false },
    { id: "18", name: "Ranvik", available: false },
    { id: "19", name: "Munna", available: false },
  ])

  const [callLogs, setCallLogs] = useState<CallLog[]>([])
  const [totalCalls, setTotalCalls] = useState(0)
  const [callState, setCallState] = useState<CallState>({
    step: "idle",
    callerName: "",
    age: "",
    isLoading: false,
    message: "",
  })

  const [recordings] = useState([
    "recording_001.mp3",
    "recording_002.mp3",
    "recording_003.mp3",
    "recording_004.mp3",
    "recording_005.mp3",
  ])

  const [outboundNumber, setOutboundNumber] = useState("")
  const [isDialing, setIsDialing] = useState(false)
  const [activeCalls, setActiveCalls] = useState<string[]>([])
  const [callHistory, setCallHistory] = useState<any[]>([])
  const [apiStatus, setApiStatus] = useState<any>(null)
  const [isTesting, setIsTesting] = useState(false)

  const activeAgents = agents.filter((agent) => agent.available).length
  const availableAgents = agents.filter((agent) => agent.available && !agent.currentCall)

  const simulateIncomingCall = () => {
    setCallState({
      step: "greeting",
      callerName: "",
      age: "",
      isLoading: false,
      message: "Hello! Welcome to our AI call center. May I know your name?",
    })
  }

  const handleNameSubmit = () => {
    if (callState.callerName.trim()) {
      setCallState((prev) => ({
        ...prev,
        step: "age",
        message: `Great ${prev.callerName}! And your age please?`,
      }))
    }
  }

  const handleVerify = async () => {
    if (!callState.age.trim()) return

    setCallState((prev) => ({ ...prev, step: "verifying", isLoading: true, message: "Verifying details..." }))

    // Simulate verification delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Find available agent
    const availableAgent = agents.find((agent) => agent.available && !agent.currentCall)

    if (!availableAgent) {
      setCallState((prev) => ({
        ...prev,
        step: "transferring",
        isLoading: false,
        message: "No agents available. Please wait...",
      }))
      return
    }

    setCallState((prev) => ({ ...prev, message: "Transferring you to an available agent..." }))

    // Simulate transfer delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Assign call to agent
    setAgents((prev) =>
      prev.map((agent) => (agent.id === availableAgent.id ? { ...agent, currentCall: callState.callerName } : agent)),
    )

    // Create call log
    const newCallLog: CallLog = {
      id: Date.now().toString(),
      callerName: callState.callerName,
      age: callState.age,
      timestamp: new Date().toLocaleTimeString(),
      assignedAgent: availableAgent.name,
      status: "in-progress",
    }

    setCallLogs((prev) => [newCallLog, ...prev])
    setTotalCalls((prev) => prev + 1)

    setCallState({
      step: "connected",
      callerName: "",
      age: "",
      isLoading: false,
      message: `Connected to ${availableAgent.name}. Call in progress...`,
    })

    // Simulate call completion after 10 seconds
    setTimeout(() => {
      setAgents((prev) =>
        prev.map((agent) => (agent.id === availableAgent.id ? { ...agent, currentCall: undefined } : agent)),
      )

      setCallLogs((prev) =>
        prev.map((log) => (log.id === newCallLog.id ? { ...log, status: "completed" as const } : log)),
      )

      setCallState({
        step: "idle",
        callerName: "",
        age: "",
        isLoading: false,
        message: "",
      })
    }, 10000)
  }

  const toggleAgentAvailability = (agentId: string) => {
    setAgents((prev) =>
      prev.map((agent) =>
        agent.id === agentId ? { ...agent, available: !agent.available, currentCall: undefined } : agent,
      ),
    )
  }

  const resetSimulation = () => {
    setCallState({
      step: "idle",
      callerName: "",
      age: "",
      isLoading: false,
      message: "",
    })
  }

  const validatePhoneNumber = (phone: string): boolean => {
    // Basic phone number validation (E.164 format)
    const phoneRegex = /^\+[1-9]\d{1,14}$/
    return phoneRegex.test(phone)
  }

  const testApiHealth = async () => {
    setIsTesting(true)
    try {
      console.log("Testing API health...")

      // Test the health endpoint first
      const healthResponse = await fetch("/api/health")
      const healthText = await healthResponse.text()

      console.log("Health check response:", healthResponse.status, healthText)

      if (healthResponse.ok && healthText.includes("success")) {
        const healthData = JSON.parse(healthText)
        setApiStatus({
          health: "✅ API routes are accessible",
          timestamp: healthData.timestamp,
          routes: {
            health: "✅ Working",
            makeCall: "Available",
            webhooks: "Available",
          },
        })
        alert("✅ API Health Check Passed!\n\nAPI routes are working correctly.\nYou can now try making calls.")
      } else {
        setApiStatus({
          health: "❌ API routes not accessible",
          error: "Health check failed",
          status: healthResponse.status,
        })
        alert(`❌ API Health Check Failed!\n\nStatus: ${healthResponse.status}\nResponse: ${healthText}`)
      }
    } catch (error) {
      console.error("Health check error:", error)
      setApiStatus({
        health: "❌ API routes not accessible",
        error: error instanceof Error ? error.message : "Unknown error",
      })
      alert(`❌ API Health Check Failed!\n\nError: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsTesting(false)
    }
  }

  const makeOutboundCall = async () => {
    if (!outboundNumber.trim()) return

    setIsDialing(true)
    try {
      console.log("Making outbound call to:", outboundNumber)

      const response = await fetch("/api/make-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: outboundNumber,
        }),
      })

      console.log("Response status:", response.status)
      console.log("Response headers:", Object.fromEntries(response.headers.entries()))

      // Get the response text first
      const responseText = await response.text()
      console.log("Raw response:", responseText.substring(0, 500))

      // Check if it's HTML (error page)
      if (responseText.trim().startsWith("<!DOCTYPE") || responseText.trim().startsWith("<html")) {
        console.error("Received HTML instead of JSON")
        alert(
          `❌ Server Error: API route not found or server error\n\nThis means:\n• The /api/make-call route isn't deployed\n• There's a server-side error\n• The route file has syntax errors\n\nStatus: ${response.status}\n\nTry:\n1. Check if API routes are deployed\n2. Look at server logs\n3. Test the health endpoint first`,
        )
        return
      }

      // Check if response is empty
      if (!responseText.trim()) {
        alert("❌ Empty response from server")
        return
      }

      // Parse JSON response
      let result
      try {
        result = JSON.parse(responseText)
        console.log("Parsed result:", result)
      } catch (parseError) {
        console.error("JSON parse error:", parseError)
        alert(
          `❌ Invalid JSON response\n\nResponse: ${responseText.substring(0, 200)}...\n\nThis might be a server error.`,
        )
        return
      }

      // Handle the result
      if (result.success) {
        setActiveCalls((prev) => [...prev, result.callSid])
        setCallHistory((prev) => [
          {
            id: result.callSid,
            type: "outbound",
            number: outboundNumber,
            status: result.status,
            timestamp: new Date().toLocaleTimeString(),
            webhookInfo: result.webhookInfo,
          },
          ...prev,
        ])
        setOutboundNumber("")

        let successMessage = `✅ Call initiated successfully!\n\nCall SID: ${result.callSid}\nStatus: ${result.status}\nTo: ${result.to}\nFrom: ${result.from}`

        if (result.webhookInfo) {
          successMessage += `\n\nWebhook Info:\n• Using: ${result.webhookInfo.usingInlineTwiml ? "Inline TwiML" : "Webhook URL"}\n• URL: ${result.webhookInfo.webhookUrl}`
        }

        alert(successMessage)
      } else {
        console.error("Call failed:", result)
        let errorMessage = result.error || "Unknown error"
        if (result.details) {
          errorMessage += `\n\nDetails: ${result.details}`
        }
        if (result.suggestion) {
          errorMessage += `\n\n💡 Suggestion: ${result.suggestion}`
        }
        if (result.code) {
          errorMessage += `\n\nTwilio Code: ${result.code}`
        }
        if (result.credentialSource) {
          errorMessage += `\nCredentials: ${result.credentialSource}`
        }
        if (result.webhookInfo) {
          errorMessage += `\n\nWebhook Info:\n• URL: ${result.webhookInfo.webhookUrl}\n• Status URL: ${result.webhookInfo.statusCallbackUrl}\n• Using Inline TwiML: ${result.webhookInfo.usingInlineTwiml}`
        }
        alert(`❌ Call failed:\n\n${errorMessage}`)
      }
    } catch (error) {
      console.error("Network error:", error)
      alert(
        `❌ Network Error:\n\n${error instanceof Error ? error.message : "Unknown error"}\n\nCheck your internet connection and try again.`,
      )
    } finally {
      setIsDialing(false)
    }
  }

  const getStatusIcon = (status: any) => {
    if (!status) return <AlertCircle className="h-4 w-4" />
    if (status.health?.includes("✅")) return <CheckCircle className="h-4 w-4 text-green-600" />
    return <XCircle className="h-4 w-4 text-red-600" />
  }

  const getStatusColor = (status: any) => {
    if (!status) return "border-yellow-500 bg-yellow-50"
    if (status.health?.includes("✅")) return "border-green-500 bg-green-50"
    return "border-red-500 bg-red-50"
  }

  const testWebhookUrls = async () => {
    setIsTesting(true)
    try {
      const response = await fetch("/api/test-webhook-url")
      const result = await response.json()

      if (result.success) {
        const { webhookConstruction, debugInfo } = result

        let message = `🌐 Webhook URL Test Results:\n\n`
        message += `Construction: ${webhookConstruction.success ? "✅ Success" : "❌ Failed"}\n`
        message += `Final Host: ${webhookConstruction.finalHost || "Not detected"}\n`
        message += `Webhook URL: ${webhookConstruction.webhookUrl || "Cannot construct"}\n`
        message += `Status URL: ${webhookConstruction.statusCallbackUrl || "Cannot construct"}\n\n`
        message += `Recommendation: ${webhookConstruction.recommendation}\n\n`
        message += `Debug Info:\n`
        message += `• Host Header: ${debugInfo.host || "null"}\n`
        message += `• Forwarded Host: ${debugInfo.forwardedHost || "null"}\n`
        message += `• Protocol: ${debugInfo.protocol}\n`
        message += `• Next.js Origin: ${debugInfo.nextUrlOrigin}`

        alert(message)
      } else {
        alert(`❌ Webhook test failed: ${result.error}`)
      }
    } catch (error) {
      alert(`❌ Webhook test error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Call Center Simulation</h1>
          <p className="text-gray-600">Interactive real-time call center workflow demonstration</p>
        </div>

        {/* API Status Display */}
        {apiStatus && (
          <Alert className={getStatusColor(apiStatus)}>
            {getStatusIcon(apiStatus)}
            <AlertDescription>
              <strong>API Status:</strong> {apiStatus.health}
              {apiStatus.error && (
                <div className="mt-1 text-sm">
                  <strong>Error:</strong> {apiStatus.error}
                </div>
              )}
              {apiStatus.routes && (
                <div className="mt-2">
                  <strong>Routes:</strong>
                  <ul className="list-disc list-inside mt-1">
                    {Object.entries(apiStatus.routes).map(([route, status]) => (
                      <li key={route} className="text-sm">
                        {route}: {status}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Metrics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Calls Today</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCalls}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeAgents}</div>
              <p className="text-xs text-muted-foreground">{availableAgents.length} available</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.3s</div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Real Call Management Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PhoneCall className="h-5 w-5" />
                Live Call Management
              </CardTitle>
              <CardDescription>Make real calls and handle incoming calls via Twilio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Twilio Phone Number Display */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your Twilio number: <strong>{process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER || "Not configured"}</strong>
                  <br />
                  Incoming calls will be handled automatically with AI greeting.
                </AlertDescription>
              </Alert>

              {/* Credential Management */}
              <div className="space-y-2">
                <CredentialManager />
              </div>

              {/* Outbound Call Section */}
              <div className="space-y-2">
                <Label htmlFor="phone">Make Outbound Call</Label>
                <div className="flex gap-2">
                  <Input
                    id="phone"
                    placeholder="+1234567890 (E.164 format)"
                    value={outboundNumber}
                    onChange={(e) => setOutboundNumber(e.target.value)}
                    disabled={isDialing}
                    className={outboundNumber && !validatePhoneNumber(outboundNumber) ? "border-red-500" : ""}
                  />
                  <Button
                    onClick={makeOutboundCall}
                    disabled={!outboundNumber.trim() || !validatePhoneNumber(outboundNumber) || isDialing}
                    className="min-w-[100px]"
                  >
                    {isDialing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Calling...
                      </>
                    ) : (
                      <>
                        <Phone className="mr-2 h-4 w-4" />
                        Call
                      </>
                    )}
                  </Button>
                </div>
                {outboundNumber && !validatePhoneNumber(outboundNumber) && (
                  <p className="text-sm text-red-600">
                    Please enter a valid phone number in E.164 format (e.g., +1234567890)
                  </p>
                )}
              </div>

              {/* Active Calls */}
              {activeCalls.length > 0 && (
                <div className="space-y-2">
                  <Label>Active Calls</Label>
                  <div className="space-y-1">
                    {activeCalls.map((callSid) => (
                      <div key={callSid} className="flex items-center justify-between p-2 bg-green-50 rounded border">
                        <span className="text-sm font-medium">Call: {callSid.slice(-8)}</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Active
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Simulation Mode Toggle */}
              <div className="pt-4 border-t">
                <Button
                  onClick={simulateIncomingCall}
                  variant="outline"
                  className="w-full"
                  disabled={callState.step !== "idle"}
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Test Simulation Mode
                </Button>
                {callState.step !== "idle" && (
                  <div className="mt-4 space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-medium text-blue-900 mb-2">AI Assistant (Simulation):</p>
                      <p className="text-blue-800">{callState.message}</p>
                    </div>

                    {callState.step === "greeting" && (
                      <div className="space-y-2">
                        <Input
                          placeholder="Enter caller name"
                          value={callState.callerName}
                          onChange={(e) => setCallState((prev) => ({ ...prev, callerName: e.target.value }))}
                          onKeyPress={(e) => e.key === "Enter" && handleNameSubmit()}
                        />
                        <Button onClick={handleNameSubmit} disabled={!callState.callerName.trim()}>
                          Continue
                        </Button>
                      </div>
                    )}

                    {callState.step === "age" && (
                      <div className="space-y-2">
                        <Input
                          placeholder="Enter age"
                          type="number"
                          value={callState.age}
                          onChange={(e) => setCallState((prev) => ({ ...prev, age: e.target.value }))}
                          onKeyPress={(e) => e.key === "Enter" && handleVerify()}
                        />
                        <Button onClick={handleVerify} disabled={!callState.age.trim()}>
                          Verify
                        </Button>
                      </div>
                    )}

                    {(callState.step === "verifying" || callState.step === "transferring") && (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span>Processing...</span>
                      </div>
                    )}

                    {callState.step === "connected" && (
                      <div className="space-y-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Call In Progress (Simulation)
                        </Badge>
                        <Button onClick={resetSimulation} variant="outline" size="sm">
                          End Simulation
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Agent Pool */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Agent Pool
              </CardTitle>
              <CardDescription>Live agent availability and assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent Name</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Current Call</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents.map((agent) => (
                    <TableRow key={agent.id}>
                      <TableCell className="font-medium">{agent.name}</TableCell>
                      <TableCell>
                        <Switch checked={agent.available} onCheckedChange={() => toggleAgentAvailability(agent.id)} />
                      </TableCell>
                      <TableCell>
                        {agent.currentCall ? (
                          <Badge variant="default" className="bg-orange-100 text-orange-800">
                            {agent.currentCall}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Call Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Call Logs</CardTitle>
              <CardDescription>Real-time call history and assignments</CardDescription>
            </CardHeader>
            <CardContent>
              {callLogs.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No calls yet. Start a simulation!</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {callLogs.slice(0, 5).map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.callerName}</TableCell>
                        <TableCell>{log.age}</TableCell>
                        <TableCell>{log.timestamp}</TableCell>
                        <TableCell>{log.assignedAgent}</TableCell>
                        <TableCell>
                          <Badge
                            variant={log.status === "completed" ? "secondary" : "default"}
                            className={
                              log.status === "completed" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                            }
                          >
                            {log.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Real Call History */}
          <Card>
            <CardHeader>
              <CardTitle>Real Call History</CardTitle>
              <CardDescription>Actual Twilio call logs and status</CardDescription>
            </CardHeader>
            <CardContent>
              {callHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No real calls yet. Make an outbound call to test!</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Call ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Number</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {callHistory.slice(0, 5).map((call) => (
                      <TableRow key={call.id}>
                        <TableCell className="font-mono text-xs">{call.id.slice(-8)}</TableCell>
                        <TableCell>
                          <Badge variant={call.type === "inbound" ? "default" : "secondary"}>{call.type}</Badge>
                        </TableCell>
                        <TableCell>{call.number}</TableCell>
                        <TableCell>{call.timestamp}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              call.status === "completed"
                                ? "border-green-500 text-green-700"
                                : call.status === "in-progress"
                                  ? "border-blue-500 text-blue-700"
                                  : "border-yellow-500 text-yellow-700"
                            }
                          >
                            {call.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Simulated Recordings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileAudio className="h-5 w-5" />
                Call Recordings
              </CardTitle>
              <CardDescription>Simulated call recording files</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recordings.map((recording, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium">{recording}</span>
                    <Badge variant="outline" className="text-xs">
                      {Math.floor(Math.random() * 5) + 2}:30
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* API Health Check */}
        <div className="space-y-2">
          <Button onClick={testApiHealth} disabled={isTesting} variant="outline" className="w-full">
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing API...
              </>
            ) : (
              "🔍 Test API Health"
            )}
          </Button>

          <Button onClick={testWebhookUrls} disabled={isTesting} variant="outline" className="w-full">
            🌐 Test Webhook URLs
          </Button>
        </div>
      </div>
    </div>
  )
}
