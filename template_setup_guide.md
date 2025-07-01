# WhatsApp Template Setup Guide for Counselor Notifications

## Overview
To send messages to new counselors who haven't interacted with the bot, you need to create and get approval for a WhatsApp message template.

## Required Template: `counselor_new_session`

### Template Details
- **Name**: `counselor_new_session`
- **Category**: `UTILITY` (recommended)
- **Language**: English (en)
- **Type**: Text Template with Parameters

### Template Content
```
🆕 New Counseling Session Request

📋 Student Details:
• Name: {{1}}
• Phone: {{2}}
• Urgency: {{3}}

💭 Request Details:
• Issue: {{4}}
• Session ID: {{5}}

⏰ Please review and contact the student to schedule the session.

👨‍⚕️ Christ University Student Wellness Team
```

### Parameter Mapping
1. `{{1}}` - Student Name
2. `{{2}}` - Student Phone Number
3. `{{3}}` - Urgency Level
4. `{{4}}` - Issue Description
5. `{{5}}` - Session ID

## How to Create the Template

### Option 1: Via WhatsApp Manager (Recommended)
1. Go to [WhatsApp Manager](https://business.whatsapp.com/)
2. Navigate to your Business Account
3. Go to **Account Tools** > **Message Templates**
4. Click **Create Template**
5. Fill in the details:
   - **Template Name**: `counselor_new_session`
   - **Category**: `UTILITY`
   - **Language**: English
   - **Header**: None
   - **Body**: Use the template content above
   - **Footer**: None
   - **Buttons**: None (we'll handle actions through follow-up messages)
6. Submit for review

### Option 2: Via API (For Developers)
```bash
curl -X POST \
  "https://graph.facebook.com/v18.0/YOUR_WABA_ID/message_templates" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "counselor_new_session",
    "language": "en",
    "category": "UTILITY",
    "components": [
      {
        "type": "BODY",
        "text": "🆕 New Counseling Session Request\n\n📋 Student Details:\n• Name: {{1}}\n• Phone: {{2}}\n• Urgency: {{3}}\n\n💭 Request Details:\n• Issue: {{4}}\n• Session ID: {{5}}\n\n⏰ Please review and contact the student to schedule the session.\n\n👨‍⚕️ Christ University Student Wellness Team"
      }
    ]
  }'
```

## Template Approval Process
- **Timeline**: Usually 24-48 hours
- **Review Criteria**: Must comply with WhatsApp's messaging policies
- **Status Check**: You can check approval status in WhatsApp Manager

## Implementation Status
✅ **Code Updated**: The bot now automatically tries interactive messages first (for existing counselors) and falls back to template messages (for new counselors).

⏳ **Template Needed**: Create and get approval for the `counselor_new_session` template.

## Testing
1. **Before Template Approval**: New counselors will see an error in logs, but existing counselors will work normally.
2. **After Template Approval**: All counselors (new and existing) will receive notifications.

## Alternative Solution (Immediate)
If you need immediate functionality:
1. Ask new counselors to send any message to the bot first (like "Hi")
2. This opens the 24-hour customer service window
3. They can then receive interactive messages normally

## Support
For template approval issues or questions, contact:
- **WhatsApp Business Support** via WhatsApp Manager
- **Developer**: Gebin George 