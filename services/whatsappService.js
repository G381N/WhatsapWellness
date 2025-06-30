const axios = require('axios');

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

class WhatsAppService {
  constructor() {
    this.baseURL = `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`;
    this.headers = {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    };
  }

  // Send a text message
  async sendTextMessage(to, message) {
    try {
      const data = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: {
          body: message
        }
      };

      const response = await axios.post(this.baseURL, data, { headers: this.headers });
      console.log('✅ Text message sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error sending text message:', error.response?.data || error.message);
      throw error;
    }
  }

  // Send interactive buttons
  async sendButtonMessage(to, bodyText, buttons) {
    try {
      const data = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: {
            text: bodyText
          },
          action: {
            buttons: buttons.map((button, index) => ({
              type: 'reply',
              reply: {
                id: button.id,
                title: button.title
              }
            }))
          }
        }
      };

      const response = await axios.post(this.baseURL, data, { headers: this.headers });
      console.log('✅ Button message sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error sending button message:', error.response?.data || error.message);
      throw error;
    }
  }

  // Send interactive list
  async sendListMessage(to, bodyText, buttonText, sections) {
    try {
      const data = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'interactive',
        interactive: {
          type: 'list',
          body: {
            text: bodyText
          },
          action: {
            button: buttonText,
            sections: sections
          }
        }
      };

      const response = await axios.post(this.baseURL, data, { headers: this.headers });
      console.log('✅ List message sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error sending list message:', error.response?.data || error.message);
      throw error;
    }
  }

  // Send welcome message with main menu
  async sendWelcomeMessage(to, userName) {
    const welcomeText = `Hello ${userName}!

Welcome to *Christ University Student Wellness Support System*

*Privacy Notice:* This WhatsApp chat is completely anonymous and confidential. Your conversations are secure and private.

*We're here for you!* This platform is designed to:
• Connect you with professional counselors
• Provide a safe space for concerns and complaints
• Offer mental health support and resources
• Build a supportive community

Please select an option from the menu below:`;

    const sections = [
      {
        title: "Support Services",
        rows: [
          {
            id: "connect_counselors",
            title: "Connect with Counselors",
            description: "Get professional mental health support"
          },
          {
            id: "anonymous_complaints",
            title: "Anonymous Complaints",
            description: "Submit anonymous concerns safely"
          },
          {
            id: "department_complaints",
            title: "Department Complaints",
            description: "Report department-specific issues"
          }
        ]
      },
      {
        title: "Information & Community",
        rows: [
          {
            id: "community",
            title: "Community Platform",
            description: "Visit our wellness community website"
          },
          {
            id: "about",
            title: "About This Service",
            description: "Learn about our support system"
          }
        ]
      }
    ];

    return await this.sendListMessage(to, welcomeText, "Select Service", sections);
  }

  // Send main menu
  async sendMainMenu(to) {
    const sections = [
      {
        title: "Support Services",
        rows: [
          {
            id: "connect_counselors",
            title: "Connect with Counselors",
            description: "Get professional mental health support"
          },
          {
            id: "anonymous_complaints",
            title: "Anonymous Complaints",
            description: "Submit anonymous concerns safely"
          },
          {
            id: "department_complaints",
            title: "Department Complaints",
            description: "Report department-specific issues"
          }
        ]
      },
      {
        title: "Information & Community",
        rows: [
          {
            id: "community",
            title: "Community Platform",
            description: "Visit our wellness community website"
          },
          {
            id: "about",
            title: "About This Service",
            description: "Learn about our support system"
          }
        ]
      }
    ];

    return await this.sendListMessage(
      to, 
      "Please choose from the options below:", 
      "Select Service", 
      sections
    );
  }

  // Send department selection
  async sendDepartmentSelection(to) {
    const sections = [
      {
        title: "School of Sciences",
        rows: [
          {
            id: "dept_mca",
            title: "MCA",
            description: "Master of Computer Applications"
          },
          {
            id: "dept_msc_aiml",
            title: "MSC AIML",
            description: "MSc Artificial Intelligence & Machine Learning"
          }
        ]
      }
    ];

    return await this.sendListMessage(
      to,
      "Please select your department:",
      "Choose Department",
      sections
    );
  }

  // Send admin/HOD complaint management buttons
  async sendComplaintManagementButtons(to, complaintId, studentPhoneNumber, complaintSummary) {
    const bodyText = `*New Complaint Received*

Complaint ID: *${complaintId}*
Summary: ${complaintSummary}

Please choose an action:`;

    const buttons = [
      {
        id: `dashboard_${complaintId}`,
        title: "📊 Open Dashboard"
      },
      {
        id: `chat_${studentPhoneNumber}`,
        title: "💬 Message Student"
      },
      {
        id: `call_${studentPhoneNumber}`,
        title: "📞 Call Student"
      }
    ];

    return await this.sendButtonMessage(to, bodyText, buttons);
  }

  // Send URL button message (for dashboard links)
  async sendUrlButtonMessage(to, bodyText, buttonText, url) {
    try {
      const data = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'interactive',
        interactive: {
          type: 'cta_url',
          body: {
            text: bodyText
          },
          action: {
            name: 'cta_url',
            parameters: {
              display_text: buttonText,
              url: url
            }
          }
        }
      };

      const response = await axios.post(this.baseURL, data, { headers: this.headers });
      console.log('✅ URL button message sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error sending URL button message:', error.response?.data || error.message);
      throw error;
    }
  }

  // Send notification to HOD/Admin about new complaint
  async notifyComplaintToAdmin(adminPhoneNumber, complaintData) {
    const { id, studentPhone, department, issueType, description, urgency } = complaintData;
    
    // Send the complaint notification with direct action buttons
    return await this.sendDirectActionButtons(
      adminPhoneNumber, 
      id, 
      studentPhone, 
      `${issueType} - ${urgency} - ${department}`
    );
  }

  // Handle complaint management actions
  async handleComplaintAction(from, action, actionData) {
    const actionParts = action.split('_');
    const actionType = actionParts[0];
    const urlType = actionParts[1];
    const targetData = actionParts.slice(2).join('_');

    switch (actionType) {
      case 'dashboard':
        if (urlType === 'url') {
          // Send direct URL button for dashboard
          const complaintId = targetData;
          const dashboardUrl = `https://student-wellness-gamma.vercel.app/dashboard?complaint=${complaintId}`;
          
          return await this.sendDirectUrlButton(
            from,
            `📊 *Dashboard Access*\n\nComplaint ID: *${complaintId}*\n\nClick the button below to open the dashboard directly:`,
            "🔗 Open Dashboard",
            dashboardUrl
          );
        } else {
          // Fallback to old method
          const complaintId = targetData;
          const dashboardUrl = `https://student-wellness-gamma.vercel.app/dashboard?complaint=${complaintId}`;
          
          return await this.sendUrlButtonMessage(
            from,
            `Opening dashboard for Complaint ID: *${complaintId}*\n\nClick the button below to review and manage this complaint:`,
            "🔗 Open Dashboard",
            dashboardUrl
          );
        }

      case 'whatsapp':
        if (urlType === 'url') {
          // Send direct WhatsApp URL button
          const studentPhone = targetData;
          const formattedPhone = studentPhone.startsWith('91') ? studentPhone : `91${studentPhone}`;
          const whatsappUrl = `https://wa.me/${formattedPhone}`;
          
          return await this.sendDirectUrlButton(
            from,
            `💬 *Direct Message Student*\n\nStudent Phone: *+${formattedPhone}*\n\nClick the button below to open WhatsApp chat directly:`,
            "💬 Open WhatsApp Chat",
            whatsappUrl
          );
        }
        break;

      case 'call':
        if (urlType === 'url') {
          // Send direct call URL button
          const studentPhone = targetData;
          const formattedPhone = studentPhone.startsWith('91') ? `+${studentPhone}` : `+91${studentPhone}`;
          const telUrl = `tel:${formattedPhone}`;
          
          return await this.sendDirectUrlButton(
            from,
            `📞 *Call Student Directly*\n\nStudent Phone: *${formattedPhone}*\n\nClick the button below to open your phone dialer:`,
            "📞 Call Now",
            telUrl
          );
        } else {
          // Fallback to old method
          const phoneToCall = targetData;
          const callText = `📞 *Ready to Call Student*

Student Phone: *${phoneToCall}*

Click the number above in WhatsApp to call directly, or copy the number to your phone dialer.

*Alternative:* You can also use the Call button below to open your phone's dialer automatically.`;

          return await this.sendTextMessage(from, callText);
        }

      case 'chat':
        // Handle old chat method
        const studentPhone = targetData;
        const chatMessage = `You can now contact the student directly at: *${studentPhone}*\n\nType your message and I'll help you send it to the student, or use WhatsApp's direct messaging feature.`;
        
        // Send the contact info and offer to facilitate messaging
        await this.sendTextMessage(from, chatMessage);
        
        // Send quick action buttons for common responses
        const quickResponseButtons = [
          {
            id: `quick_acknowledge_${studentPhone}`,
            title: "✅ Acknowledge Receipt"
          },
          {
            id: `quick_schedule_${studentPhone}`,
            title: "📅 Schedule Meeting"
          },
          {
            id: `quick_more_info_${studentPhone}`,
            title: "❓ Request More Info"
          }
        ];
        
        return await this.sendButtonMessage(
          from,
          "Choose a quick response or type your custom message:",
          quickResponseButtons
        );

      case 'quick':
        // Handle quick response actions
        const [responseType, targetPhone] = targetData.split('_');
        return await this.handleQuickResponse(from, responseType, targetPhone);

      default:
        return await this.sendTextMessage(from, "Unknown action. Please try again.");
    }
  }

  // Handle quick response messages
  async handleQuickResponse(adminPhone, responseType, studentPhone) {
    let responseMessage = '';

    switch (responseType) {
      case 'acknowledge':
        responseMessage = `Hi! This is regarding your recent complaint submission to Christ University Student Wellness Support.

We have received your concern and want you to know that we take it seriously. Your complaint has been assigned to the appropriate department for review.

You will hear back from us within 24-48 hours with next steps.

Thank you for bringing this to our attention.

Best regards,
Christ University Wellness Team`;
        break;

      case 'schedule':
        responseMessage = `Hi! Regarding your complaint submission to our Student Wellness Support system.

We would like to schedule a meeting to discuss your concern in detail. Please reply with your preferred:

• Day and time
• Meeting type (In-person/Phone/Video call)
• Any specific requirements

We're committed to resolving your issue promptly.

Best regards,
Christ University Wellness Team`;
        break;

      case 'more':
        responseMessage = `Hi! We're reviewing your complaint submitted to Christ University Student Wellness Support.

To better assist you, could you please provide additional information about:

• Specific dates/times when the issue occurred
• Any witnesses or additional details
• Your preferred resolution outcome

Your detailed response will help us address your concern more effectively.

Best regards,
Christ University Wellness Team`;
        break;
    }

    // Send the response to the student
    await this.sendTextMessage(studentPhone, responseMessage);

    // Confirm to admin that message was sent
    return await this.sendTextMessage(
      adminPhone, 
      `✅ Message sent to student (${studentPhone})\n\n📝 *Message sent:*\n"${responseMessage.substring(0, 100)}..."`
    );
  }

  // Send interactive message with URL buttons for direct actions
  async sendDirectActionButtons(to, complaintId, studentPhoneNumber, complaintSummary) {
    try {
      // Format phone number for international format (assuming Indian numbers)
      const formattedPhone = studentPhoneNumber.startsWith('91') ? 
        `+${studentPhoneNumber}` : `+91${studentPhoneNumber}`;
      
      const data = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: {
            text: `🚨 *New Complaint Alert*

*Complaint ID:* ${complaintId}
*Summary:* ${complaintSummary}
*Submitted:* ${new Date().toLocaleString()}

Choose an action below:`
          },
          action: {
            buttons: [
              {
                type: 'reply',
                reply: {
                  id: `dashboard_url_${complaintId}`,
                  title: '📊 Open Dashboard'
                }
              },
              {
                type: 'reply', 
                reply: {
                  id: `whatsapp_url_${studentPhoneNumber}`,
                  title: '💬 Message Student'
                }
              },
              {
                type: 'reply',
                reply: {
                  id: `call_url_${studentPhoneNumber}`,
                  title: '📞 Call Student'
                }
              }
            ]
          }
        }
      };

      const response = await axios.post(this.baseURL, data, { headers: this.headers });
      console.log('✅ Direct action buttons sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error sending direct action buttons:', error.response?.data || error.message);
      throw error;
    }
  }

  // Send URL button message that opens directly
  async sendDirectUrlButton(to, bodyText, buttonText, url, buttonType = 'url') {
    try {
      const data = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'interactive',
        interactive: {
          type: 'cta_url',
          body: {
            text: bodyText
          },
          action: {
            name: 'cta_url',
            parameters: {
              display_text: buttonText,
              url: url
            }
          }
        }
      };

      const response = await axios.post(this.baseURL, data, { headers: this.headers });
      console.log('✅ Direct URL button sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error sending direct URL button:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new WhatsAppService(); 