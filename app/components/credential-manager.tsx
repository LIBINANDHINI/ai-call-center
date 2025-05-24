"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertCircle, Loader2, Eye, EyeOff, Save, TestTube } from "lucide-react"
import { Label } from "@/components/ui/label"

interface CredentialStatus {
  isValid: boolean
  message: string
  details?: any
}

export function CredentialManager() {
  const [credentials, setCredentials] = useState({
    accountSid: "",
    authToken: "",
    phoneNumber: "",
  })

  const [showTokens, setShowTokens] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [validationStatus, setValidationStatus] = useState<CredentialStatus | null>(null)
  const [envStatus, setEnvStatus] = useState<any>(null)

  // Load current environment status on mount
  useEffect(() => {
    checkEnvironmentCredentials()
  }, [])

  const checkEnvironmentCredentials = async () => {
    try {
      const response = await fetch("/api/check-credentials")
      if (response.ok) {
        const data = await response.json()
        setEnvStatus(data)
      }
    } catch (error) {
      console.error("Failed to check environment credentials:", error)
    }
  }

  const validateCredentialFormat = (creds: typeof credentials) => {
    const errors = []

    if (!creds.accountSid) {
      errors.push("Account SID is required")
    } else if (!creds.accountSid.startsWith("AC") || creds.accountSid.length !== 34) {
      errors.push("Account SID must start with 'AC' and be 34 characters")
    }

    if (!creds.authToken) {
      errors.push("Auth Token is required")
    } else if (creds.authToken.length !== 32) {
      errors.push(`Auth Token must be 32 characters (currently ${creds.authToken.length})`)
    }

    if (!creds.phoneNumber) {
      errors.push("Phone Number is required")
    } else if (!creds.phoneNumber.startsWith("+")) {
      errors.push("Phone Number must start with '+' (E.164 format)")
    } else if (creds.phoneNumber.length < 10 || creds.phoneNumber.length > 16) {
      errors.push("Phone Number must be 10-16 characters")
    }

    return errors
  }

  const testCredentials = async () => {
    const formatErrors = validateCredentialFormat(credentials)
    if (formatErrors.length > 0) {
      setValidationStatus({
        isValid: false,
        message: "Format errors: " + formatErrors.join(", "),
      })
      return
    }

    setIsValidating(true)
    try {
      const response = await fetch("/api/validate-credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })

      const result = await response.json()

      if (result.success && result.valid) {
        setValidationStatus({
          isValid: true,
          message: `✅ Credentials valid! Account: ${result.account?.name || "Unknown"}`,
          details: result.account,
        })
      } else {
        setValidationStatus({
          isValid: false,
          message: `❌ ${result.error || "Validation failed"}`,
          details: result.details,
        })
      }
    } catch (error) {
      setValidationStatus({
        isValid: false,
        message: `❌ Test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      })
    } finally {
      setIsValidating(false)
    }
  }

  const saveCredentials = async () => {
    if (!validationStatus?.isValid) {
      alert("Please test and validate credentials first")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/save-credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })

      if (response.ok) {
        alert("✅ Credentials saved successfully! They will be used for all calls.")
        checkEnvironmentCredentials() // Refresh environment status
      } else {
        alert("❌ Failed to save credentials")
      }
    } catch (error) {
      alert(`❌ Save failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsSaving(false)
    }
  }

  const getFieldStatus = (field: keyof typeof credentials) => {
    const value = credentials[field]
    if (!value) return "empty"

    switch (field) {
      case "accountSid":
        return value.startsWith("AC") && value.length === 34 ? "valid" : "invalid"
      case "authToken":
        return value.length === 32 ? "valid" : "invalid"
      case "phoneNumber":
        return value.startsWith("+") && value.length >= 10 && value.length <= 16 ? "valid" : "invalid"
      default:
        return "empty"
    }
  }

  const getFieldColor = (status: string) => {
    switch (status) {
      case "valid":
        return "border-green-500 bg-green-50"
      case "invalid":
        return "border-red-500 bg-red-50"
      default:
        return ""
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "valid":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "invalid":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Twilio Credential Manager
        </CardTitle>
        <CardDescription>Test and configure your Twilio credentials for making calls</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Environment Status */}
        {envStatus && (
          <Alert
            className={
              envStatus.hasValidCredentials ? "border-green-500 bg-green-50" : "border-yellow-500 bg-yellow-50"
            }
          >
            <AlertDescription>
              <strong>Environment Status:</strong>
              {envStatus.hasValidCredentials ? (
                <span className="text-green-700"> ✅ Valid credentials found in environment</span>
              ) : (
                <span className="text-yellow-700"> ⚠️ No valid credentials in environment - configure below</span>
              )}
              {envStatus.details && (
                <div className="mt-2 text-sm">
                  <div>Account SID: {envStatus.details.accountSid ? "✅" : "❌"}</div>
                  <div>Auth Token: {envStatus.details.authToken ? "✅" : "❌"}</div>
                  <div>Phone Number: {envStatus.details.phoneNumber ? "✅" : "❌"}</div>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Credential Input Form */}
        <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
          <h4 className="font-medium">Configure Twilio Credentials</h4>
          <p className="text-sm text-gray-600">
            Enter your Twilio credentials below. Get them from{" "}
            <a
              href="https://console.twilio.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              console.twilio.com
            </a>
          </p>

          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Label htmlFor="account-sid">Account SID</Label>
                {getStatusIcon(getFieldStatus("accountSid"))}
              </div>
              <Input
                id="account-sid"
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={credentials.accountSid}
                onChange={(e) => setCredentials((prev) => ({ ...prev, accountSid: e.target.value.trim() }))}
                className={getFieldColor(getFieldStatus("accountSid"))}
              />
              <p className="text-xs text-gray-500 mt-1">
                Found on your Twilio Console dashboard. Starts with "AC" and is 34 characters.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <Label htmlFor="auth-token">Auth Token</Label>
                {getStatusIcon(getFieldStatus("authToken"))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTokens(!showTokens)}
                  className="ml-auto h-6 px-2"
                >
                  {showTokens ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </Button>
              </div>
              <Input
                id="auth-token"
                type={showTokens ? "text" : "password"}
                placeholder="32-character auth token"
                value={credentials.authToken}
                onChange={(e) => setCredentials((prev) => ({ ...prev, authToken: e.target.value.trim() }))}
                className={getFieldColor(getFieldStatus("authToken"))}
              />
              <p className="text-xs text-gray-500 mt-1">
                Click "View" next to Auth Token on your Twilio dashboard. Exactly 32 characters.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <Label htmlFor="phone-number">Phone Number</Label>
                {getStatusIcon(getFieldStatus("phoneNumber"))}
              </div>
              <Input
                id="phone-number"
                placeholder="+1234567890"
                value={credentials.phoneNumber}
                onChange={(e) => setCredentials((prev) => ({ ...prev, phoneNumber: e.target.value.trim() }))}
                className={getFieldColor(getFieldStatus("phoneNumber"))}
              />
              <p className="text-xs text-gray-500 mt-1">
                Your Twilio phone number in E.164 format (starts with +). Found in Phone Numbers → Active numbers.
              </p>
            </div>
          </div>

          {/* Validation Status */}
          {validationStatus && (
            <Alert className={validationStatus.isValid ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}>
              <AlertDescription>
                <strong>Validation Result:</strong> {validationStatus.message}
                {validationStatus.details && (
                  <div className="mt-2 text-sm">
                    <div>Status: {validationStatus.details.status}</div>
                    <div>Type: {validationStatus.details.type}</div>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={testCredentials}
              disabled={isValidating || !credentials.accountSid || !credentials.authToken || !credentials.phoneNumber}
              className="flex-1"
            >
              {isValidating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <TestTube className="mr-2 h-4 w-4" />
                  Test Credentials
                </>
              )}
            </Button>

            {validationStatus?.isValid && (
              <Button onClick={saveCredentials} disabled={isSaving} variant="default" className="flex-1">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save & Use
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Quick Setup Guide */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Quick Setup:</strong>
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
              <li>Copy your Account SID from the dashboard</li>
              <li>Click "View" next to Auth Token and copy it</li>
              <li>Go to Phone Numbers → Active numbers and copy your number</li>
              <li>Paste them above and click "Test Credentials"</li>
            </ol>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
