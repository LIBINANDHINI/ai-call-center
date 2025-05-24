# Twilio Webhook Configuration

## Required Webhooks

Configure these webhooks in your Twilio Console:

### 1. Phone Number Configuration
- Go to Phone Numbers > Manage > Active numbers
- Select your Twilio phone number
- Set Webhook URL for incoming calls:
  \`\`\`
  https://your-domain.com/api/twilio/incoming
  \`\`\`
- HTTP Method: POST

### 2. Application Configuration (Optional)
Create a TwiML App for more advanced routing:
- Go to Develop > TwiML > TwiML Apps
- Create new app with Voice Request URL:
  \`\`\`
  https://your-domain.com/api/twilio/incoming
  \`\`\`

### 3. Status Callbacks
For call status tracking, webhooks are automatically configured in the API routes.

## Environment Variables Required

\`\`\`env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
NEXT_PUBLIC_TWILIO_PHONE_NUMBER=your_twilio_phone_number
\`\`\`

## Testing

1. **Incoming Calls**: Call your Twilio number
2. **Outbound Calls**: Use the "Make Outbound Call" feature
3. **Agent Assignment**: Toggle agent availability to test routing
4. **Call Logs**: Monitor real-time call data in the dashboard

## Production Considerations

- Replace in-memory agent storage with database
- Implement proper error handling and retry logic
- Add authentication for webhook endpoints
- Set up monitoring and logging
- Configure proper CORS and security headers
