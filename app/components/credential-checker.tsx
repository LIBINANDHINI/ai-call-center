"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertCircle, Loader2, Copy, Eye, EyeOff, Edit, Save, X } from "lucide-react"
import { Label } from "@/components/ui/label"

interface CredentialStatus {
  present: boolean
  value: string
  length: number
  format?: boolean
  valid: boolean
}

interface VerificationResult {
  credentials: {
    accountSid: CredentialStatus
    authToken: CredentialStatus
    phoneNumber: CredentialStatus
  }
  api: {
    attempted: boolean
    successful: boolean
    error: string | null
    httpStatus: number | null
    accountInfo: any
    phoneNumbers: any[]
  }
  recommendations: string[]
}

export function CredentialChecker() {
  const [isChecking, setIsChecking] = useState(false)
  const [results, setResults] = useState<VerificationResult | null>(null)
  const [showTokens, setShowTokens] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  // Editable credential state
  const [editableCredentials, setEditableCredentials] = useState({
    accountSid: "",
    authToken: "",
    phoneNumber: "",
  })

  const checkCredentials = async () => {
    setIsChecking(true)
    try {
      const response = await fetch("/api/twilio/verify-credentials")
      const data = await response.json()
      setResults(data)

      // Initialize editable credentials with current values
      if (data.credentials) {
        setEditableCredentials({
          accountSid: data.credentials.accountSid.value.includes("...") ? "" : data.credentials.accountSid.value,
          authToken: data.credentials.authToken.value.includes("...") ? "" : data.credentials.authToken.value,
          phoneNumber: data.credentials.phoneNumber.value,
        })
      }
    } catch (error) {
      console.error("Error checking credentials:", error)
    } finally {
      setIsChecking(false)
    }
  }

  const testCustomCredentials = async () => {
    if (!editableCredentials.accountSid || !editableCredentials.authToken || !editableCredentials.phoneNumber) {
      alert("Please fill in all credential fields")
      return
    }

    setIsTesting(true)
    try {
      console.log("Testing custom credentials...")

      const response = await fetch("/api/twilio/verify-simple", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editableCredentials),
      })

      const data = await response.json()
      console.log("Verification result:", data)

      if (data.success && data.valid) {
        // Create a mock results object for display
        const mockResults = {
          credentials: {
            accountSid: {
              present: true,
              value: editableCredentials.accountSid,
              length: editableCredentials.accountSid.length,
              format: editableCredentials.accountSid.startsWith("AC"),
              valid: editableCredentials.accountSid.startsWith("AC") && editableCredentials.accountSid.length === 34,
            },
            authToken: {
              present: true,
              value: `${editableCredentials.authToken.substring(0, 8)}...${editableCredentials.authToken.substring(editableCredentials.authToken.length - 4)}`,
              length: editableCredentials.authToken.length,
              valid: editableCredentials.authToken.length === 32,
            },
            phoneNumber: {
              present: true,
              value: editableCredentials.phoneNumber,
              length: editableCredentials.phoneNumber.length,
              format: editableCredentials.phoneNumber.startsWith("+"),
              valid: editableCredentials.phoneNumber.startsWith("+") && editableCredentials.phoneNumber.length >= 10,
            },
          },
          api: {
            attempted: true,
            successful: true,
            error: null,
            httpStatus: 200,
            accountInfo: data.account,
            phoneNumbers: [],
          },
          recommendations: [
            "✅ Custom credentials work! API connection successful",
            `✅ Account: ${data.account.name} (${data.account.status})`,
            "✅ Ready to make calls with these credentials",
          ],
        }

        setResults(mockResults)
        alert(
          `✅ Credentials verified successfully!\n\nAccount: ${data.account.name}\nStatus: ${data.account.status}\n\nYou can now save and use these credentials.`,
        )
      } else {
        alert(
          `❌ Credential verification failed:\n\n${data.error}\nCode: ${data.code}\nHTTP Status: ${data.httpStatus}\n\nPlease check your Account SID and Auth Token.`,
        )
      }
    } catch (error) {
      console.error("Error testing custom credentials:", error)
      alert("Error testing credentials: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setIsTesting(false)
    }
  }

  const saveCredentials = async () => {
    try {
      const response = await fetch("/api/twilio/update-credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editableCredentials),
      })

      if (response.ok) {
        alert("✅ Credentials updated successfully! They will be used for future calls.")
        setIsEditing(false)
        // Re-check credentials
        checkCredentials()
      } else {
        alert("❌ Failed to update credentials")
      }
    } catch (error) {
      console.error("Error saving credentials:", error)
      alert("Error saving credentials")
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getStatusIcon = (valid: boolean, present: boolean) => {
    if (!present) return <XCircle className="h-4 w-4 text-red-500" />
    if (valid) return <CheckCircle className="h-4 w-4 text-green-500" />
    return <AlertCircle className="h-4 w-4 text-yellow-500" />
  }

  const getStatusColor = (valid: boolean, present: boolean) => {
    if (!present) return "border-red-500 bg-red-50"
    if (valid) return "border-green-500 bg-green-50"
    return "border-yellow-500 bg-yellow-50"
  }

  const validateAccountSid = (sid: string) => {
    return sid.startsWith("AC") && sid.length === 34
  }

  const validateAuthToken = (token: string) => {
    return token.length === 32
  }

  const validatePhoneNumber = (phone: string) => {
    return phone.startsWith("+") && phone.length >= 10 && phone.length <= 16
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Twilio Credential Verification
        </CardTitle>
        <CardDescription>
          Verify your Twilio Account SID, Auth Token, and Phone Number are correctly configured
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={checkCredentials} disabled={isChecking} className="flex-1">
            {isChecking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              "🔍 Verify Environment Credentials"
            )}
          </Button>

          {results && !results.api?.successful && (
            <Button onClick={() => setIsEditing(!isEditing)} variant="outline" className="flex-1">
              {isEditing ? (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Cancel Edit
                </>
              ) : (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Credentials
                </>
              )}
            </Button>
          )}
        </div>

        {results && (
          <div className="space-y-4">
            {/* Environment Credential Status */}
            {!isEditing && (
              <div className="grid gap-4">
                <Alert
                  className={getStatusColor(
                    results.credentials.accountSid.valid,
                    results.credentials.accountSid.present,
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(results.credentials.accountSid.valid, results.credentials.accountSid.present)}
                      <div>
                        <strong>Account SID (Environment)</strong>
                        <div className="text-sm">
                          {showTokens ? results.credentials.accountSid.value : "AC••••••••••••••••••••••••••••••••"}
                        </div>
                        <div className="text-xs text-gray-600">
                          Length: {results.credentials.accountSid.length} | Format:{" "}
                          {results.credentials.accountSid.format ? "✅" : "❌"}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(results.credentials.accountSid.value)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </Alert>

                <Alert
                  className={getStatusColor(results.credentials.authToken.valid, results.credentials.authToken.present)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(results.credentials.authToken.valid, results.credentials.authToken.present)}
                      <div>
                        <strong>Auth Token (Environment)</strong>
                        <div className="text-sm">
                          {showTokens ? results.credentials.authToken.value : "••••••••••••••••••••••••••••••••"}
                        </div>
                        <div className="text-xs text-gray-600">
                          Length: {results.credentials.authToken.length} | Required: 32 chars
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(results.credentials.authToken.value)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </Alert>

                <Alert
                  className={getStatusColor(
                    results.credentials.phoneNumber.valid,
                    results.credentials.phoneNumber.present,
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(results.credentials.phoneNumber.valid, results.credentials.phoneNumber.present)}
                      <div>
                        <strong>Phone Number (Environment)</strong>
                        <div className="text-sm">{results.credentials.phoneNumber.value}</div>
                        <div className="text-xs text-gray-600">
                          Length: {results.credentials.phoneNumber.length} | E.164 Format:{" "}
                          {results.credentials.phoneNumber.format ? "✅" : "❌"}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(results.credentials.phoneNumber.value)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </Alert>
              </div>
            )}

            {/* Editable Credentials Form */}
            {isEditing && (
              <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
                <h4 className="font-medium text-blue-900">Edit Credentials for Testing</h4>
                <p className="text-sm text-blue-700">
                  Enter your correct Twilio credentials below to test them. These will be used for calls if they work.
                </p>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="edit-account-sid">Account SID</Label>
                    <Input
                      id="edit-account-sid"
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      value={editableCredentials.accountSid}
                      onChange={(e) => setEditableCredentials((prev) => ({ ...prev, accountSid: e.target.value }))}
                      className={
                        validateAccountSid(editableCredentials.accountSid) || !editableCredentials.accountSid
                          ? ""
                          : "border-red-500"
                      }
                    />
                    {editableCredentials.accountSid && !validateAccountSid(editableCredentials.accountSid) && (
                      <p className="text-xs text-red-600 mt-1">Must start with 'AC' and be 34 characters</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="edit-auth-token">Auth Token</Label>
                    <Input
                      id="edit-auth-token"
                      type="password"
                      placeholder="32-character auth token"
                      value={editableCredentials.authToken}
                      onChange={(e) => setEditableCredentials((prev) => ({ ...prev, authToken: e.target.value }))}
                      className={
                        validateAuthToken(editableCredentials.authToken) || !editableCredentials.authToken
                          ? ""
                          : "border-red-500"
                      }
                    />
                    {editableCredentials.authToken && !validateAuthToken(editableCredentials.authToken) && (
                      <p className="text-xs text-red-600 mt-1">Must be exactly 32 characters</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="edit-phone-number">Phone Number</Label>
                    <Input
                      id="edit-phone-number"
                      placeholder="+1234567890"
                      value={editableCredentials.phoneNumber}
                      onChange={(e) => setEditableCredentials((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                      className={
                        validatePhoneNumber(editableCredentials.phoneNumber) || !editableCredentials.phoneNumber
                          ? ""
                          : "border-red-500"
                      }
                    />
                    {editableCredentials.phoneNumber && !validatePhoneNumber(editableCredentials.phoneNumber) && (
                      <p className="text-xs text-red-600 mt-1">Must start with '+' and be 10-16 characters</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={testCustomCredentials}
                    disabled={
                      isTesting ||
                      !editableCredentials.accountSid ||
                      !editableCredentials.authToken ||
                      !editableCredentials.phoneNumber
                    }
                    className="flex-1"
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      "🧪 Test These Credentials"
                    )}
                  </Button>

                  {results?.api?.successful && (
                    <Button onClick={saveCredentials} variant="default" className="flex-1">
                      <Save className="mr-2 h-4 w-4" />
                      Save & Use These
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowTokens(!showTokens)}>
                {showTokens ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showTokens ? "Hide" : "Show"} Credentials
              </Button>
            </div>

            {/* API Test Results */}
            {results.api.attempted && (
              <Alert className={results.api.successful ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}>
                <AlertDescription>
                  <strong>API Connection Test:</strong>
                  {results.api.successful ? (
                    <div className="mt-2">
                      <div className="text-green-700">✅ Successfully connected to Twilio API</div>
                      {results.api.accountInfo && (
                        <div className="mt-2 text-sm">
                          <div>
                            <strong>Account:</strong> {results.api.accountInfo.friendly_name}
                          </div>
                          <div>
                            <strong>Status:</strong> {results.api.accountInfo.status}
                          </div>
                          <div>
                            <strong>Type:</strong> {results.api.accountInfo.type}
                          </div>
                        </div>
                      )}
                      {results.api.phoneNumbers.length > 0 && (
                        <div className="mt-2 text-sm">
                          <div>
                            <strong>Phone Numbers in Account:</strong>
                          </div>
                          <ul className="list-disc list-inside mt-1">
                            {results.api.phoneNumbers.map((phone, index) => (
                              <li key={index}>
                                {phone.phone_number} ({phone.friendly_name})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-red-700">
                      ❌ Failed to connect: {results.api.error}
                      {results.api.httpStatus && <div>HTTP Status: {results.api.httpStatus}</div>}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Recommendations */}
            <div className="space-y-2">
              <h4 className="font-medium">Recommendations:</h4>
              <div className="space-y-1">
                {results.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5">
                      {rec.startsWith("✅") ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : rec.startsWith("❌") ? (
                        <XCircle className="h-3 w-3 text-red-500" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-yellow-500" />
                      )}
                    </span>
                    <span>{rec.replace(/^[✅❌⚠️]\s*/, "")}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Setup Guide */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>How to find your Twilio credentials:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                  <li>
                    Go to{" "}
                    <a
                      href="https://console.twilio.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      console.twilio.com
                    </a>
                  </li>
                  <li>Account SID: Found on the main dashboard</li>
                  <li>Auth Token: Click "View" next to Auth Token on dashboard</li>
                  <li>Phone Number: Go to Phone Numbers → Manage → Active numbers</li>
                </ol>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
